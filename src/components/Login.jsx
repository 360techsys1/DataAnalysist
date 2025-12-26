// Login.jsx - Authentication page for Hilal Foods Chatbot
import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import '../auth.css';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Keeprcar_';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call delay (remove in production if not needed)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Validate credentials
    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Store auth state in localStorage
      localStorage.setItem('hilal_foods_auth', JSON.stringify({
        email: email.trim(),
        authenticated: true,
        timestamp: Date.now()
      }));
      
      onLogin();
    } else {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="gradient-auth">
      <div className="auth-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '0.5rem'
          }}>
            🏢 Hilal Foods
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: '0.9rem',
            margin: 0
          }}>
            Data Analysis Assistant
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-group">
            <label htmlFor="email">
              <FiMail style={{ display: 'inline', marginRight: '0.5rem' }} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="auth-group">
            <label htmlFor="password">
              <FiLock style={{ display: 'inline', marginRight: '0.5rem' }} />
              Password
            </label>
            <div className="password-group">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{ 
                  right: '0.75rem',
                  color: '#718096',
                  fontSize: '1.2rem'
                }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fed7d7',
              color: '#c53030',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <div className="spin" style={{ 
                  display: 'inline-block',
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%'
                }}></div>
                Signing in...
              </>
            ) : (
              <>
                <FiLogIn />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.75rem',
          color: '#a0aec0'
        }}>
          Authorized access only
        </div>
      </div>
    </div>
  );
}

