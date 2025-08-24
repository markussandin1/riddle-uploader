import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

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

// Use /tmp directory for simple persistence in serverless
const TMP_DIR = '/tmp';
const FEED_ITEMS_FILE = path.join(TMP_DIR, 'feed-items.json');
const SCHEDULED_JOBS_FILE = path.join(TMP_DIR, 'scheduled-jobs.json');

// Simple file-based storage using /tmp (temporary but shared across function invocations)
const loadFeedItemsFromFile = (): FeedItem[] => {
  try {
    if (fs.existsSync(FEED_ITEMS_FILE)) {
      const data = fs.readFileSync(FEED_ITEMS_FILE, 'utf8');
      const items = JSON.parse(data);
      // Convert date strings back to Date objects
      return items.map((item: any) => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));
    }
  } catch (error) {
    console.error('Error loading feed items from /tmp:', error);
  }
  return [];
};

const saveFeedItemsToFile = (items: FeedItem[]) => {
  try {
    fs.writeFileSync(FEED_ITEMS_FILE, JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Error saving feed items to /tmp:', error);
  }
};

const loadScheduledJobsFromFile = (): ScheduledJob[] => {
  try {
    if (fs.existsSync(SCHEDULED_JOBS_FILE)) {
      const data = fs.readFileSync(SCHEDULED_JOBS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading scheduled jobs from /tmp:', error);
  }
  return [];
};

const saveScheduledJobsToFile = (jobs: ScheduledJob[]) => {
  try {
    fs.writeFileSync(SCHEDULED_JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error saving scheduled jobs to /tmp:', error);
  }
};

export const loadFeedItems = (): FeedItem[] => {
  const items = loadFeedItemsFromFile();
  // Return items sorted by date (newest first)
  return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
};

export const addFeedItem = (title?: string, description?: string): FeedItem => {
  const newItem: FeedItem = {
    id: uuidv4(),
    title: title || `RSS Trigger ${new Date().toLocaleString('sv-SE')}`,
    description: description || `Triggered at ${new Date().toISOString()}`,
    link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/trigger/${uuidv4()}`,
    pubDate: new Date(),
    guid: uuidv4()
  };
  
  const items = loadFeedItemsFromFile();
  items.unshift(newItem); // Add to beginning
  
  // Keep only last 50 items
  const limitedItems = items.slice(0, 50);
  saveFeedItemsToFile(limitedItems);
  
  return newItem;
};

export const loadScheduledJobs = (): ScheduledJob[] => {
  return loadScheduledJobsFromFile();
};

export const addScheduledJob = (name: string, cronPattern: string, enabled: boolean = true): ScheduledJob => {
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };
  
  const jobs = loadScheduledJobsFromFile();
  jobs.push(newJob);
  saveScheduledJobsToFile(jobs);
  
  return newJob;
};

export const updateScheduledJob = (id: string, updates: Partial<ScheduledJob>): boolean => {
  const jobs = loadScheduledJobsFromFile();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    saveScheduledJobsToFile(jobs);
    return true;
  }
  
  return false;
};

export const deleteScheduledJob = (id: string): boolean => {
  const jobs = loadScheduledJobsFromFile();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    jobs.splice(index, 1);
    saveScheduledJobsToFile(jobs);
    return true;
  }
  
  return false;
};