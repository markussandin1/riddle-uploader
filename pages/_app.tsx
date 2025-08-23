import { useEffect } from 'react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize scheduler on app startup
    const initScheduler = async () => {
      try {
        await fetch('/api/init-scheduler', { method: 'POST' });
        console.log('Scheduler initialized');
      } catch (error) {
        console.error('Failed to initialize scheduler:', error);
      }
    };
    
    initScheduler();
  }, []);

  return <Component {...pageProps} />;
}