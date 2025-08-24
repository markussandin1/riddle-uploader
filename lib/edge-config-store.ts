import { get } from '@vercel/edge-config';
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

// Helper to get base URL automatically
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

// Edge Config keys
const FEED_ITEMS_KEY = 'feed-items';
const SCHEDULED_JOBS_KEY = 'scheduled-jobs';

// Note: Edge Config is read-only from API routes
// We need to use a hybrid approach with in-memory fallback for writes
let memoryFeedItems: FeedItem[] = [];
let memoryScheduledJobs: ScheduledJob[] = [];

// Feed Items
export const loadFeedItems = async (): Promise<FeedItem[]> => {
  try {
    // Try to get from Edge Config first
    const configItems = await get<FeedItem[]>(FEED_ITEMS_KEY);
    
    if (configItems && configItems.length > 0) {
      // Convert date strings back to Date objects and update memory
      const items = configItems.map(item => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));
      memoryFeedItems = items;
      return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    }
    
    // Fallback to memory if Edge Config is empty
    return [...memoryFeedItems].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  } catch (error) {
    console.error('Error loading feed items from Edge Config:', error);
    // Fallback to memory
    return [...memoryFeedItems].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
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

  // Add to memory immediately for instant access
  memoryFeedItems.unshift(newItem);
  
  // Keep only last 50 items
  if (memoryFeedItems.length > 50) {
    memoryFeedItems = memoryFeedItems.slice(0, 50);
  }

  // Note: To update Edge Config, you need to use the Vercel API or Dashboard
  // For now, we rely on in-memory storage which works for short-term persistence
  
  return newItem;
};

// Scheduled Jobs (similar pattern)
export const loadScheduledJobs = async (): Promise<ScheduledJob[]> => {
  try {
    const configJobs = await get<ScheduledJob[]>(SCHEDULED_JOBS_KEY);
    
    if (configJobs && configJobs.length > 0) {
      memoryScheduledJobs = configJobs;
      return [...configJobs];
    }
    
    return [...memoryScheduledJobs];
  } catch (error) {
    console.error('Error loading scheduled jobs from Edge Config:', error);
    return [...memoryScheduledJobs];
  }
};

export const addScheduledJob = async (name: string, cronPattern: string, enabled: boolean = true): Promise<ScheduledJob> => {
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };

  memoryScheduledJobs.push(newJob);
  return newJob;
};

export const updateScheduledJob = async (id: string, updates: Partial<ScheduledJob>): Promise<boolean> => {
  const index = memoryScheduledJobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    memoryScheduledJobs[index] = { ...memoryScheduledJobs[index], ...updates };
    return true;
  }
  
  return false;
};

export const deleteScheduledJob = async (id: string): Promise<boolean> => {
  const index = memoryScheduledJobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    memoryScheduledJobs.splice(index, 1);
    return true;
  }
  
  return false;
};