// Chat.jsx - Hilal Foods Data Analysis Chatbot
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiSend, FiDatabase, FiLogOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './chat.css';

// SQL Viewer Component - Collapsible
function SQLViewer({ sql }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div style={{ 
      marginTop: '1rem', 
      border: '1px solid #e5e7eb', 
      borderRadius: '0.5rem',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#f9fafb',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiDatabase size={16} />
          View SQL Query
        </span>
        {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>
      {isExpanded && (
        <div style={{ 
          padding: '1rem', 
          background: '#1f2937', 
          color: '#f3f4f6',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflowX: 'auto',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {sql}
          </pre>
        </div>
      )}
    </div>
  );
}

// Use relative URL for Vercel deployment, or env var for custom backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000');

const isGreeting = (input) => {
  return /^(hi|hello|hey|greetings?|good\s(morning|afternoon|evening))/i.test(input.trim());
};

export default function Chat({ onLogout }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  // Show welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `# 🏢 Welcome to Hilal Foods Data Analysis Assistant

I'm your intelligent business analyst powered by AI. I can help you analyze:

📊 **Sales Data** - Primary and secondary sales insights
🏭 **Distributor Performance** - Top performers, regional analysis
📦 **Product Analytics** - Best sellers, product comparisons
📈 **Business Insights** - Trends, forecasting, recommendations

**Try asking me:**
• "What are the top 10 distributors by sales in the last 6 months?"
• "Which products were sold most between October and November?"
• "Show me the best-selling product in the last quarter"
• "Compare sales performance across different regions"

How can I help you analyze your business data today?`
      }]);
    }
  }, []);

  // Scroll to bottom on new message/loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submitQuestion = async (questionText) => {
    if (!questionText.trim()) return;

    const userMessage = questionText.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);
    setError(null);

    try {
      // Handle greetings
      if (isGreeting(userMessage)) {
        const greeting = `Hello! 👋 I'm here to help you analyze Hilal Foods business data. What would you like to know about your sales, distributors, or products?`;
        setMessages(prev => [...prev, { role: 'assistant', content: greeting }]);
        setLoading(false);
        return;
      }

      // Prepare conversation history (include metadata from previous queries)
      const history = messages
        .filter(msg => msg.role !== 'system')
        .slice(-4)
        .map((msg, idx, arr) => {
          const historyItem = { role: msg.role, content: msg.content };
          // If this is an assistant message and we have SQL metadata, include it
          if (msg.role === 'assistant' && msg.sql) {
            historyItem.sql = msg.sql;
            historyItem.table = msg.table;
          }
          return historyItem;
        });

      // Call backend API with timeout (65 seconds to account for network overhead)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 seconds
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: userMessage,
            history: history,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout: The server took too long to respond. This may happen if your Ollama server is slow. Please try again or check your Ollama server connection.');
        }
        throw fetchError;
      }

      const data = await response.json();

      if (!response.ok) {
        // Use the user-friendly error message from backend
        const errorMessage = data.message || data.error || 'Failed to get response';
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorMessage
        }]);
        // Only show in error banner if it's a technical error, not user guidance
        if (errorMessage.includes('unexpected error') || errorMessage.includes('temporarily')) {
          setError(errorMessage.substring(0, 100));
        }
        return;
      }

      // Handle suggestion type (rephrased question suggestion)
      if (data.type === 'suggestion' && data.suggestedQuestion) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.answer,
          suggestedQuestion: data.suggestedQuestion,
          type: 'suggestion'
        }]);
        setLoading(false);
        return;
      }

      // Add assistant response (include metadata if available)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        sql: data.sql || null,
        table: data.table || null,
        type: data.type || 'success'
      }]);

    } catch (error) {
      console.error('Error:', error);
      
      // Network or other errors - provide more helpful error messages
      let errorMessage = error.message || 'I encountered an error. Please check your connection and try again.';
      let userFriendlyMessage = errorMessage;
      
      if (error.message && error.message.includes('timeout')) {
        userFriendlyMessage = `⏱️ **Request Timeout**\n\nThe request took too long to complete. This usually happens when:\n\n• Your Ollama server is slow or overloaded\n• The network connection is unstable\n• The question requires complex processing\n\n**Try:**\n• Simplifying your question\n• Checking if your Ollama server is running properly\n• Waiting a moment and trying again`;
      } else if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
        userFriendlyMessage = `🔌 **Connection Error**\n\nUnable to connect to the server. Please check:\n\n• Your internet connection\n• If the backend server is running\n• If your Ollama server is accessible (if using self-hosted)\n\nPlease try again.`;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: userFriendlyMessage
      }]);
      setError(errorMessage.includes('timeout') ? 'Request timeout. Please try again.' : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const questionText = input.trim();
    setInput('');
    await submitQuestion(questionText);
  };

  return (
    <div className="chat-container">
      <header className="chat-header gradient-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <FiDatabase size={24} />
          <h1>Hilal Foods Data Analyst</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="header-badge">
            <span>SQL Server Connected</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <FiLogOut />
              Logout
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <main className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bubble ${msg.role}`}>
            <div className="bubble-content">
              {msg.role === 'assistant' ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                  {msg.suggestedQuestion && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                      <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#1e40af' }}>
                        You can reply with <strong>"yes"</strong> or <strong>"yes, I want that"</strong> to proceed with this question:
                      </p>
                      <button
                        onClick={() => submitQuestion(msg.suggestedQuestion)}
                        style={{
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontWeight: '500',
                          marginRight: '0.5rem'
                        }}
                      >
                        ✓ Use: "{msg.suggestedQuestion}"
                      </button>
                      <button
                        onClick={() => submitQuestion('yes')}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✓ Yes, I want that
                      </button>
                    </div>
                  )}
                  {msg.sql && msg.type === 'success' && (
                    <SQLViewer sql={msg.sql} />
                  )}
                </>
              ) : (
                <div>{msg.content}</div>
              )}
            </div>
            <span className="bubble-role">
              {msg.role === 'user' ? 'You' : 'Hilal Foods AI'}
            </span>
          </div>
        ))}
        {loading && (
          <div className="bubble assistant">
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Analyzing data...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask about sales, distributors, products, or business insights..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="icon-btn send-btn"
          disabled={loading || !input.trim()}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
