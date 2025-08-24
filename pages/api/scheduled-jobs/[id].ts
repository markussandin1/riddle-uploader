import type { NextApiRequest, NextApiResponse } from 'next';
import { updateScheduledJob, deleteScheduledJob, loadScheduledJobs } from '../../../lib/kv-store';
import { startJob, stopJob, restartJob } from '../../../lib/memory-scheduler';
import * as cron from 'node-cron';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { enabled, name, cronPattern } = req.body;
      const updates: any = {};
      
      if (typeof enabled === 'boolean') {
        updates.enabled = enabled;
      }
      if (name) {
        updates.name = name;
      }
      if (cronPattern) {
        if (!cron.validate(cronPattern)) {
          return res.status(400).json({ error: 'Invalid cron pattern' });
        }
        updates.cronPattern = cronPattern;
      }
      
      const success = updateScheduledJob(id, updates);
      
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      // Handle job state changes
      const jobs = await loadScheduledJobs();
      const job = jobs.find(j => j.id === id);
      
      if (job) {
        if (typeof enabled === 'boolean') {
          if (enabled) {
            startJob(job.id, job.name, job.cronPattern);
          } else {
            stopJob(job.id);
          }
        } else if (name || cronPattern) {
          // Restart job with new parameters
          restartJob(job.id, job.name, job.cronPattern);
        }
      }
      
      return res.status(200).json({ message: 'Job updated successfully' });
    } catch (error) {
      console.error('Error updating scheduled job:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      // Stop the job first
      stopJob(id);
      
      const success = deleteScheduledJob(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      return res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting scheduled job:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}