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
        <div className="header-section">
          <div className="hero-area">
            <div className="hero-icon">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="hero-title">Manual Quiz Trigger</h1>
            <p className="hero-description">Create custom quiz requests for RSS workflow processing</p>
          </div>
          
          <div className="rss-info-card">
            <div className="rss-header">
              <div className="rss-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <div className="rss-content">
                <h3>RSS Feed URL</h3>
                <p>Use this URL for external workflow integrations</p>
              </div>
            </div>
            <div className="code-display">
              <code>{baseUrl}/api/rss</code>
              <button 
                onClick={() => navigator.clipboard.writeText(`${baseUrl}/api/rss`)}
                className="btn-ghost copy-action"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="main-card card">
          <div className="card-header-section">
            <div className="card-icon-wrapper">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div className="card-title-section">
              <h2>Create Manual Trigger</h2>
              <p>Generate a quiz request that will be processed by the RSS workflow</p>
            </div>
          </div>
          
          <form onSubmit={triggerManual} className="trigger-form">
            <div className="form-field-group">
              <label htmlFor="title" className="field-label">Website to create quiz for:</label>
              <input
                id="title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. example.com or Company Name"
                className="field-input-styled"
              />
            </div>
            
            <div className="form-field-group">
              <label htmlFor="description" className="field-label">Additional requirements (optional):</label>
              <textarea
                id="description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="e.g. Focus on technology news or include recent product launches"
                rows={4}
                className="field-textarea-styled"
              />
              <p className="field-helper">Provide specific instructions for the AI quiz generator</p>
            </div>
            
            <button type="submit" disabled={isLoading} className="btn-primary submit-button">
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Trigger...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Trigger
                </>
              )}
            </button>
          </form>
        </div>

        <style jsx>{`
          /* Modern trigger page styles */
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: var(--space-8);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: var(--space-8);
          }

          .header-section {
            text-align: center;
          }

          .hero-area {
            margin-bottom: var(--space-8);
          }

          .hero-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 72px;
            height: 72px;
            background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
            border-radius: var(--radius-xl);
            color: white;
            margin-bottom: var(--space-6);
            box-shadow: var(--shadow-xl);
          }

          .hero-title {
            font-size: var(--text-4xl);
            font-weight: var(--font-bold);
            color: var(--secondary-900);
            margin-bottom: var(--space-4);
            background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .hero-description {
            font-size: var(--text-lg);
            color: var(--secondary-600);
            line-height: var(--leading-relaxed);
          }

          .rss-info-card {
            background: linear-gradient(135deg, var(--secondary-50), white);
            border: 2px solid var(--secondary-200);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
            max-width: 600px;
            margin: 0 auto;
            box-shadow: var(--shadow-md);
          }

          .rss-header {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            margin-bottom: var(--space-4);
          }

          .rss-icon {
            width: 48px;
            height: 48px;
            background: var(--secondary-600);
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          }

          .rss-content h3 {
            margin: 0 0 var(--space-1) 0;
            color: var(--secondary-900);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
          }

          .rss-content p {
            margin: 0;
            color: var(--secondary-600);
            font-size: var(--text-sm);
          }

          .code-display {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            background: white;
            border: 1px solid var(--secondary-300);
            border-radius: var(--radius);
            padding: var(--space-3) var(--space-4);
          }

          .code-display code {
            flex: 1;
            font-family: var(--font-family-mono);
            font-size: var(--text-sm);
            color: var(--secondary-800);
            background: transparent;
            border: none;
            padding: 0;
          }

          .copy-action {
            padding: var(--space-2) var(--space-3);
            font-size: var(--text-xs);
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
            background-size: 200% 100%;
            animation: shimmer 2s ease-in-out infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .card-header-section {
            display: flex;
            align-items: flex-start;
            gap: var(--space-6);
            margin-bottom: var(--space-8);
            padding-bottom: var(--space-6);
            border-bottom: 2px solid var(--primary-100);
          }

          .card-icon-wrapper {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
            border-radius: var(--radius-xl);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: var(--shadow-lg);
            flex-shrink: 0;
          }

          .card-title-section h2 {
            margin: 0 0 var(--space-2) 0;
            color: var(--secondary-900);
            font-size: var(--text-2xl);
            font-weight: var(--font-bold);
          }

          .card-title-section p {
            margin: 0;
            color: var(--secondary-600);
            line-height: var(--leading-relaxed);
          }

          .trigger-form {
            display: flex;
            flex-direction: column;
            gap: var(--space-8);
          }

          .form-field-group {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .field-label {
            font-weight: var(--font-semibold);
            color: var(--secondary-900);
            font-size: var(--text-base);
          }

          .field-input-styled,
          .field-textarea-styled {
            padding: var(--space-4) var(--space-5);
            border: 2px solid var(--secondary-300);
            border-radius: var(--radius-md);
            font-size: var(--text-base);
            font-family: inherit;
            transition: all var(--transition-normal);
            background: white;
            color: var(--secondary-900);
          }

          .field-input-styled:focus,
          .field-textarea-styled:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px var(--primary-100);
          }

          .field-textarea-styled {
            resize: vertical;
            min-height: 120px;
            line-height: var(--leading-relaxed);
          }

          .field-helper {
            color: var(--secondary-500);
            font-size: var(--text-sm);
            margin: 0;
            font-style: italic;
          }

          .submit-button {
            padding: var(--space-5) var(--space-8);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
            border-radius: var(--radius-lg);
            margin-top: var(--space-4);
          }

          .w-4 { width: 1rem; }
          .h-4 { height: 1rem; }
          .w-5 { width: 1.25rem; }
          .h-5 { height: 1.25rem; }
          .w-6 { width: 1.5rem; }
          .h-6 { height: 1.5rem; }
          .w-8 { width: 2rem; }
          .h-8 { height: 2rem; }
          .w-12 { width: 3rem; }
          .h-12 { height: 3rem; }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .opacity-25 { opacity: 0.25; }
          .opacity-75 { opacity: 0.75; }

          @media (max-width: 768px) {
            .container {
              padding: var(--space-4);
            }
            
            .hero-title {
              font-size: var(--text-3xl);
            }
            
            .hero-description {
              font-size: var(--text-base);
            }
            
            .card-header-section {
              flex-direction: column;
              text-align: center;
              gap: var(--space-4);
            }
            
            .rss-header {
              flex-direction: column;
              text-align: center;
              gap: var(--space-3);
            }
            
            .code-display {
              flex-direction: column;
              gap: var(--space-3);
            }
            
            .copy-action {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </main>
    </>
  );
}