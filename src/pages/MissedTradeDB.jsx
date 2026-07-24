import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MissedTradesDB = ({ missedTrades = [], onAddMissedTrade, onDeleteMissedTrade }) => {
  // --- 100% UNCHANGED LOGIC ---
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ symbol: 'NIFTY', date: new Date().toISOString().split('T')[0], entryPrice: '', exitPrice: '', predictedPnL: '', reason: 'Fear' });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMissedTrade({
      symbol: formData.symbol.toUpperCase(), date: formData.date,
      missedEntryPrice: parseFloat(formData.entryPrice) || 0, missedExitPrice: parseFloat(formData.exitPrice) || 0,
      predictedPnl: parseFloat(formData.predictedPnL) || 0, reason: formData.reason,
    });
    setShowForm(false);
    setFormData(prev => ({ ...prev, entryPrice: '', exitPrice: '', predictedPnL: '' })); 
  };

  const formatMoney = (val) => { const num = parseFloat(val) || 0; return num < 0 ? `-$${Math.abs(num).toFixed(0)}` : `$${num.toFixed(0)}`; };
 
  const metrics = useMemo(() => {
    if (!missedTrades || missedTrades.length === 0) return { totalMissed: 0, biggestMissed: 0, biggestMissedSymbol: 'N/A', winRateIfCaught: 0, cumulativeImpact: 0 };
    const totalMissed = missedTrades.reduce((sum, t) => sum + (t.predictedPnl || 0), 0);
    const biggestMissedTrade = missedTrades.reduce((p, c) => Math.abs(c.predictedPnl || 0) > Math.abs(p.predictedPnl || 0) ? c : p);
    const winRate = (missedTrades.filter(t => (t.predictedPnl || 0) > 0).length / missedTrades.length) * 100;
    return { totalMissed: parseFloat(totalMissed.toFixed(2)), biggestMissed: Math.abs(biggestMissedTrade.predictedPnl || 0), biggestMissedSymbol: biggestMissedTrade.symbol, winRateIfCaught: parseFloat(winRate.toFixed(2)), cumulativeImpact: parseFloat(totalMissed.toFixed(2)) };
  }, [missedTrades]);
 
  const reasonBreakdown = useMemo(() => Object.entries((missedTrades || []).reduce((acc, t) => { acc[t.reason] = (acc[t.reason] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value })), [missedTrades]);
  const symbolPerformance = useMemo(() => Object.entries((missedTrades || []).reduce((acc, t) => { acc[t.symbol] = (acc[t.symbol] || 0) + 1; return acc; }, {})).map(([symbol, count]) => ({ symbol, count })), [missedTrades]);
  
  const cumulativePnL = useMemo(() => {
    let cumulative = 0;
    return [...(missedTrades || [])].reverse().map((t, index) => {
      cumulative += (t.predictedPnl || 0); return { trade: index + 1, cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  }, [missedTrades]);
 
  const topReasons = useMemo(() => [...reasonBreakdown].sort((a, b) => b.value - a.value).slice(0, 3), [reasonBreakdown]);
  const colors = ['#FF3366', '#FF9900', '#FF6B6B', '#FF8B8B', '#FFBB99', '#FFCCCC', '#FF9999'];
  // --- END LOGIC ---

  const inputStyle = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px', borderRadius: '12px', width: '100%', outline: 'none' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-grid">
      
      <div className="bento-card col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#FFF' }}>Analysis Vault</h2>
          <p style={{ color: '#8A8F98', fontSize: '0.85rem' }}>Track and eliminate FOMO</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#FF3366', color: '#FFF', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? 'Close Form' : '+ Add Missed Trade'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bento-card col-span-12" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div><label className="card-label">Symbol</label><input style={inputStyle} name="symbol" value={formData.symbol} onChange={handleChange} required /></div>
              <div><label className="card-label">Date</label><input style={inputStyle} type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
              <div><label className="card-label">Reason</label>
                <select style={inputStyle} name="reason" value={formData.reason} onChange={handleChange}>
                  <option>Fear</option><option>Timing</option><option>Didn't See</option><option>In Another Trade</option><option>Ignored Alert</option><option>Technical Issue</option><option>Psychology/Doubt</option>
                </select>
              </div>
              <div><label className="card-label">Missed Entry</label><input style={inputStyle} type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} required /></div>
              <div><label className="card-label">Missed Exit</label><input style={inputStyle} type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} required /></div>
              <div><label className="card-label">Predicted P&L ($)</label><input style={inputStyle} type="number" step="any" name="predictedPnL" value={formData.predictedPnL} onChange={handleChange} required /></div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#FF9900', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Save Opportunity</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bento-card col-span-3 text-center"><div className="card-label">Total Missed</div><div className="metric-value metric-red">{formatMoney(metrics.totalMissed)}</div></div>
      <div className="bento-card col-span-3 text-center"><div className="card-label">Biggest Miss</div><div className="metric-value text-primary">{formatMoney(metrics.biggestMissed)}</div></div>
      <div className="bento-card col-span-3 text-center"><div className="card-label">Win Rate (If Caught)</div><div className="metric-value" style={{color: '#FF9900'}}>{metrics.winRateIfCaught}%</div></div>
      <div className="bento-card col-span-3 text-center"><div className="card-label">Opportunity Cost</div><div className="metric-value metric-red">{formatMoney(metrics.cumulativeImpact)}</div></div>

      <div className="bento-card col-span-6">
        <div className="card-label">Most Missed Symbols</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={symbolPerformance}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="symbol" stroke="#8A8F98" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #FF3366', borderRadius: '8px' }} />
            <Bar dataKey="count" fill="#FF3366" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bento-card col-span-6">
        <div className="card-label">Reason Breakdown</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={reasonBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {reasonBreakdown.map((e, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #FF3366', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bento-card col-span-8" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <div className="card-label" style={{ marginBottom: '16px' }}>Logged Misses</div>
        {missedTrades.length === 0 ? <p style={{color: '#8A8F98'}}>No data yet.</p> : missedTrades.map(trade => (
          <div key={trade.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#FFF', fontWeight: 'bold', fontSize: '1.1rem' }}>{trade.symbol} <span style={{fontSize: '0.8rem', color: '#8A8F98'}}>{trade.date ? new Date(trade.date).toLocaleDateString() : ''}</span></div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.85rem', color: '#8A8F98' }}>
                <span>Entry: <b style={{color: '#FFF'}}>${trade.missedEntryPrice}</b></span>
                <span>Exit: <b style={{color: '#FFF'}}>${trade.missedExitPrice}</b></span>
                <span>P&L: <b style={{color: trade.predictedPnl >= 0 ? '#00FF88' : '#FF3366'}}>{formatMoney(trade.predictedPnl)}</b></span>
                <span style={{ background: 'rgba(255,153,0,0.1)', color: '#FF9900', padding: '2px 8px', borderRadius: '100px' }}>{trade.reason}</span>
              </div>
            </div>
            <button onClick={() => onDeleteMissedTrade(trade.id)} style={{ background: 'transparent', color: '#FF3366', border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>

      <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="bento-card">
          <div className="card-label">Top Reason You Miss</div>
          {topReasons.map((r, i) => <div key={i} style={{ color: '#FFF', marginBottom: '4px' }}>{i+1}. {r.name} ({r.value}x)</div>)}
        </div>
        <div className="bento-card">
          <div className="card-label">What If Scenario</div>
          <div style={{ color: '#8A8F98', fontSize: '0.9rem', marginBottom: '8px' }}>If you caught all trades:</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: metrics.totalMissed >= 0 ? '#00FF88' : '#FFF' }}>
            {metrics.totalMissed >= 0 ? `+${formatMoney(metrics.totalMissed)}` : `Saved ${formatMoney(Math.abs(metrics.totalMissed))}`}
          </div>
        </div>
      </div>

    </motion.div>
  );
};
export default MissedTradesDB;