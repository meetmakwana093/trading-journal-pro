import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getToken } from '../auth/authService';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DailyPrep = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bias, setBias] = useState('BULLISH');
  const [readiness, setReadiness] = useState(8);
  const [savedStatus, setSavedStatus] = useState('');
  
  const [checklist, setChecklist] = useState({
    macroNewsChecked: false,
    keyLevelsMarked: false,
    riskPerTradeLocked: false,
    fomocleared: false
  });

  const [keyLevels, setKeyLevels] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`${API}/prep/${date}`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBias(data.bias || 'BULLISH');
          setReadiness(data.readiness_score || 8);
          setKeyLevels(data.key_levels || '');
          setNotes(data.notes || '');
          try {
            if (data.checklist) setChecklist(JSON.parse(data.checklist));
          } catch(e) {}
        } else {
          setKeyLevels('');
          setNotes('');
          setChecklist({ macroNewsChecked: false, keyLevelsMarked: false, riskPerTradeLocked: false, fomocleared: false });
        }
      })
      .catch(() => {});
  }, [date]);

  const handleSave = (e) => {
    e.preventDefault();
    fetch(`${API}/prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({
        date, bias, readiness_score: readiness, checklist, key_levels: keyLevels, notes
      })
    })
      .then(res => res.json())
      .then(() => {
        setSavedStatus('Saved!');
        setTimeout(() => setSavedStatus(''), 2500);
      })
      .catch(() => alert('Failed to save prep.'));
  };

  const biasOptions = [
    { label: 'BULLISH 🟢', value: 'BULLISH', color: '#00FF88' },
    { label: 'BEARISH 🔴', value: 'BEARISH', color: '#FF3333' },
    { label: 'RANGE / WAIT 🟡', value: 'RANGE', color: '#F2C94C' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '1100px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>📓 PRE-MARKET PREPARATION</h1>
          <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Structure your mind and levels before the opening bell.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            style={{ background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '8px', outline: 'none', fontWeight: 600 }}
          />
          <motion.button 
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} 
            onClick={handleSave} 
            style={{ background: '#00FF88', color: '#080B14', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            {savedStatus || 'Save Plan'}
          </motion.button>
        </div>
      </div>

      {/* GRID CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* DIRECTIONAL BIAS & EMOTIONAL READINESS */}
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#9B9A97', textTransform: 'uppercase', letterSpacing: '1px' }}>1. Primary Session Bias</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {biasOptions.map(b => (
              <button
                key={b.value}
                onClick={() => setBias(b.value)}
                style={{
                  padding: '12px 8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                  background: bias === b.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: bias === b.value ? `2px solid ${b.color}` : '1px solid rgba(255,255,255,0.05)',
                  color: bias === b.value ? b.color : '#9B9A97',
                  transition: 'all 0.2s'
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#9B9A97', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
            <span>2. Mental Clarity Rating</span>
            <span style={{ color: readiness >= 7 ? '#00FF88' : readiness >= 5 ? '#F2C94C' : '#FF3333', fontWeight: 800 }}>{readiness}/10</span>
          </h3>
          <input 
            type="range" min="1" max="10" value={readiness} 
            onChange={e => setReadiness(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: readiness >= 7 ? '#00FF88' : '#FF3333', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '0.75rem', marginTop: '6px' }}>
            <span>Tired / Distracted (1)</span>
            <span>Laser Focused (10)</span>
          </div>
        </div>

        {/* PRE-BELL DISCIPLINE CHECKLIST */}
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#9B9A97', textTransform: 'uppercase', letterSpacing: '1px' }}>3. Execution Readiness Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { key: 'macroNewsChecked', label: 'Checked Macro News / Economic releases' },
              { key: 'keyLevelsMarked', label: 'Marked Asian/Previous Day Highs & Lows' },
              { key: 'riskPerTradeLocked', label: 'Maximum 1:1 or 1:2 Risk defined & accepted' },
              { key: 'fomocleared', label: 'Committed to waiting for full setup confirmation' }
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={checklist[item.key]} 
                  onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#00FF88', cursor: 'pointer' }}
                />
                <span style={{ color: checklist[item.key] ? '#FFF' : '#9B9A97' }}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* KEY LEVELS & SCENARIOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#2D9CDB', textTransform: 'uppercase', letterSpacing: '1px' }}>Key Price Levels & Structural Draw</h3>
          <textarea
            value={keyLevels}
            onChange={e => setKeyLevels(e.target.value)}
            placeholder="e.g. Bank Nifty 51,200 Buy-side Liquidity. Unmitigated 15m Fair Value Gap at 50,800."
            style={{ width: '100%', height: '120px', background: '#191919', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', padding: '12px', borderRadius: '8px', outline: 'none', resize: 'vertical', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#00FF88', textTransform: 'uppercase', letterSpacing: '1px' }}>If-Then Execution Rules For Today</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. If opening candle sweeps high and rejects with 5m CHoCH, look for short entry. If 1st trade loses, step away for 30 mins."
            style={{ width: '100%', height: '120px', background: '#191919', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', padding: '12px', borderRadius: '8px', outline: 'none', resize: 'vertical', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

    </motion.div>
  );
};

export default DailyPrep;