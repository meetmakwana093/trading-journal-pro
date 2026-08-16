import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getToken } from '../auth/authService';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    starting_balance: 10000,
    max_daily_loss: 500,
    risk_per_trade_percent: 1.0,
    default_session: 'New York',
    default_currency: 'USD'
  });
  const [savedStatus, setSavedStatus] = useState('');

  useEffect(() => {
    fetch(`${API}/settings`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (data) setSettings(data); })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(settings)
    })
      .then(res => res.json())
      .then(() => {
        setSavedStatus('Settings Saved Successfully!');
        setTimeout(() => setSavedStatus(''), 3000);
      })
      .catch(() => alert('Failed to save settings.'));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '900px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>⚙️ RISK & ACCOUNT SETTINGS</h1>
          <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Configure risk guardrails, baseline capital, and platform parameters.</p>
        </div>
        {savedStatus && (
          <span style={{ color: '#00FF88', fontWeight: 700, fontSize: '0.9rem' }}>{savedStatus}</span>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* CAPITAL & LOSS GUARDRAILS */}
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#00FF88', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Account Capital & Drawdown Limits
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Starting Account Capital ($)</label>
              <input
                type="number"
                name="starting_balance"
                value={settings.starting_balance}
                onChange={handleChange}
                style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Max Daily Loss Limit ($)</label>
              <input
                type="number"
                name="max_daily_loss"
                value={settings.max_daily_loss}
                onChange={handleChange}
                style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,51,51,0.3)', color: '#FF5555', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontWeight: 700 }}
                required
              />
            </div>
          </div>
        </div>

        {/* RISK EXECUTION PARAMETERS */}
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#2D9CDB', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Execution Defaults
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Target Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                name="risk_per_trade_percent"
                value={settings.risk_per_trade_percent}
                onChange={handleChange}
                style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Primary Trading Session</label>
              <select
                name="default_session"
                value={settings.default_session}
                onChange={handleChange}
                style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}
              >
                <option value="New York">New York</option>
                <option value="London">London</option>
                <option value="Asian">Asian</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: '#00FF88', color: '#080B14', border: 'none',
            padding: '14px 24px', borderRadius: '8px', fontWeight: 800,
            fontSize: '1rem', cursor: 'pointer', marginTop: '10px'
          }}
        >
          Save Configuration
        </button>

      </form>

    </motion.div>
  );
};

export default Settings;