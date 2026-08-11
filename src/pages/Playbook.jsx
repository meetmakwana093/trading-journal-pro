import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Playbook({ playbooks = [], trades = [], onAddPlaybook, onDeletePlaybook }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    timeframe: '15m',
    description: '',
    rules: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onAddPlaybook(formData);
    setFormData({ name: '', timeframe: '15m', description: '', rules: '' });
    setShowForm(false);
  };

  // Calculate performance per playbook model
  const playbookStats = useMemo(() => {
    return playbooks.map(pb => {
      const pbTrades = trades.filter(t => t.playbookId === pb.id || t.model === pb.name);
      const totalTrades = pbTrades.length;
      const wins = pbTrades.filter(t => t.profitLoss > 0).length;
      const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
      const totalPnL = pbTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      const avgRR = totalTrades > 0 
        ? (pbTrades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / totalTrades).toFixed(2) 
        : 0;

      return {
        ...pb,
        totalTrades,
        winRate,
        totalPnL: totalPnL.toFixed(2),
        avgRR
      };
    });
  }, [playbooks, trades]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-grid">
      
      {/* HEADER CARD */}
      <div className="bento-card col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#FFF', fontWeight: 800 }}>Strategy Playbook Models</h2>
          <p style={{ color: '#8A8F98', fontSize: '0.85rem' }}>Define models and track edge performance across trades</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ background: '#00FF88', color: '#000', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          {showForm ? 'Close Form' : '+ New Playbook Model'}
        </button>
      </div>

      {/* ADD PLAYBOOK FORM */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            onSubmit={handleSubmit} 
            className="bento-card col-span-12"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="card-label">Model Name</label>
                <input 
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px', borderRadius: '12px', width: '100%', outline: 'none' }} 
                  name="name" 
                  placeholder="e.g. SMC - Liquidity Sweep + FVG" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <label className="card-label">Timeframe</label>
                <select 
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px', borderRadius: '12px', width: '100%', outline: 'none' }} 
                  name="timeframe" 
                  value={formData.timeframe} 
                  onChange={handleChange}
                >
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="1D">Daily</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="card-label">Model Description</label>
                <input 
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px', borderRadius: '12px', width: '100%', outline: 'none' }} 
                  name="description" 
                  placeholder="Key characteristics of this setup..." 
                  value={formData.description} 
                  onChange={handleChange} 
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="card-label">Execution Rules (Comma Separated or Bullets)</label>
                <textarea 
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px', borderRadius: '12px', width: '100%', outline: 'none', minHeight: '80px' }} 
                  name="rules" 
                  placeholder="1. Sweep high/low, 2. CHoCH on 1m, 3. Enter at FVG..." 
                  value={formData.rules} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#00FF88', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Save Playbook Model
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* PLAYBOOK CARDS */}
      {playbookStats.length === 0 ? (
        <div className="bento-card col-span-12 text-center" style={{ color: '#8A8F98', padding: '40px' }}>
          No Playbook models created yet. Click <b>"+ New Playbook Model"</b> above to set up your strategies!
        </div>
      ) : (
        playbookStats.map(pb => (
          <div key={pb.id} className="bento-card col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {pb.timeframe}
                </span>
                <h3 style={{ fontSize: '1.3rem', color: '#FFF', marginTop: '8px', fontWeight: 700 }}>{pb.name}</h3>
                <p style={{ color: '#8A8F98', fontSize: '0.85rem', marginTop: '4px' }}>{pb.description || 'No description provided.'}</p>
              </div>
              <button 
                onClick={() => onDeletePlaybook(pb.id)} 
                style={{ background: 'transparent', color: '#FF3366', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Delete
              </button>
            </div>

            {/* PERFORMANCE METRICS FOR THIS MODEL */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div className="card-label" style={{ fontSize: '0.65rem' }}>Trades</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>{pb.totalTrades}</div>
              </div>
              <div>
                <div className="card-label" style={{ fontSize: '0.65rem' }}>Win Rate</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: pb.winRate >= 50 ? '#00FF88' : '#FF3366' }}>{pb.winRate}%</div>
              </div>
              <div>
                <div className="card-label" style={{ fontSize: '0.65rem' }}>Avg R:R</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#00FF88' }}>{pb.avgRR}R</div>
              </div>
              <div>
                <div className="card-label" style={{ fontSize: '0.65rem' }}>Total P&L</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: pb.totalPnL >= 0 ? '#00FF88' : '#FF3366' }}>${pb.totalPnL}</div>
              </div>
            </div>

            {pb.rules && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="card-label" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>Model Execution Rules</div>
                <div style={{ color: '#D1D5DB', fontSize: '0.85rem', lineHeight: '1.4' }}>{pb.rules}</div>
              </div>
            )}
          </div>
        ))
      )}

    </motion.div>
  );
}