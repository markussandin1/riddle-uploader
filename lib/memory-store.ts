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

// In-memory storage (will reset on serverless function cold starts)
let feedItems: FeedItem[] = [];
let scheduledJobs: ScheduledJob[] = [];

// Initialize with some sample data if empty
const initializeSampleData = () => {
  if (feedItems.length === 0) {
    feedItems.push({
      id: uuidv4(),
      title: 'Welcome to RSS Triggers',
      description: 'This is your first RSS trigger item. Create more by using the manual trigger or scheduled jobs.',
      link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/trigger/${uuidv4()}`,
      pubDate: new Date(),
      guid: uuidv4()
    });
  }
};

export const loadFeedItems = (): FeedItem[] => {
  initializeSampleData();
  // Return items sorted by date (newest first)
  return [...feedItems].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
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
  
  feedItems.unshift(newItem); // Add to beginning
  
  // Keep only last 50 items in memory
  if (feedItems.length > 50) {
    feedItems = feedItems.slice(0, 50);
  }
  
  return newItem;
};

export const loadScheduledJobs = (): ScheduledJob[] => {
  return [...scheduledJobs];
};

export const addScheduledJob = (name: string, cronPattern: string, enabled: boolean = true): ScheduledJob => {
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };
  
  scheduledJobs.push(newJob);
  return newJob;
};

export const updateScheduledJob = (id: string, updates: Partial<ScheduledJob>): boolean => {
  const index = scheduledJobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    scheduledJobs[index] = { ...scheduledJobs[index], ...updates };
    return true;
  }
  
  return false;
};

export const deleteScheduledJob = (id: string): boolean => {
  const index = scheduledJobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    scheduledJobs.splice(index, 1);
    return true;
  }
  
  return false;
};