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

import fs from 'fs';
import path from 'path';

// Use /tmp directory for cross-function persistence in Vercel
const TMP_FEED_FILE = '/tmp/feed-items.json';
const TMP_JOBS_FILE = '/tmp/scheduled-jobs.json';

// Helper functions for file operations
const readFeedItemsFromFile = (): FeedItem[] => {
  try {
    if (fs.existsSync(TMP_FEED_FILE)) {
      const data = fs.readFileSync(TMP_FEED_FILE, 'utf8');
      const items = JSON.parse(data);
      return items.map((item: any) => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));
    }
  } catch (error) {
    console.error('Error reading feed items from /tmp:', error);
  }
  return [];
};

const writeFeedItemsToFile = (items: FeedItem[]) => {
  try {
    fs.writeFileSync(TMP_FEED_FILE, JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Error writing feed items to /tmp:', error);
  }
};

const readScheduledJobsFromFile = (): ScheduledJob[] => {
  try {
    if (fs.existsSync(TMP_JOBS_FILE)) {
      const data = fs.readFileSync(TMP_JOBS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading scheduled jobs from /tmp:', error);
  }
  return [];
};

const writeScheduledJobsToFile = (jobs: ScheduledJob[]) => {
  try {
    fs.writeFileSync(TMP_JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error writing scheduled jobs to /tmp:', error);
  }
};

// Feed Items
export const loadFeedItems = async (): Promise<FeedItem[]> => {
  try {
    // Try to get from Edge Config first (if configured)
    const configItems = await get<FeedItem[]>(FEED_ITEMS_KEY);
    
    if (configItems && configItems.length > 0) {
      const items = configItems.map(item => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));
      return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    }
  } catch (error) {
    console.log('Edge Config not available, using file storage');
  }
  
  // Fallback to file storage
  const fileItems = readFeedItemsFromFile();
  return fileItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
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

  // Get existing items from file
  const existingItems = readFeedItemsFromFile();
  
  // Add new item to beginning
  const updatedItems = [newItem, ...existingItems];
  
  // Keep only last 50 items
  const limitedItems = updatedItems.slice(0, 50);
  
  // Write back to file for cross-function persistence
  writeFeedItemsToFile(limitedItems);
  
  return newItem;
};

// Scheduled Jobs (similar pattern)
export const loadScheduledJobs = async (): Promise<ScheduledJob[]> => {
  try {
    const configJobs = await get<ScheduledJob[]>(SCHEDULED_JOBS_KEY);
    
    if (configJobs && configJobs.length > 0) {
      return [...configJobs];
    }
  } catch (error) {
    console.log('Edge Config not available for jobs, using file storage');
  }
  
  return readScheduledJobsFromFile();
};

export const addScheduledJob = async (name: string, cronPattern: string, enabled: boolean = true): Promise<ScheduledJob> => {
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };

  const existingJobs = readScheduledJobsFromFile();
  const updatedJobs = [...existingJobs, newJob];
  writeScheduledJobsToFile(updatedJobs);
  
  return newJob;
};

export const updateScheduledJob = async (id: string, updates: Partial<ScheduledJob>): Promise<boolean> => {
  const jobs = readScheduledJobsFromFile();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    writeScheduledJobsToFile(jobs);
    return true;
  }
  
  return false;
};

export const deleteScheduledJob = async (id: string): Promise<boolean> => {
  const jobs = readScheduledJobsFromFile();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    jobs.splice(index, 1);
    writeScheduledJobsToFile(jobs);
    return true;
  }
  
  return false;
};