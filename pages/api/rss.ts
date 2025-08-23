import type { NextApiRequest, NextApiResponse } from 'next';
import { loadFeedItems } from '../../lib/feed-store';
import { generateRSSFeed } from '../../lib/rss-generator';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const feedItems = loadFeedItems();
    const rssContent = generateRSSFeed(feedItems, 'RSS Trigger Feed');
    
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    return res.status(200).send(rssContent);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}