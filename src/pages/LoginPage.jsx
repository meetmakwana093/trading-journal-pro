import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register, saveAuth } from '../auth/authService';

const LoginPage = ({ onLogin }) => {
  const [tab, setTab] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

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
        if (res.token) { saveAuth(res.token, res.user); onLogin(res.user); }
        else throw new Error(res.error || 'Login failed');
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
        const res = await register(formData.email, formData.password);
        if (res.token) { saveAuth(res.token, res.user); onLogin(res.user); }
        else throw new Error(res.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080B14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif'
    }}>
      {/* AURORA BG */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(0,255,136,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 70% 80%, rgba(139,92,246,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)'
      }} />

      {/* GRID LINES */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* FLOATING ORBS */}
      {[
        { top: '15%', left: '10%', size: 300, color: 'rgba(0,255,136,0.04)', delay: 0 },
        { top: '60%', right: '10%', size: 250, color: 'rgba(139,92,246,0.05)', delay: 1 },
        { top: '40%', left: '60%', size: 200, color: 'rgba(59,130,246,0.04)', delay: 0.5 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6 + i, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: orb.top, left: orb.left, right: orb.right,
            width: orb.size, height: orb.size, borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(40px)', pointerEvents: 'none'
          }}
        />
      ))}

      {/* LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '420px', margin: '0 20px',
          background: 'rgba(13,17,28,0.85)',
          backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '24px', padding: '40px 36px',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.05), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}
      >
        {/* TOP GLOW LINE */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)',
          borderRadius: '1px'
        }} />

        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center', marginBottom: '28px' }}
        >
          <motion.div
            animate={{ filter: ['drop-shadow(0 0 8px rgba(107,14,219,0.4))', 'drop-shadow(0 0 16px rgba(107,14,219,0.7))', 'drop-shadow(0 0 8px rgba(107,14,219,0.4))'] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ display: 'inline-block', marginBottom: '16px' }}
          >
            <svg width="48" height="48" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="loginBoltG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BF8FFF" />
                  <stop offset="100%" stopColor="#6A0EDB" />
                </linearGradient>
              </defs>
              <polygon points="62,0 28,55 48,55 18,110 82,50 55,50 72,0" fill="url(#loginBoltG)" />
            </svg>
          </motion.div>
          <h1 style={{
            fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px',
            background: 'linear-gradient(135deg, #ffffff 0%, #00FF88 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Trading Journal Pro
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', margin: 0, letterSpacing: '0.02em' }}>
            Your personal trading command center
          </p>
        </motion.div>

        {/* TABS */}
        <div style={{
          display: 'flex', marginBottom: '24px',
          background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {['login', 'register'].map((t) => (
            <motion.button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '10px',
                background: tab === t ? 'rgba(0,255,136,0.12)' : 'transparent',
                border: tab === t ? '1px solid rgba(0,255,136,0.25)' : '1px solid transparent',
                borderRadius: '9px',
                color: tab === t ? '#00FF88' : 'rgba(255,255,255,0.35)',
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer', fontSize: '0.82rem',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif'
              }}
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </motion.button>
          ))}
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AnimatePresence mode="wait">
            {[
              { name: 'email', type: 'email', label: 'Email address', placeholder: 'you@email.com', show: true },
              { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', show: true },
              { name: 'confirmPassword', type: 'password', label: 'Confirm password', placeholder: '••••••••', show: tab === 'register' },
            ].filter(f => f.show).map((field, i) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <label style={{
                  display: 'block', marginBottom: '6px',
                  fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.06em', textTransform: 'uppercase'
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  onFocus={() => setFocused(field.name)}
                  onBlur={() => setFocused('')}
                  placeholder={field.placeholder}
                  required
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: focused === field.name ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.04)',
                    border: focused === field.name ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#ffffff', fontSize: '0.9rem',
                    outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: focused === field.name ? '0 0 0 3px rgba(0,255,136,0.08)' : 'none'
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ERROR */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  color: '#FF5555', fontSize: '0.82rem',
                  padding: '10px 14px',
                  background: 'rgba(255,51,51,0.08)',
                  borderRadius: '8px', border: '1px solid rgba(255,51,51,0.2)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SUBMIT */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02, boxShadow: '0 8px 30px rgba(0,255,136,0.3)' } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            style={{
              width: '100%', padding: '13px',
              background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
              border: 'none', borderRadius: '10px',
              color: loading ? 'rgba(255,255,255,0.3)' : '#000000',
              fontWeight: 700, fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', marginTop: '4px',
              fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(0,255,136,0.2)'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
                Processing...
              </span>
            ) : tab === 'login' ? '→ Sign In' : '✦ Create Account'}
          </motion.button>
        </form>

        {/* FOOTER */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>
          {tab === 'login' ? (
            <span>
              No account?{' '}
              <span onClick={() => setTab('register')} style={{ color: '#00FF88', cursor: 'pointer', fontWeight: 600 }}>
                Create one free
              </span>
            </span>
          ) : (
            <span>
              Have an account?{' '}
              <span onClick={() => setTab('login')} style={{ color: '#00FF88', cursor: 'pointer', fontWeight: 600 }}>
                Sign in
              </span>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
