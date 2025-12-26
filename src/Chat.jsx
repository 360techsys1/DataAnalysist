// Chat.jsx - Hilal Foods Data Analysis Chatbot
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiSend, FiDatabase } from 'react-icons/fi';
import './chat.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const isGreeting = (input) => {
  return /^(hi|hello|hey|greetings?|good\s(morning|afternoon|evening))/i.test(input.trim());
};

export default function Chat() {
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

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          history: history,
        }),
      });

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
          suggestedQuestion: data.suggestedQuestion
        }]);
        return;
      }

      // Add assistant response (include metadata if available)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        sql: data.sql || null,
        table: data.table || null
      }]);

    } catch (error) {
      console.error('Error:', error);
      
      // Network or other errors
      const errorMessage = error.message || 'I encountered an error. Please check your connection and try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Connection Error**\n\n${errorMessage}\n\nPlease try again.`
      }]);
      setError('Connection error. Please try again.');
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
        <div className="header-badge">
          <span>SQL Server Connected</span>
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
                      <button
                        onClick={() => submitQuestion(msg.suggestedQuestion)}
                        style={{
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✓ Use this question: "{msg.suggestedQuestion}"
                      </button>
                    </div>
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
