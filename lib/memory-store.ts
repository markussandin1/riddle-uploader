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

// Global in-memory storage - survives across API calls in same serverless function instance
let globalFeedItems: FeedItem[] = [];
let globalScheduledJobs: ScheduledJob[] = [];

// Keep data alive for 10 minutes to handle production serverless function reuse
let lastActivity = Date.now();
const DATA_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const isDataFresh = () => {
  return (Date.now() - lastActivity) < DATA_TIMEOUT;
};

const updateActivity = () => {
  lastActivity = Date.now();
};

export const loadFeedItems = (): FeedItem[] => {
  updateActivity();
  
  // Clear old data if timeout exceeded
  if (!isDataFresh()) {
    globalFeedItems = [];
  }
  
  // Return items sorted by date (newest first)
  return [...globalFeedItems].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
};

export const addFeedItem = (title?: string, description?: string): FeedItem => {
  updateActivity();
  
  const newItem: FeedItem = {
    id: uuidv4(),
    title: title || `RSS Trigger ${new Date().toLocaleString('sv-SE')}`,
    description: description || `Triggered at ${new Date().toISOString()}`,
    link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/trigger/${uuidv4()}`,
    pubDate: new Date(),
    guid: uuidv4()
  };
  
  // Clear old data if timeout exceeded
  if (!isDataFresh()) {
    globalFeedItems = [];
  }
  
  globalFeedItems.unshift(newItem); // Add to beginning
  
  // Keep only last 50 items
  if (globalFeedItems.length > 50) {
    globalFeedItems = globalFeedItems.slice(0, 50);
  }
  
  return newItem;
};

export const loadScheduledJobs = (): ScheduledJob[] => {
  updateActivity();
  
  // Clear old data if timeout exceeded  
  if (!isDataFresh()) {
    globalScheduledJobs = [];
  }
  
  return [...globalScheduledJobs];
};

export const addScheduledJob = (name: string, cronPattern: string, enabled: boolean = true): ScheduledJob => {
  updateActivity();
  
  const newJob: ScheduledJob = {
    id: uuidv4(),
    name,
    cronPattern,
    enabled
  };
  
  // Clear old data if timeout exceeded
  if (!isDataFresh()) {
    globalScheduledJobs = [];
  }
  
  globalScheduledJobs.push(newJob);
  return newJob;
};

export const updateScheduledJob = (id: string, updates: Partial<ScheduledJob>): boolean => {
  updateActivity();
  
  // Clear old data if timeout exceeded
  if (!isDataFresh()) {
    globalScheduledJobs = [];
  }
  
  const index = globalScheduledJobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    globalScheduledJobs[index] = { ...globalScheduledJobs[index], ...updates };
    return true;
  }
  
  return false;
};

export const deleteScheduledJob = (id: string): boolean => {
  updateActivity();
  
  // Clear old data if timeout exceeded
  if (!isDataFresh()) {
    globalScheduledJobs = [];
  }
  
  const index = globalScheduledJobs.findIndex(job => job.id === id);
  
  if (index !== -1) {
    globalScheduledJobs.splice(index, 1);
    return true;
  }
  
  return false;
};