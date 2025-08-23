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

const FEED_FILE = path.join(process.cwd(), 'data', 'feed-items.json');
const JOBS_FILE = path.join(process.cwd(), 'data', 'scheduled-jobs.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(FEED_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

export const loadFeedItems = (): FeedItem[] => {
  ensureDataDir();
  try {
    if (fs.existsSync(FEED_FILE)) {
      const data = fs.readFileSync(FEED_FILE, 'utf8');
      const items = JSON.parse(data);
      // Convert date strings back to Date objects
      return items.map((item: any) => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));
    }
  } catch (error) {
    console.error('Error loading feed items:', error);
  }
  return [];
};

export const saveFeedItems = (items: FeedItem[]): void => {
  ensureDataDir();
  try {
    fs.writeFileSync(FEED_FILE, JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Error saving feed items:', error);
  }
};

export const addFeedItem = (title?: string, description?: string): FeedItem => {
  const items = loadFeedItems();
  const newItem: FeedItem = {
    id: uuidv4(),
    title: title || `RSS Trigger ${new Date().toLocaleString('sv-SE')}`,
    description: description || `Triggered at ${new Date().toISOString()}`,
    link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/trigger/${uuidv4()}`,
    pubDate: new Date(),
    guid: uuidv4()
  };
  
  items.unshift(newItem); // Add to beginning
  
  // Keep only last 100 items to prevent file from growing too large
  if (items.length > 100) {
    items.splice(100);
  }
  
  saveFeedItems(items);
  return newItem;
};

export const loadScheduledJobs = (): ScheduledJob[] => {
  ensureDataDir();
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, 'utf8');
      const jobs = JSON.parse(data);
      return jobs.map((job: any) => ({
        ...job,
        lastRun: job.lastRun ? new Date(job.lastRun) : undefined,
        nextRun: job.nextRun ? new Date(job.nextRun) : undefined
      }));
    }
  } catch (error) {
    console.error('Error loading scheduled jobs:', error);
  }
  return [];
};

export const saveScheduledJobs = (jobs: ScheduledJob[]): void => {
  ensureDataDir();
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error saving scheduled jobs:', error);
  }
};

export const addScheduledJob = (name: string, cronPattern: string, enabled: boolean = true): ScheduledJob => {
  const jobs = loadScheduledJobs();
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };
  
  jobs.push(newJob);
  saveScheduledJobs(jobs);
  return newJob;
};

export const updateScheduledJob = (id: string, updates: Partial<ScheduledJob>): boolean => {
  const jobs = loadScheduledJobs();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    saveScheduledJobs(jobs);
    return true;
  }
  
  return false;
};

export const deleteScheduledJob = (id: string): boolean => {
  const jobs = loadScheduledJobs();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    jobs.splice(index, 1);
    saveScheduledJobs(jobs);
    return true;
  }
  
  return false;
};