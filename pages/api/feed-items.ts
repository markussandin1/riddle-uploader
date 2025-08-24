import type { NextApiRequest, NextApiResponse } from 'next';
import { loadFeedItems } from '../../lib/kv-store';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const feedItems = await loadFeedItems();
    return res.status(200).json(feedItems);
  } catch (error) {
    console.error('Error loading feed items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}