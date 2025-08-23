import { useState } from 'react';
import Head from 'next/head';

export default function TriggerPage() {
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

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
      } else {
        showMessage('error', 'Fel vid skapande av trigger');
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
        <title>RSS Trigger</title>
        <meta name="description" content="Skapa RSS trigger för AI workflows" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <div className="header">
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

        <div className="card">
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
        </div>

        <style jsx>{`
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .header {
            margin-bottom: 40px;
          }

          .rss-link {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e9ecef;
            text-align: center;
          }

          .rss-link code {
            background: #fff;
            padding: 10px 15px;
            border-radius: 6px;
            margin: 0 15px;
            font-family: 'Monaco', monospace;
            border: 1px solid #ddd;
            font-size: 14px;
            display: inline-block;
          }

          .copy-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
            transition: background-color 0.2s;
          }

          .copy-btn:hover {
            background: #0056b3;
          }

          .card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }

          .card h2 {
            margin-bottom: 30px;
            color: #333;
            text-align: center;
            font-size: 28px;
          }

          .form {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            font-weight: 500;
            color: #333;
            font-size: 16px;
          }

          .form-group input,
          .form-group textarea {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
            font-family: inherit;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #007bff;
          }

          .btn-primary {
            padding: 18px 30px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 18px;
            background: #28a745;
            color: white;
            transition: all 0.2s;
            margin-top: 10px;
          }

          .btn-primary:hover:not(:disabled) {
            background: #218838;
            transform: translateY(-1px);
          }

          .btn-primary:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
          }

          .message {
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid;
            font-weight: 500;
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

          @media (max-width: 600px) {
            .container {
              padding: 20px 15px;
            }
            
            .card {
              padding: 30px 20px;
            }
            
            .card h2 {
              font-size: 24px;
            }
            
            .rss-link code {
              margin: 10px 0;
              display: block;
            }
            
            .copy-btn {
              margin-left: 0;
              margin-top: 10px;
            }
          }
        `}</style>
      </main>
    </>
  );
}