import { FeedItem } from './edge-config-store';

export const generateRSSFeed = (items: FeedItem[], title: string = 'RSS Trigger Feed'): string => {
  const now = new Date().toUTCString();
  
  // Automatically determine base URL based on environment
  const getBaseUrl = () => {
    // In production, use VERCEL_URL if available, otherwise fallback to env var or localhost
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  };
  
  const baseUrl = getBaseUrl();
  
  const rssItems = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="false">${item.guid}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[RSS feed for triggering workflows]]></description>
    <link>${baseUrl}</link>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <language>sv-SE</language>
    <generator>RSS Trigger Generator</generator>
    ${rssItems}
  </channel>
</rss>`;
};