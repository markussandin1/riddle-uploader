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
        <div className="hero-header">
          <div className="hero-section">
            <div className="hero-icon">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="hero-title">Advanced Quiz Automation</h1>
            <p className="hero-description">Create and schedule automated quiz generation with comprehensive workflow management</p>
          </div>
          
          <div className="info-banner">
            <div className="info-content">
              <div className="info-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="info-text">
                <p>AI-powered system analyzes popular articles and creates customized news quizzes automatically</p>
                <div className="rss-url-display">
                  <label>RSS Feed URL:</label>
                  <code>{baseUrl}/api/rss</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="dashboard-grid">
          {/* Manual Quiz Creation */}
          <section className="card primary-card">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="header-content">
                <h2>Create Manual Quiz</h2>
                <p>Generate instant quiz requests for processing</p>
              </div>
            </div>
            
            <form onSubmit={triggerManual} className="modern-form">
              <div className="form-field">
                <label htmlFor="title" className="field-label">News website for quiz creation</label>
                <input
                  id="title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. cnn.com, bbc.co.uk, reuters.com"
                  className="field-input"
                />
                <p className="field-hint">Enter domain name or website title</p>
              </div>
              
              <div className="form-field">
                <label htmlFor="description" className="field-label">Special requirements (optional)</label>
                <textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. Focus on sports, politics, or technology"
                  rows={3}
                  className="field-textarea"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary submit-btn">
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Quiz...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Create Quiz Now
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Scheduled Jobs */}
          <section className="card scheduler-card">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="header-content">
                <h2>Automated Scheduling</h2>
                <p>Set up recurring quiz generation</p>
              </div>
            </div>
            
            <form onSubmit={addScheduledJob} className="modern-form">
              <div className="form-field">
                <label htmlFor="job-name" className="field-label">Schedule name</label>
                <input
                  id="job-name"
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g. 'Daily Tech News Quiz'"
                  required
                  className="field-input"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="cron-pattern" className="field-label">Cron schedule pattern</label>
                <input
                  id="cron-pattern"
                  type="text"
                  value={cronPattern}
                  onChange={(e) => setCronPattern(e.target.value)}
                  placeholder="e.g. '0 9 * * *' for daily at 9:00 AM"
                  required
                  className="field-input"
                />
                <div className="cron-examples">
                  <p className="field-hint">Common patterns:</p>
                  <div className="example-grid">
                    <span><code>0 9 * * *</code> Daily at 9:00 AM</span>
                    <span><code>0 9 * * 1</code> Mondays at 9:00 AM</span>
                    <span><code>0 18 * * 5</code> Fridays at 6:00 PM</span>
                  </div>
                </div>
              </div>
              
              <button type="submit" className="btn-secondary submit-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Schedule
              </button>
            </form>

            {scheduledJobs.length > 0 && (
              <div className="schedules-section">
                <div className="section-title">
                  <h3>Active Schedules</h3>
                  <span className="schedule-count">{scheduledJobs.length} schedule{scheduledJobs.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="schedules-grid">
                  {scheduledJobs.map(job => (
                    <div key={job.id} className="schedule-card">
                      <div className="schedule-header">
                        <div className="schedule-info">
                          <h4 className="schedule-name">{job.name}</h4>
                          <div className="schedule-pattern">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <code>{job.cronPattern}</code>
                          </div>
                          {job.lastRun && (
                            <div className="last-run">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Last run: {new Date(job.lastRun).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                        <div className="schedule-status">
                          <span className={`status-badge ${job.enabled ? 'active' : 'inactive'}`}>
                            {job.enabled ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      <div className="schedule-actions">
                        <button
                          onClick={() => toggleJob(job.id, !job.enabled)}
                          className={`btn-ghost toggle-btn ${job.enabled ? 'pause' : 'play'}`}
                        >
                          {job.enabled ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pause
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Resume
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="btn-error delete-btn"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Recent Requests */}
          <section className="card requests-card">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="header-content">
                <h2>Recent Requests</h2>
                <p>Latest quiz generation requests</p>
              </div>
            </div>
            {feedItems.length > 0 ? (
              <div className="requests-list">
                {feedItems.slice(0, 5).map(item => (
                  <div key={item.id} className="request-item">
                    <div className="request-icon">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="request-content">
                      <div className="request-title">Quiz request: {item.title}</div>
                      {item.description && <div className="request-description">{item.description}</div>}
                      <div className="request-date">{new Date(item.pubDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</div>
                    </div>
                    <div className="request-status">
                      <span className="status-indicator processing">Processing</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3>No requests yet</h3>
                <p>Your quiz requests will appear here</p>
              </div>
            )}
          </section>

          {/* Created Quizzes */}
          <section className="card results-card">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="header-content">
                <h2>Completed Quizzes</h2>
                <p>Generated quiz results</p>
              </div>
              <button 
                onClick={() => fetch('/api/created-quizzes').then(res => res.json()).then(setCreatedQuizzes).catch(() => {})}
                className="btn-ghost refresh-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            {createdQuizzes.length > 0 ? (
              <div className="quiz-grid">
                {createdQuizzes.slice(0, 6).map(quiz => (
                  <div key={quiz.id} className="quiz-card">
                    <div className="quiz-card-content">
                      <div className="quiz-header">
                        <h3 className="quiz-title">{quiz.title}</h3>
                        <span className={`status-badge ${quiz.published ? 'published' : 'draft'}`}>
                          {quiz.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="quiz-metadata">
                        <div className="metadata-item">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Created {new Date(quiz.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {quiz.uuid && (
                          <div className="metadata-item">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span>ID: {quiz.uuid.slice(0, 8)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="quiz-actions">
                      {quiz.viewUrl ? (
                        <a 
                          href={quiz.viewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-primary quiz-link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Quiz
                        </a>
                      ) : (
                        <span className="btn-disabled">Not Available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3>No quizzes yet</h3>
                <p>Created quizzes will appear here</p>
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          /* Modern advanced dashboard styles */
          .hero-header {
            text-align: center;
            margin-bottom: var(--space-16);
          }

          .hero-section {
            margin-bottom: var(--space-8);
          }

          .hero-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
            border-radius: var(--radius-xl);
            color: white;
            margin-bottom: var(--space-6);
            box-shadow: var(--shadow-xl);
          }

          .hero-title {
            font-size: var(--text-5xl);
            font-weight: var(--font-extrabold);
            color: var(--secondary-900);
            margin-bottom: var(--space-4);
            background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .hero-description {
            font-size: var(--text-xl);
            color: var(--secondary-600);
            max-width: 700px;
            margin: 0 auto;
            line-height: var(--leading-relaxed);
          }

          .info-banner {
            background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
            border: 2px solid var(--primary-200);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
            max-width: 800px;
            margin: 0 auto;
            box-shadow: var(--shadow-md);
          }

          .info-content {
            display: flex;
            align-items: flex-start;
            gap: var(--space-4);
          }

          .info-icon {
            flex-shrink: 0;
            width: 48px;
            height: 48px;
            background: var(--primary-500);
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .info-text p {
            margin: 0 0 var(--space-3) 0;
            color: var(--primary-800);
            font-weight: var(--font-medium);
            line-height: var(--leading-relaxed);
          }

          .rss-url-display {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }

          .rss-url-display label {
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--primary-700);
          }

          .rss-url-display code {
            background: rgba(255,255,255,0.7);
            padding: var(--space-1) var(--space-2);
            border-radius: var(--radius-sm);
            font-family: var(--font-family-mono);
            font-size: var(--text-sm);
            border: 1px solid var(--primary-300);
          }

          .dashboard-grid {
            display: grid;
            gap: var(--space-8);
            grid-template-columns: 1fr;
            max-width: 1400px;
            margin: 0 auto;
          }

          .primary-card {
            border: 3px solid var(--primary-300);
            background: linear-gradient(135deg, var(--primary-25), white);
          }

          .scheduler-card {
            border: 3px solid var(--secondary-300);
            background: linear-gradient(135deg, var(--secondary-25), white);
          }

          .requests-card {
            border: 2px solid var(--warning-300);
            background: linear-gradient(135deg, var(--warning-25), white);
          }

          .results-card {
            border: 2px solid var(--success-300);
            background: linear-gradient(135deg, var(--success-25), white);
          }

          .card-header {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            margin-bottom: var(--space-8);
          }

          .card-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: var(--shadow-lg);
            flex-shrink: 0;
          }

          .scheduler-card .card-icon {
            background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
          }

          .requests-card .card-icon {
            background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
          }

          .results-card .card-icon {
            background: linear-gradient(135deg, var(--success-500), var(--success-600));
          }

          .header-content {
            flex: 1;
          }

          .header-content h2 {
            margin: 0 0 var(--space-1) 0;
            color: var(--secondary-900);
            font-size: var(--text-2xl);
            font-weight: var(--font-bold);
          }

          .header-content p {
            margin: 0;
            color: var(--secondary-600);
            line-height: var(--leading-relaxed);
          }

          .refresh-button {
            margin-left: auto;
            padding: var(--space-2) var(--space-4);
            font-size: var(--text-sm);
          }

          .modern-form {
            display: flex;
            flex-direction: column;
            gap: var(--space-6);
          }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .field-label {
            font-weight: var(--font-semibold);
            color: var(--secondary-900);
            font-size: var(--text-base);
          }

          .field-input,
          .field-textarea {
            padding: var(--space-4) var(--space-5);
            border: 2px solid var(--secondary-300);
            border-radius: var(--radius-md);
            font-size: var(--text-base);
            font-family: inherit;
            transition: all var(--transition-normal);
            background: white;
            color: var(--secondary-900);
          }

          .field-input:focus,
          .field-textarea:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px var(--primary-100);
          }

          .field-textarea {
            resize: vertical;
            line-height: var(--leading-relaxed);
          }

          .field-hint {
            color: var(--secondary-500);
            font-size: var(--text-sm);
            margin: 0;
            font-weight: var(--font-medium);
          }

          .cron-examples {
            margin-top: var(--space-2);
          }

          .example-grid {
            display: grid;
            gap: var(--space-2);
            grid-template-columns: 1fr;
            margin-top: var(--space-2);
          }

          .example-grid span {
            font-size: var(--text-sm);
            color: var(--secondary-600);
          }

          .example-grid code {
            background: var(--secondary-100);
            padding: var(--space-1) var(--space-2);
            border-radius: var(--radius-sm);
            font-family: var(--font-family-mono);
            margin-right: var(--space-2);
            color: var(--secondary-800);
          }

          .submit-btn {
            padding: var(--space-4) var(--space-8);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
            border-radius: var(--radius-lg);
          }

          .schedules-section {
            margin-top: var(--space-8);
            border-top: 2px solid var(--secondary-100);
            padding-top: var(--space-6);
          }

          .section-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-6);
          }

          .section-title h3 {
            margin: 0;
            color: var(--secondary-900);
            font-size: var(--text-xl);
            font-weight: var(--font-bold);
          }

          .schedule-count {
            background: var(--secondary-100);
            color: var(--secondary-700);
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-full);
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
          }

          .schedules-grid {
            display: grid;
            gap: var(--space-4);
            grid-template-columns: 1fr;
          }

          .schedule-card {
            background: white;
            border: 1px solid var(--secondary-200);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            transition: all var(--transition-normal);
            box-shadow: var(--shadow);
          }

          .schedule-card:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-1px);
          }

          .schedule-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: var(--space-4);
            gap: var(--space-4);
          }

          .schedule-info {
            flex: 1;
          }

          .schedule-name {
            margin: 0 0 var(--space-2) 0;
            color: var(--secondary-900);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
          }

          .schedule-pattern {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin-bottom: var(--space-2);
          }

          .schedule-pattern svg {
            color: var(--secondary-500);
          }

          .schedule-pattern code {
            background: var(--secondary-100);
            padding: var(--space-1) var(--space-2);
            border-radius: var(--radius-sm);
            font-family: var(--font-family-mono);
            font-size: var(--text-sm);
            color: var(--secondary-800);
            border: 1px solid var(--secondary-300);
          }

          .last-run {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--secondary-600);
            font-size: var(--text-sm);
          }

          .last-run svg {
            color: var(--secondary-400);
          }

          .schedule-status {
            flex-shrink: 0;
          }

          .status-badge {
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-full);
            font-size: var(--text-xs);
            font-weight: var(--font-semibold);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .status-badge.active {
            background: var(--success-100);
            color: var(--success-800);
          }

          .status-badge.inactive {
            background: var(--secondary-200);
            color: var(--secondary-700);
          }

          .status-badge.published {
            background: var(--success-500);
            color: white;
          }

          .status-badge.draft {
            background: var(--warning-500);
            color: white;
          }

          .schedule-actions {
            display: flex;
            gap: var(--space-3);
          }

          .toggle-btn {
            padding: var(--space-2) var(--space-4);
            font-size: var(--text-sm);
          }

          .delete-btn {
            padding: var(--space-2) var(--space-4);
            font-size: var(--text-sm);
          }

          .requests-list {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .request-item {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            padding: var(--space-4);
            background: var(--secondary-50);
            border-radius: var(--radius-lg);
            border-left: 4px solid var(--warning-500);
            transition: all var(--transition-normal);
          }

          .request-item:hover {
            background: var(--secondary-100);
          }

          .request-icon {
            width: 40px;
            height: 40px;
            background: var(--warning-100);
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--warning-600);
            flex-shrink: 0;
          }

          .request-content {
            flex: 1;
          }

          .request-title {
            font-weight: var(--font-medium);
            color: var(--secondary-900);
            margin-bottom: var(--space-1);
          }

          .request-description {
            color: var(--secondary-600);
            font-size: var(--text-sm);
            margin-bottom: var(--space-1);
          }

          .request-date {
            color: var(--secondary-500);
            font-size: var(--text-sm);
          }

          .request-status {
            flex-shrink: 0;
          }

          .status-indicator {
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-full);
            font-size: var(--text-xs);
            font-weight: var(--font-semibold);
            text-transform: uppercase;
          }

          .status-indicator.processing {
            background: var(--warning-100);
            color: var(--warning-800);
          }

          .quiz-grid {
            display: grid;
            gap: var(--space-6);
            grid-template-columns: 1fr;
          }

          .quiz-card {
            background: linear-gradient(135deg, var(--success-50), var(--success-25));
            border: 1px solid var(--success-200);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            transition: all var(--transition-normal);
            border-left: 4px solid var(--success-500);
          }

          .quiz-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-xl);
          }

          .quiz-card-content {
            margin-bottom: var(--space-4);
          }

          .quiz-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: var(--space-4);
            gap: var(--space-4);
          }

          .quiz-title {
            color: var(--success-900);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
            margin: 0;
            line-height: var(--leading-tight);
          }

          .quiz-metadata {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .metadata-item {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--secondary-600);
            font-size: var(--text-sm);
          }

          .quiz-actions {
            display: flex;
            justify-content: flex-end;
          }

          .quiz-link {
            padding: var(--space-3) var(--space-5);
            font-size: var(--text-sm);
            border-radius: var(--radius);
          }

          .empty-state {
            text-align: center;
            padding: var(--space-16) var(--space-8);
            color: var(--secondary-500);
          }

          .empty-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: var(--secondary-100);
            border-radius: var(--radius-full);
            margin-bottom: var(--space-6);
            color: var(--secondary-400);
          }

          .empty-state h3 {
            color: var(--secondary-700);
            margin-bottom: var(--space-2);
          }

          .empty-state p {
            color: var(--secondary-500);
            margin: 0;
          }

          /* Utility classes */
          .w-4 { width: 1rem; }
          .h-4 { height: 1rem; }
          .w-5 { width: 1.25rem; }
          .h-5 { height: 1.25rem; }
          .w-8 { width: 2rem; }
          .h-8 { height: 2rem; }
          .w-16 { width: 4rem; }
          .h-16 { height: 4rem; }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .opacity-25 { opacity: 0.25; }
          .opacity-75 { opacity: 0.75; }

          @media (min-width: 768px) {
            .dashboard-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .quiz-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .schedules-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .example-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .quiz-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (max-width: 768px) {
            .hero-title {
              font-size: var(--text-3xl);
            }
            
            .hero-description {
              font-size: var(--text-lg);
            }
            
            .info-content {
              flex-direction: column;
              text-align: center;
            }
            
            .card-header {
              flex-wrap: wrap;
            }
            
            .quiz-header {
              flex-direction: column;
              align-items: start;
              gap: var(--space-2);
            }
            
            .schedule-header {
              flex-direction: column;
              align-items: start;
              gap: var(--space-3);
            }
            
            .schedule-actions {
              width: 100%;
              justify-content: space-between;
            }
            
            .request-item {
              flex-direction: column;
              align-items: start;
              gap: var(--space-3);
            }
            
            .request-status {
              align-self: stretch;
            }
          }
        `}</style>
      </main>
    </>
  );
}