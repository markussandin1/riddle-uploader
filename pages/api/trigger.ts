import type { NextApiRequest, NextApiResponse } from 'next';
import { addFeedItem } from '../../lib/feed-store';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description } = req.body;
    
    const newItem = addFeedItem(title, description);
    
    return res.status(201).json({
      message: 'RSS trigger created successfully',
      title: newItem.title,
      id: newItem.id,
      pubDate: newItem.pubDate
    });
  } catch (error) {
    console.error('Error creating RSS trigger:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}