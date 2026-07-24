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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        minHeight: '100vh',
        background: '#0F0F0F',
        color: '#E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Aurora background
        background: 'radial-gradient(circle at top left, #1a0033, #0f0f0f), radial-gradient(circle at bottom right, #003300, #0f0f0f)',
        backgroundSize: '400% 400%',
        position: 'relative'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="glassmorphism"
        style={{
          background: 'rgba(26, 26, 26, 0.8)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.2)',
          border: '1px solid rgba(0, 255, 136, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          // Magnetic hover effect
          onMouseMove: (e) => {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const angleX = (y - centerY) / centerY * 10;
            const angleY = (centerX - x) / centerX * 10;
            e.target.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.02)`;
          },
          onMouseLeave: (e) => {
            e.target.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
          }
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', marginBottom: '24px' }}
        >
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
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ color: '#00FF88', margin: '8px 0 4px', fontSize: '1.5rem', fontWeight: 'bold' }}
          >
            Trading Journal Pro
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{ color: '#B0B0B0', margin: 0, fontSize: '0.9rem' }}
          >
            Your Personal Trading Dashboard
          </motion.p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden' }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setTab('login')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
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
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setTab('register')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
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
          </motion.button>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8 }}
          >
            <motion.label
              whileHover={{ scale: 1.02 }}
              style={labelStyle}
            >
              Email
            </motion.label>
            <motion.input
              whileHover={{ borderColor: '#00FF88' }}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="you@email.com"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0 }}
          >
            <motion.label
              whileHover={{ scale: 1.02 }}
              style={labelStyle}
            >
              Password
            </motion.label>
            <motion.input
              whileHover={{ borderColor: '#00FF88' }}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </motion.div>

          {tab === 'register' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.2 }}
            >
              <motion.label
                whileHover={{ scale: 1.02 }}
                style={labelStyle}
              >
                Confirm Password
              </motion.label>
              <motion.input
                whileHover={{ borderColor: '#00FF88' }}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
              style={{
                color: '#EB5757',
                fontSize: '0.85rem',
                margin: '-4px 0 0 0',
                padding: '8px 12px',
                background: 'rgba(235,87,87,0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(235,87,87,0.3)'
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            type="submit"
            disabled={loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6 }}
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
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
          style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#9B9A97' }}
        >
          {tab === 'login' ? (
            <motion.span
              whileHover={{ scale: 1.05 }}
              onClick={() => setTab('register')}
            >
              Don't have an account?{' '}
              <span style={{ color: '#00FF88', cursor: 'pointer', fontWeight: 'bold' }}>
                Register
              </span>
            </motion.span>
          ) : (
            <motion.span
              whileHover={{ scale: 1.05 }}
              onClick={() => setTab('login')}
            >
              Already have an account?{' '}
              <span style={{ color: '#00FF88', cursor: 'pointer', fontWeight: 'bold' }}>
                Login
              </span>
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;