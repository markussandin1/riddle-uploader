import { useState, useEffect } from 'react';
import Head from 'next/head';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  guid: string;
}

interface ScheduledJob {
  id: string;
  name: string;
  cronPattern: string;
  enabled: boolean;
  lastRun?: string;
}

export default function RSSTriggersPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [jobName, setJobName] = useState('');
  const [cronPattern, setCronPattern] = useState('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, jobsRes] = await Promise.all([
        fetch('/api/feed-items'),
        fetch('/api/scheduled-jobs')
      ]);
      
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setFeedItems(items);
      }
      
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        setScheduledJobs(jobs);
      }
    } catch (error) {
      showMessage('error', 'Fel vid laddning av data');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const triggerManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle || undefined,
          description: customDescription || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', `RSS trigger skapad: ${result.title}`);
        setCustomTitle('');
        setCustomDescription('');
        fetchData();
      } else {
        showMessage('error', 'Fel vid skapande av trigger');
      }
    } catch (error) {
      showMessage('error', 'Nätverksfel');
    } finally {
      setIsLoading(false);
    }
  };

  const addScheduledJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/scheduled-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: jobName,
          cronPattern: cronPattern,
          enabled: true
        })
      });

      if (response.ok) {
        showMessage('success', `Schemalagt jobb "${jobName}" skapat`);
        setJobName('');
        setCronPattern('');
        fetchData();
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'Fel vid skapande av schemalagt jobb');
      }
    } catch (error) {
      showMessage('error', 'Nätverksfel');
    }
  };

  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        showMessage('success', `Jobb ${enabled ? 'aktiverat' : 'inaktiverat'}`);
        fetchData();
      } else {
        showMessage('error', 'Fel vid uppdatering av jobb');
      }
    } catch (error) {
      showMessage('error', 'Nätverksfel');
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta schemalagda jobb?')) return;
    
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('success', 'Jobb raderat');
        fetchData();
      } else {
        showMessage('error', 'Fel vid radering av jobb');
      }
    } catch (error) {
      showMessage('error', 'Nätverksfel');
    }
  };

  return (
    <>
      <Head>
        <title>RSS Trigger Generator</title>
        <meta name="description" content="Trigger RSS feed updates manually or on schedule" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <div className="header">
          <h1>📡 RSS Trigger Generator</h1>
          <p>Skapa RSS-triggers manuellt eller schemalagt för att trigga dina AI-workflows</p>
          
          <div className="rss-link">
            <strong>RSS Feed URL:</strong>
            <code>{baseUrl}/api/rss</code>
            <button 
              onClick={() => navigator.clipboard.writeText(`${baseUrl}/api/rss`)}
              className="copy-btn"
            >
              📋 Kopiera
            </button>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="sections">
          {/* Manual Trigger */}
          <section className="card">
            <h2>🔥 Manuell Trigger</h2>
            <form onSubmit={triggerManual} className="form">
              <div className="form-group">
                <label htmlFor="title">Sajt att skapa quiz för:</label>
                <input
                  id="title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="t.ex. www.example.com eller Example Company"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Beskrivning (valfri):</label>
                <textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="t.ex. Skapa quiz om företagets produkter eller tjänster"
                  rows={3}
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? '⏳ Skapar...' : '🚀 Trigga Nu'}
              </button>
            </form>
          </section>

          {/* Scheduled Jobs */}
          <section className="card">
            <h2>⏰ Schemalagda Jobb</h2>
            
            <form onSubmit={addScheduledJob} className="form">
              <div className="form-group">
                <label htmlFor="job-name">Jobbnamn:</label>
                <input
                  id="job-name"
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="t.ex. 'Daglig trigger'"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cron-pattern">Cron Pattern:</label>
                <input
                  id="cron-pattern"
                  type="text"
                  value={cronPattern}
                  onChange={(e) => setCronPattern(e.target.value)}
                  placeholder="t.ex. '0 9 * * *' för varje dag 09:00"
                  required
                />
                <small>
                  Exempel: '*/5 * * * *' (var 5:e minut), '0 9 * * *' (09:00 varje dag), '0 9 * * 1' (09:00 varje måndag)
                </small>
              </div>
              
              <button type="submit" className="btn-secondary">
                ➕ Lägg till schemalagt jobb
              </button>
            </form>

            {scheduledJobs.length > 0 && (
              <div className="jobs-list">
                <h3>Aktiva schemalagda jobb:</h3>
                {scheduledJobs.map(job => (
                  <div key={job.id} className="job-item">
                    <div className="job-info">
                      <strong>{job.name}</strong>
                      <span className="cron-pattern">{job.cronPattern}</span>
                      {job.lastRun && <span className="last-run">Senast: {new Date(job.lastRun).toLocaleString('sv-SE')}</span>}
                    </div>
                    <div className="job-actions">
                      <button
                        onClick={() => toggleJob(job.id, !job.enabled)}
                        className={`btn-toggle ${job.enabled ? 'enabled' : 'disabled'}`}
                      >
                        {job.enabled ? '⏸️ Pausa' : '▶️ Starta'}
                      </button>
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="btn-delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Triggers */}
          <section className="card">
            <h2>📋 Senaste Triggers</h2>
            {feedItems.length > 0 ? (
              <div className="feed-items">
                {feedItems.slice(0, 10).map(item => (
                  <div key={item.id} className="feed-item">
                    <div className="feed-title">{item.title}</div>
                    <div className="feed-description">{item.description}</div>
                    <div className="feed-date">{new Date(item.pubDate).toLocaleString('sv-SE')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Inga triggers skapade än. Tryck på "Trigga Nu" för att skapa din första!</p>
            )}
          </section>
        </div>

        <style jsx>{`
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
          }

          .header h1 {
            color: #333;
            margin-bottom: 10px;
          }

          .header p {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
          }

          .rss-link {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }

          .rss-link code {
            background: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 0 10px;
            font-family: 'Monaco', monospace;
            border: 1px solid #ddd;
          }

          .copy-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }

          .copy-btn:hover {
            background: #0056b3;
          }

          .sections {
            display: grid;
            gap: 30px;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }

          .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }

          .card h2 {
            margin-bottom: 20px;
            color: #333;
          }

          .form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .form-group label {
            font-weight: 500;
            color: #333;
          }

          .form-group input,
          .form-group textarea {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
          }

          .form-group small {
            color: #666;
            font-size: 12px;
          }

          .btn-primary, .btn-secondary, .btn-toggle, .btn-delete {
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }

          .btn-primary {
            background: #28a745;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #218838;
          }

          .btn-primary:disabled {
            background: #6c757d;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #007bff;
            color: white;
          }

          .btn-secondary:hover {
            background: #0056b3;
          }

          .jobs-list {
            margin-top: 20px;
          }

          .jobs-list h3 {
            margin-bottom: 15px;
            color: #333;
          }

          .job-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 10px;
          }

          .job-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .cron-pattern {
            font-family: 'Monaco', monospace;
            background: #fff;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            border: 1px solid #ddd;
          }

          .last-run {
            font-size: 12px;
            color: #666;
          }

          .job-actions {
            display: flex;
            gap: 10px;
          }

          .btn-toggle {
            padding: 6px 12px;
            font-size: 12px;
          }

          .btn-toggle.enabled {
            background: #ffc107;
            color: #212529;
          }

          .btn-toggle.disabled {
            background: #6c757d;
            color: white;
          }

          .btn-delete {
            background: #dc3545;
            color: white;
            padding: 6px 10px;
            font-size: 12px;
          }

          .btn-delete:hover {
            background: #c82333;
          }

          .feed-items {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .feed-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #007bff;
          }

          .feed-title {
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
          }

          .feed-description {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
          }

          .feed-date {
            color: #999;
            font-size: 12px;
          }

          .empty-state {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px;
          }

          .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid;
          }

          .message.success {
            background: #d4edda;
            color: #155724;
            border-color: #28a745;
          }

          .message.error {
            background: #f8d7da;
            color: #721c24;
            border-color: #dc3545;
          }

          @media (max-width: 768px) {
            .sections {
              grid-template-columns: 1fr;
            }
            
            .job-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
          }
        `}</style>
      </main>
    </>
  );
}