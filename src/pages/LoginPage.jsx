import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { login, register, saveAuth } from '../auth/authService';
 
const LoginPage = ({ onLogin }) => {
  const [tab, setTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        const res = await login(formData.email, formData.password);
        if (res.token) {
          saveAuth(res.token, res.user);
          onLogin(res.user);
        } else {
          throw new Error(res.error || 'Login failed');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const res = await register(formData.email, formData.password);
        if (res.token) {
          saveAuth(res.token, res.user);
          onLogin(res.user);
        } else {
          throw new Error(res.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#1A1A1A',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '1rem',
    boxSizing: 'border-box',
    outline: 'none'
  };
 
  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.85rem',
    color: '#9B9A97'
  };
 
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        background: '#0F0F0F',
        color: '#E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(26, 26, 26, 0.8)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.2)',
          border: '1px solid rgba(0, 255, 136, 0.1)'
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <svg
            width="52"
            height="52"
            viewBox="0 0 100 120"
            xmlns="http://www.w3.org/2000/svg"
            style={{ margin: '0 auto 12px', display: 'block' }}
          >
            <defs>
              <linearGradient id="boltG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BF8FFF" />
                <stop offset="100%" stopColor="#6A0EDB" />
              </linearGradient>
            </defs>
            <polygon points="62,0 28,55 48,55 18,110 82,50 55,50 72,0" fill="url(#boltG)" />
          </svg>
          <h1 style={{ color: '#00FF88', margin: '8px 0 4px', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Trading Journal Pro
          </h1>
          <p style={{ color: '#B0B0B0', margin: 0, fontSize: '0.9rem' }}>
            Your Personal Trading Dashboard
          </p>
        </div>
 
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => setTab('login')}
            style={{
              flex: 1,
              padding: '12px',
              background: tab === 'login' ? 'rgba(0, 255, 136, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid #00FF88' : '2px solid #333',
              color: tab === 'login' ? '#FFFFFF' : '#B0B0B0',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
          >
            LOGIN
          </button>
          <button
            onClick={() => setTab('register')}
            style={{
              flex: 1,
              padding: '12px',
              background: tab === 'register' ? 'rgba(0, 255, 136, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid #00FF88' : '2px solid #333',
              color: tab === 'register' ? '#FFFFFF' : '#B0B0B0',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
          >
            REGISTER
          </button>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="you@email.com"
              required
            />
          </div>
 
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>
 
          {tab === 'register' && (
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>
          )}
 
          {error && (
            <p style={{ color: '#EB5757', fontSize: '0.85rem', margin: '-4px 0 0 0', padding: '8px 12px', background: 'rgba(235,87,87,0.1)', borderRadius: '6px', border: '1px solid rgba(235,87,87,0.3)' }}>
              ⚠️ {error}
            </p>
          )}
 
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#333' : '#00FF88',
              border: 'none',
              borderRadius: '8px',
              color: loading ? '#888' : '#000000',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '4px'
            }}
          >
            {loading ? 'Processing...' : tab === 'login' ? '🚀 Login' : '✨ Create Account'}
          </button>
        </form>
 
        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#9B9A97' }}>
          {tab === 'login' ? (
            <span>
              Don't have an account?{' '}
              <span onClick={() => setTab('register')} style={{ color: '#00FF88', cursor: 'pointer', fontWeight: 'bold' }}>
                Register
              </span>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <span onClick={() => setTab('login')} style={{ color: '#00FF88', cursor: 'pointer', fontWeight: 'bold' }}>
                Login
              </span>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
 
export default LoginPage;