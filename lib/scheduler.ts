import * as cron from 'node-cron';
import { loadScheduledJobs, updateScheduledJob, addFeedItem } from './feed-store';

interface ActiveJob {
  id: string;
  task: cron.ScheduledTask;
}

let activeJobs: ActiveJob[] = [];

export const startScheduler = () => {
  console.log('Starting RSS trigger scheduler...');
  
  // Load and start all enabled jobs
  const jobs = loadScheduledJobs();
  
  jobs.forEach(job => {
    if (job.enabled && cron.validate(job.cronPattern)) {
      startJob(job.id, job.name, job.cronPattern);
    }
  });
  
  console.log(`Started ${activeJobs.length} scheduled jobs`);
};

export const startJob = (id: string, name: string, cronPattern: string) => {
  try {
    const task = cron.schedule(cronPattern, () => {
      console.log(`Executing scheduled job: ${name}`);
      
      // Add new RSS item
      const item = addFeedItem(
        `Scheduled: ${name}`,
        `Automatically triggered by scheduled job "${name}" at ${new Date().toISOString()}`
      );
      
      // Update job last run time
      updateScheduledJob(id, { 
        lastRun: new Date(),
        nextRun: getNextRunDate(cronPattern)
      });
      
      console.log(`Created RSS item: ${item.title}`);
    }, {
      scheduled: false // We'll start it manually
    });
    
    task.start();
    activeJobs.push({ id, task });
    
    console.log(`Started job: ${name} with pattern: ${cronPattern}`);
  } catch (error) {
    console.error(`Failed to start job ${name}:`, error);
  }
};

export const stopJob = (id: string) => {
  const index = activeJobs.findIndex(job => job.id === id);
  if (index !== -1) {
    activeJobs[index].task.stop();
    activeJobs.splice(index, 1);
    console.log(`Stopped job: ${id}`);
    return true;
  }
  return false;
};

export const restartJob = (id: string, name: string, cronPattern: string) => {
  stopJob(id);
  startJob(id, name, cronPattern);
};

export const stopAllJobs = () => {
  activeJobs.forEach(job => job.task.stop());
  activeJobs = [];
  console.log('Stopped all scheduled jobs');
};

const getNextRunDate = (cronPattern: string): Date | undefined => {
  try {
    // This is a simplified version - for production you might want to use a more sophisticated library
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000);
    return nextMinute;
  } catch (error) {
    return undefined;
  }
};

export const getActiveJobsCount = () => activeJobs.length;