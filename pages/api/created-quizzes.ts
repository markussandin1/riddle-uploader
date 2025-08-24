import type { NextApiRequest, NextApiResponse } from 'next';
import { loadCreatedQuizzes } from '../../lib/kv-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const quizzes = await loadCreatedQuizzes(limit);
    
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Error fetching created quizzes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
