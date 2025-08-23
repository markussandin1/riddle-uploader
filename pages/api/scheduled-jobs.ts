import type { NextApiRequest, NextApiResponse } from 'next';
import { loadScheduledJobs, addScheduledJob } from '../../lib/feed-store';
import { startJob } from '../../lib/scheduler';
import * as cron from 'node-cron';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const jobs = loadScheduledJobs();
      return res.status(200).json(jobs);
    } catch (error) {
      console.error('Error loading scheduled jobs:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { name, cronPattern, enabled = true } = req.body;
      
      if (!name || !cronPattern) {
        return res.status(400).json({ error: 'Name and cron pattern are required' });
      }
      
      // Validate cron pattern
      if (!cron.validate(cronPattern)) {
        return res.status(400).json({ error: 'Invalid cron pattern' });
      }
      
      const newJob = addScheduledJob(name, cronPattern, enabled);
      
      // Start the job if it's enabled
      if (enabled) {
        startJob(newJob.id, newJob.name, newJob.cronPattern);
      }
      
      return res.status(201).json(newJob);
    } catch (error) {
      console.error('Error creating scheduled job:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}