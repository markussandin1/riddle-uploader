import type { NextApiRequest, NextApiResponse } from 'next';
import { startScheduler } from '../../lib/memory-scheduler';

let schedulerInitialized = false;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!schedulerInitialized) {
      startScheduler();
      schedulerInitialized = true;
      return res.status(200).json({ message: 'Scheduler initialized successfully' });
    } else {
      return res.status(200).json({ message: 'Scheduler already initialized' });
    }
  } catch (error) {
    console.error('Error initializing scheduler:', error);
    return res.status(500).json({ error: 'Failed to initialize scheduler' });
  }
}