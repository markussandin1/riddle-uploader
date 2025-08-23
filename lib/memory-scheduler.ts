// Simplified scheduler for Vercel serverless environment
// Note: Scheduled jobs won't persist across serverless function cold starts
// For production, consider using Vercel Cron Jobs or external cron services

import { loadScheduledJobs, addFeedItem } from './memory-store';

let schedulerInitialized = false;

export const startScheduler = () => {
  if (schedulerInitialized) {
    console.log('Scheduler already initialized');
    return;
  }

  console.log('Starting RSS trigger scheduler (memory-based)...');
  
  // Load jobs but don't actually start cron jobs in serverless environment
  const jobs = loadScheduledJobs();
  console.log(`Found ${jobs.length} scheduled jobs (Note: Cron scheduling not available in serverless)`);
  
  schedulerInitialized = true;
};

export const startJob = (id: string, name: string, cronPattern: string) => {
  console.log(`Job registered: ${name} with pattern: ${cronPattern} (Note: Will not run automatically in serverless)`);
  // In serverless, we can't run persistent cron jobs
  // This would need to be handled by Vercel Cron Jobs or external service
};

export const stopJob = (id: string) => {
  console.log(`Job stopped: ${id}`);
  return true;
};

export const restartJob = (id: string, name: string, cronPattern: string) => {
  stopJob(id);
  startJob(id, name, cronPattern);
};

export const stopAllJobs = () => {
  console.log('All jobs stopped (memory-based)');
};

export const getActiveJobsCount = () => 0; // No active jobs in serverless

// Manual trigger function for testing scheduled job behavior
export const triggerScheduledJob = (jobId: string, jobName: string) => {
  console.log(`Manually triggering scheduled job: ${jobName}`);
  
  const item = addFeedItem(
    `Scheduled: ${jobName}`,
    `Manually triggered scheduled job "${jobName}" at ${new Date().toISOString()}`
  );
  
  return item;
};