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
        showMessage('success', `🎯 Quiz-förfrågan skickad för: ${result.title}. AI:n arbetar nu med att skapa ditt quiz!`);
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
          <h1>🎯 Skapa Quiz</h1>
          <p>Skriv in vilken sajt du vill skapa ett quiz för</p>
          
          <div className="info-box">
            <p>🤖 AI-systemet analyserar automatiskt de populäraste artiklarna från sajten och skapar ett anpassat nyhetsquiz</p>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="sections">
          {/* Quiz Creation */}
          <section className="card main-card">
            <h2>📝 Skapa Quiz</h2>
            <form onSubmit={triggerManual} className="form">
              <div className="form-group">
                <label htmlFor="title">Vilken nyhetssajt vill du skapa quiz för?</label>
                <input
                  id="title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="t.ex. gd.se, Gävle Dagblad, svt.se, dn.se"
                  required
                />
                <small>Ange domännamn eller sajttitel</small>
              </div>
              
              <button type="submit" disabled={isLoading || !customTitle.trim()} className="btn-primary">
                {isLoading ? '⏳ AI skapar quiz...' : '🎯 Skapa Quiz Nu'}
              </button>
            </form>
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

          {/* Recent Requests */}
          <section className="card">
            <h2>📋 Senaste Quiz-förfrågningar</h2>
            {feedItems.length > 0 ? (
              <div className="feed-items">
                {feedItems.slice(0, 5).map(item => (
                  <div key={item.id} className="feed-item">
                    <div className="feed-title">🎯 Quiz för: {item.title}</div>
                    <div className="feed-date">Skickat: {new Date(item.pubDate).toLocaleString('sv-SE')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Inga quiz-förfrågningar än. Tryck på "Skapa Quiz Nu" för att komma igång!</p>
            )}
          </section>
        </div>

        {/* RSS Feed Info - moved to bottom */}
        <div className="technical-info">
          <details>
            <summary>🔧 Teknisk information</summary>
            <div className="tech-content">
              <p><strong>RSS Feed URL för workflows:</strong></p>
              <code>{baseUrl}/api/rss</code>
              <button 
                onClick={() => navigator.clipboard.writeText(`${baseUrl}/api/rss`)}
                className="copy-btn"
              >
                📋 Kopiera
              </button>
            </div>
          </details>
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
            font-size: 2.5em;
          }

          .header p {
            color: #666;
            font-size: 18px;
            margin-bottom: 20px;
          }

          .info-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
          }

          .info-box p {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
          }

          .sections {
            display: grid;
            gap: 30px;
            grid-template-columns: 1fr;
            max-width: 800px;
            margin: 0 auto;
          }

          .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }

          .main-card {
            border: 3px solid #007bff;
            background: linear-gradient(135deg, #f8f9ff, #ffffff);
          }

          .card h2 {
            margin-bottom: 20px;
            color: #333;
          }

          .form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            font-weight: 600;
            color: #333;
            font-size: 16px;
          }

          .form-group input {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
          }

          .form-group input:focus {
            outline: none;
            border-color: #007bff;
          }

          .form-group small {
            color: #666;
            font-size: 14px;
          }

          .btn-primary {
            padding: 18px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 18px;
            transition: all 0.2s;
            background: #007bff;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #0056b3;
            transform: translateY(-2px);
          }

          .btn-primary:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
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
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 20px;
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

          .technical-info {
            margin-top: 60px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .technical-info details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }

          .technical-info summary {
            font-weight: 500;
            cursor: pointer;
            color: #666;
            font-size: 14px;
          }

          .tech-content {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
          }

          .tech-content code {
            background: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 0 10px;
            font-family: 'Monaco', monospace;
            border: 1px solid #ddd;
            display: inline-block;
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

          @media (max-width: 768px) {
            .container {
              padding: 15px;
            }
            
            .header h1 {
              font-size: 2em;
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