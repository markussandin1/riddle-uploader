import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  guid: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  cronPattern: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

const FEED_ITEMS_KEY = 'rss:feed-items';
const SCHEDULED_JOBS_KEY = 'rss:scheduled-jobs';

// Helper to get base URL automatically
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

// Feed Items
export const loadFeedItems = async (): Promise<FeedItem[]> => {
  try {
    const items = await kv.get<FeedItem[]>(FEED_ITEMS_KEY);
    if (!items) return [];
    
    // Convert date strings back to Date objects
    return items.map(item => ({
      ...item,
      pubDate: new Date(item.pubDate)
    })).sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  } catch (error) {
    console.error('Error loading feed items from KV:', error);
    return [];
  }
};

export const addFeedItem = async (title?: string, description?: string): Promise<FeedItem> => {
  const newItem: FeedItem = {
    id: uuidv4(),
    title: title || `RSS Trigger ${new Date().toLocaleString('sv-SE')}`,
    description: description || `Triggered at ${new Date().toISOString()}`,
    link: `${getBaseUrl()}/trigger/${uuidv4()}`,
    pubDate: new Date(),
    guid: uuidv4()
  };

  try {
    // Get existing items
    const existingItems = await loadFeedItems();
    
    // Add new item to beginning
    const updatedItems = [newItem, ...existingItems];
    
    // Keep only last 50 items
    const limitedItems = updatedItems.slice(0, 50);
    
    // Save to KV
    await kv.set(FEED_ITEMS_KEY, limitedItems);
    
    return newItem;
  } catch (error) {
    console.error('Error adding feed item to KV:', error);
    throw error;
  }
};

// Scheduled Jobs
export const loadScheduledJobs = async (): Promise<ScheduledJob[]> => {
  try {
    const jobs = await kv.get<ScheduledJob[]>(SCHEDULED_JOBS_KEY);
    return jobs || [];
  } catch (error) {
    console.error('Error loading scheduled jobs from KV:', error);
    return [];
  }
};

export const addScheduledJob = async (name: string, cronPattern: string, enabled: boolean = true): Promise<ScheduledJob> => {
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };

  try {
    const existingJobs = await loadScheduledJobs();
    const updatedJobs = [...existingJobs, newJob];
    
    await kv.set(SCHEDULED_JOBS_KEY, updatedJobs);
    return newJob;
  } catch (error) {
    console.error('Error adding scheduled job to KV:', error);
    throw error;
  }
};

export const updateScheduledJob = async (id: string, updates: Partial<ScheduledJob>): Promise<boolean> => {
  try {
    const jobs = await loadScheduledJobs();
    const index = jobs.findIndex(job => job.id === id);
    
    if (index !== -1) {
      jobs[index] = { ...jobs[index], ...updates };
      await kv.set(SCHEDULED_JOBS_KEY, jobs);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating scheduled job in KV:', error);
    return false;
  }
};

export const deleteScheduledJob = async (id: string): Promise<boolean> => {
  try {
    const jobs = await loadScheduledJobs();
    const index = jobs.findIndex(job => job.id === id);
    
    if (index !== -1) {
      jobs.splice(index, 1);
      await kv.set(SCHEDULED_JOBS_KEY, jobs);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting scheduled job from KV:', error);
    return false;
  }
};