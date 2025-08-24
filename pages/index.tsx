import { useState, useEffect } from 'react';
import Head from 'next/head';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  guid: string;
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

export default function HomePage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [createdQuizzes, setCreatedQuizzes] = useState<CreatedQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [customTitle, setCustomTitle] = useState('');

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
      const [itemsRes, quizzesRes] = await Promise.all([
        fetch('/api/feed-items'),
        fetch('/api/created-quizzes')
      ]);
      
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setFeedItems(items);
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
    if (!customTitle.trim()) return;
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle
        })
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', `🎯 Quiz request sent for: ${result.title}. Your quiz is being created!`);
        setCustomTitle('');
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

  return (
    <>
      <Head>
        <title>Skapa Quiz</title>
        <meta name="description" content="Skapa automatiska quiz baserat på populära artiklar från nyhetssajter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <div className="header">
          <div className="hero-section">
            <div className="hero-icon">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="hero-title">Quiz Generator</h1>
          </div>
          
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="main-grid">
          {/* Quiz Creation */}
          <section className="card main-card">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2>Create New Quiz</h2>
            </div>
            <form onSubmit={triggerManual} className="quiz-form">
              <div className="form-field">
                <label htmlFor="title" className="field-label">Which news website would you like to create a quiz for?</label>
                <input
                  id="title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. cnn.com, bbc.co.uk, reuters.com"
                  required
                  className="field-input"
                />
                <p className="field-hint">Enter domain name or website title</p>
              </div>
              
              <button type="submit" disabled={isLoading || !customTitle.trim()} className="btn-primary submit-btn">
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

          {/* Created Quizzes */}
          <section className="card quiz-results-card">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2>Completed Quizzes</h2>
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
                {createdQuizzes.slice(0, 10).map(quiz => (
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
                <p>Create your first quiz to see it here</p>
              </div>
            )}
          </section>

          {/* Recent Requests */}
          <section className="card recent-requests">
            <div className="card-header">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2>Recent Requests</h2>
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
                      <div className="request-title">Quiz request for: {item.title}</div>
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
        </div>

        {/* RSS Feed Info - moved to bottom */}
        <div className="technical-section">
          <details className="tech-details">
            <summary className="tech-summary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Technical Information
            </summary>
            <div className="tech-content">
              <div className="tech-item">
                <label className="tech-label">RSS Feed URL for workflows:</label>
                <div className="code-block">
                  <code>{baseUrl}/api/rss</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${baseUrl}/api/rss`)}
                    className="btn-ghost copy-button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </details>
        </div>

        <style jsx>{`
          /* Page-specific modern styles */
          .header {
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

          .hero-icon svg {
            width: 40px;
            height: 40px;
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
            max-width: 600px;
            margin: 0 auto;
            line-height: var(--leading-relaxed);
          }

          .info-banner {
            background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
            border: 2px solid var(--primary-200);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
            max-width: 700px;
            margin: 0 auto;
            box-shadow: var(--shadow-md);
          }

          .info-content {
            display: flex;
            align-items: center;
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

          .info-content p {
            margin: 0;
            color: var(--primary-800);
            font-weight: var(--font-medium);
            line-height: var(--leading-relaxed);
          }

          .main-grid {
            display: grid;
            gap: var(--space-8);
            grid-template-columns: 1fr;
            max-width: 1200px;
            margin: 0 auto;
          }

          .main-card {
            border: 3px solid var(--primary-300);
            background: linear-gradient(135deg, var(--primary-25), white);
            position: relative;
            overflow: hidden;
          }

          .main-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-500), var(--primary-600), var(--primary-500));
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
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
          }

          .card-header h2 {
            margin: 0;
            color: var(--secondary-900);
            font-size: var(--text-2xl);
            font-weight: var(--font-bold);
          }

          .card-header .btn-ghost {
            margin-left: auto;
            padding: var(--space-2) var(--space-4);
            font-size: var(--text-sm);
          }

          .quiz-form {
            display: flex;
            flex-direction: column;
            gap: var(--space-8);
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

          .field-input {
            padding: var(--space-4) var(--space-5);
            border: 2px solid var(--secondary-300);
            border-radius: var(--radius-md);
            font-size: var(--text-base);
            transition: all var(--transition-normal);
            background: white;
          }

          .field-input:focus {
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px var(--primary-100);
            outline: none;
          }

          .field-hint {
            color: var(--secondary-500);
            font-size: var(--text-sm);
            margin: 0;
          }

          .submit-btn {
            padding: var(--space-5) var(--space-8);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
            border-radius: var(--radius-lg);
          }

          .quiz-results-card {
            border: 2px solid var(--success-300);
            background: linear-gradient(135deg, var(--success-25), white);
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

          .status-badge {
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-full);
            font-size: var(--text-xs);
            font-weight: var(--font-semibold);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            flex-shrink: 0;
          }

          .status-badge.published {
            background: var(--success-500);
            color: white;
          }

          .status-badge.draft {
            background: var(--warning-500);
            color: white;
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

          .recent-requests .requests-list {
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
            border-left: 4px solid var(--primary-500);
            transition: all var(--transition-normal);
          }

          .request-item:hover {
            background: var(--secondary-100);
          }

          .request-icon {
            width: 40px;
            height: 40px;
            background: var(--primary-100);
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary-600);
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

          .technical-section {
            margin-top: var(--space-20);
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .tech-details {
            background: var(--secondary-50);
            border: 1px solid var(--secondary-200);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }

          .tech-summary {
            padding: var(--space-6);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: var(--space-3);
            font-weight: var(--font-medium);
            color: var(--secondary-700);
            transition: all var(--transition-normal);
          }

          .tech-summary:hover {
            background: var(--secondary-100);
          }

          .tech-content {
            padding: 0 var(--space-6) var(--space-6);
            border-top: 1px solid var(--secondary-200);
          }

          .tech-item {
            margin-bottom: var(--space-4);
          }

          .tech-label {
            display: block;
            font-weight: var(--font-medium);
            color: var(--secondary-700);
            margin-bottom: var(--space-2);
          }

          .code-block {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            background: white;
            border: 1px solid var(--secondary-300);
            border-radius: var(--radius);
            padding: var(--space-3) var(--space-4);
          }

          .code-block code {
            flex: 1;
            font-family: var(--font-family-mono);
            font-size: var(--text-sm);
            color: var(--secondary-800);
            background: transparent;
            border: none;
            padding: 0;
          }

          .copy-button {
            padding: var(--space-2);
            font-size: var(--text-xs);
          }

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
            .main-grid {
              grid-template-columns: 2fr 1fr;
            }
            
            .quiz-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (min-width: 1024px) {
            .quiz-grid {
              grid-template-columns: repeat(2, 1fr);
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
            
            .quiz-header {
              flex-direction: column;
              align-items: start;
              gap: var(--space-2);
            }
            
            .card-header {
              flex-wrap: wrap;
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