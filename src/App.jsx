// src/App.jsx
import { useState, useEffect } from 'react';
import Chat from './Chat';
import Login from './components/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('hilal_foods_auth');
        if (authData) {
          const { authenticated, timestamp } = JSON.parse(authData);
          // Optional: Add session expiry check (e.g., 24 hours)
          const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
          if (authenticated && (Date.now() - timestamp < SESSION_DURATION)) {
            setIsAuthenticated(true);
          } else {
            // Session expired or invalid
            localStorage.removeItem('hilal_foods_auth');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('hilal_foods_auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hilal_foods_auth');
    setIsAuthenticated(false);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#718096'
      }}>
        Loading...
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show chat interface if authenticated
  return <Chat onLogout={handleLogout} />;
}
