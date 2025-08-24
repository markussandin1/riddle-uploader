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

interface CreatedQuiz {
  id: string;
  uuid: string;
  title: string;
  viewUrl: string | null;
  created: string;
  published: boolean;
  publishedAt: string | null;
  sourceRequest?: string;
  timestamp: string;
}

export default function RSSTriggersPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [createdQuizzes, setCreatedQuizzes] = useState<CreatedQuiz[]>([]);
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
    
    // Auto-refresh every 30 seconds to show new quizzes
    const interval = setInterval(() => {
      fetch('/api/created-quizzes')
        .then(res => res.ok ? res.json() : [])
        .then(quizzes => setCreatedQuizzes(quizzes))
        .catch(() => {}); // Silent fail
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, jobsRes, quizzesRes] = await Promise.all([
        fetch('/api/feed-items'),
        fetch('/api/scheduled-jobs'),
        fetch('/api/created-quizzes')
      ]);
      
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setFeedItems(items);
      }
      
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        setScheduledJobs(jobs);
      }
      
      if (quizzesRes.ok) {
        const quizzes = await quizzesRes.json();
        setCreatedQuizzes(quizzes);
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
        showMessage('success', `🎯 Quiz-förfrågan skickad för: ${result.title}. AI:n arbetar nu med att skapa ditt quiz!`);
        setCustomTitle('');
        setCustomDescription('');
        fetchData();
      } else {
        showMessage('error', 'Fel vid skapande av quiz-förfrågan');
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
        <title>Quiz Generator för Nyhetssajter</title>
        <meta name="description" content="Skapa automatiska quiz baserat på populära artiklar från nyhetssajter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <div className="header">
          <h1>🎯 Quiz Generator för Nyhetssajter</h1>
          <p>Skapa automatiska quiz baserat på de mest lästa artiklarna från svenska nyhetssajter</p>
          
          <div className="info-box">
            <p>🤖 AI-systemet analyserar automatiskt de populäraste artiklarna från sajten och skapar ett anpassat nyhetsquiz</p>
            <small>Teknisk info: RSS Feed URL för workflows: <code>{baseUrl}/api/rss</code></small>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="sections">
          {/* Manual Quiz Creation */}
          <section className="card">
            <h2>📝 Skapa Quiz</h2>
            <form onSubmit={triggerManual} className="form">
              <div className="form-group">
                <label htmlFor="title">Vilken nyhetssajt vill du skapa quiz för?</label>
                <input
                  id="title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="t.ex. dn.se, svt.se, aftonbladet.se"
                />
                <small>Ange domännamn eller sajttitel</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Särskilda önskemål (valfri):</label>
                <textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="t.ex. Fokusera på sport, politik eller ekonomi"
                  rows={3}
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? '⏳ AI skapar quiz...' : '🎯 Skapa Quiz Nu'}
              </button>
            </form>
          </section>

          {/* Scheduled Jobs */}
          <section className="card">
            <h2>⏰ Automatisk Quiz-generering</h2>
            
            <form onSubmit={addScheduledJob} className="form">
              <div className="form-group">
                <label htmlFor="job-name">Namn på automatiska quiz:</label>
                <input
                  id="job-name"
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="t.ex. 'Dagens SVT Nyhetsquiz'"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cron-pattern">Schemalägga när:</label>
                <input
                  id="cron-pattern"
                  type="text"
                  value={cronPattern}
                  onChange={(e) => setCronPattern(e.target.value)}
                  placeholder="t.ex. '0 9 * * *' för varje dag kl 09:00"
                  required
                />
                <small>
                  Exempel: '0 9 * * *' (09:00 varje dag), '0 9 * * 1' (09:00 varje måndag), '0 18 * * 5' (18:00 varje fredag)
                </small>
              </div>
              
              <button type="submit" className="btn-secondary">
                ⏰ Schemalägg Quiz
              </button>
            </form>

            {scheduledJobs.length > 0 && (
              <div className="jobs-list">
                <h3>Schemalagda quiz:</h3>
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

          {/* Recent Requests */}
          <section className="card">
            <h2>📋 Senaste Quiz-förfrågningar</h2>
            {feedItems.length > 0 ? (
              <div className="feed-items">
                {feedItems.slice(0, 5).map(item => (
                  <div key={item.id} className="feed-item">
                    <div className="feed-title">🎯 Quiz för: {item.title}</div>
                    <div className="feed-description">{item.description}</div>
                    <div className="feed-date">Skickat: {new Date(item.pubDate).toLocaleString('sv-SE')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Inga quiz-förfrågningar än. Tryck på "Skapa Quiz Nu" för att komma igång!</p>
            )}
          </section>

          {/* Created Quizzes */}
          <section className="card quiz-results">
            <div className="section-header">
              <h2>🎯 Färdiga Quiz</h2>
              <button 
                onClick={() => fetch('/api/created-quizzes').then(res => res.json()).then(setCreatedQuizzes).catch(() => {})}
                className="refresh-btn"
              >
                🔄 Uppdatera
              </button>
            </div>
            {createdQuizzes.length > 0 ? (
              <div className="quiz-items">
                {createdQuizzes.slice(0, 10).map(quiz => (
                  <div key={quiz.id} className="quiz-item">
                    <div className="quiz-info">
                      <div className="quiz-title">
                        <strong>{quiz.title}</strong>
                        <span className={`status ${quiz.published ? 'published' : 'draft'}`}>
                          {quiz.published ? '✅ Publicerat' : '📝 Utkast'}
                        </span>
                      </div>
                      <div className="quiz-meta">
                        <span className="quiz-date">
                          Skapad: {new Date(quiz.timestamp).toLocaleString('sv-SE')}
                        </span>
                        {quiz.uuid && (
                          <span className="quiz-id">ID: {quiz.uuid.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                    <div className="quiz-actions">
                      {quiz.viewUrl ? (
                        <a 
                          href={quiz.viewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-quiz-link"
                        >
                          🚀 Visa Quiz
                        </a>
                      ) : (
                        <span className="btn-disabled">Ej tillgänglig</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Inga quiz skapade än. När AI:n skapar ett quiz från dina förfrågningar visas det här!</p>
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

          .info-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }

          .info-box p {
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 500;
          }

          .info-box small {
            opacity: 0.8;
            font-size: 12px;
          }

          .info-box code {
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', monospace;
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

          .quiz-results {
            border: 2px solid #28a745;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .quiz-results h2 {
            color: #28a745;
            margin: 0;
          }

          .refresh-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
          }

          .refresh-btn:hover {
            background: #138496;
          }

          .quiz-items {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .quiz-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #d4edda, #e8f5e8);
            border-radius: 12px;
            border-left: 4px solid #28a745;
          }

          .quiz-info {
            flex: 1;
          }

          .quiz-title {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 8px;
          }

          .quiz-title strong {
            color: #155724;
            font-size: 16px;
          }

          .status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .status.published {
            background: #28a745;
            color: white;
          }

          .status.draft {
            background: #ffc107;
            color: #212529;
          }

          .quiz-meta {
            display: flex;
            gap: 15px;
            font-size: 13px;
            color: #6c757d;
          }

          .quiz-actions {
            margin-left: 20px;
          }

          .btn-quiz-link {
            background: #007bff;
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            display: inline-block;
          }

          .btn-quiz-link:hover {
            background: #0056b3;
            text-decoration: none;
            color: white;
          }

          .btn-disabled {
            background: #6c757d;
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 14px;
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

            .quiz-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 15px;
            }

            .quiz-actions {
              margin-left: 0;
              width: 100%;
            }

            .btn-quiz-link {
              width: 100%;
              text-align: center;
            }
          }
        `}</style>
      </main>
    </>
  );
}