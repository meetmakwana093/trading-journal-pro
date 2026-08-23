import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MissedTradeDB = ({ missedTrades = [], onAddMissedTrade, onDeleteMissedTrade }) => {
  
  // 1. Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: 'BANKNIFTY',
    date: new Date().toISOString().split('T')[0],
    entryPrice: '',
    exitPrice: '',
    predictedPnL: '',
    reason: 'Hesitation / Fear'
  });

  // 2. Handle Form Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Submit Missed Trade
  const handleSubmit = (e) => {
    e.preventDefault();
    const newTrade = {
      symbol: formData.symbol.toUpperCase(),
      date: formData.date,
      missedEntryPrice: parseFloat(formData.entryPrice) || 0,
      missedExitPrice: parseFloat(formData.exitPrice) || 0,
      predictedPnl: parseFloat(formData.predictedPnL) || 0,
      reason: formData.reason,
    };
    onAddMissedTrade(newTrade);
    setShowForm(false);
    setFormData(prev => ({ ...prev, entryPrice: '', exitPrice: '', predictedPnL: '' })); 
  };

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num < 0 ? `-$${Math.abs(num).toFixed(0)}` : `$${num.toFixed(0)}`;
  };
  
  // Calculate dynamic metrics
  const metrics = useMemo(() => {
    if (!missedTrades || missedTrades.length === 0) {
      return { totalMissed: 0, biggestMissed: 0, biggestMissedSymbol: 'N/A', winRateIfCaught: 0, cumulativeImpact: 0 };
    }
    const totalMissed = missedTrades.reduce((sum, t) => sum + (t.predictedPnl || 0), 0);
    const biggestMissedTrade = missedTrades.reduce((prev, current) =>
      Math.abs(current.predictedPnl || 0) > Math.abs(prev.predictedPnl || 0) ? current : prev
    );
    const winCount = missedTrades.filter(t => (t.predictedPnl || 0) > 0).length;
    const winRate = (winCount / missedTrades.length) * 100;

    return {
      totalMissed: parseFloat(totalMissed.toFixed(2)),
      biggestMissed: Math.abs(biggestMissedTrade.predictedPnl || 0),
      biggestMissedSymbol: biggestMissedTrade.symbol,
      winRateIfCaught: parseFloat(winRate.toFixed(2)),
      cumulativeImpact: parseFloat(totalMissed.toFixed(2)),
    };
  }, [missedTrades]);
  
  // Pattern analysis calculations
  const reasonBreakdown = useMemo(() => {
    const breakdown = {};
    (missedTrades || []).forEach(t => { breakdown[t.reason] = (breakdown[t.reason] || 0) + 1; });
    return Object.entries(breakdown).map(([reason, count]) => ({ name: reason, value: count })).sort((a,b) => b.value - a.value);
  }, [missedTrades]);
  
  const symbolPerformance = useMemo(() => {
    const perf = {};
    (missedTrades || []).forEach(t => { perf[t.symbol] = (perf[t.symbol] || 0) + 1; });
    return Object.entries(perf).map(([symbol, count]) => ({ symbol, count })).sort((a,b) => b.count - a.count);
  }, [missedTrades]);
  
  const cumulativePnL = useMemo(() => {
    let cumulative = 0;
    return [...(missedTrades || [])].reverse().map((t, index) => {
      cumulative += (t.predictedPnl || 0);
      return { trade: `T${index + 1}`, cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  }, [missedTrades]);
  
  const topReasons = useMemo(() => {
    return [...reasonBreakdown].sort((a, b) => b.value - a.value).slice(0, 3);
  }, [reasonBreakdown]);
  
  const COLORS = ['#FF3333', '#FF6B6B', '#FF8B8B', '#FFAA00', '#F2C94C', '#FFBB99'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isNegative = val < 0;
      const color = isNegative ? '#00FF88' : '#FF3333'; // Inversely colored because missing profit is bad!
      return (
        <div style={{ background: 'rgba(10, 14, 23, 0.95)', border: `1px solid ${color}`, padding: '12px 16px', borderRadius: '8px', boxShadow: `0 8px 24px rgba(0,0,0,0.4)` }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>
          <p style={{ color: color, margin: 0, fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {val >= 0 ? '+' : '-'}${Math.abs(val).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 🟢 NEW: SLEEK MODAL FOR ADDING MISSED TRADES */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
            onClick={(e) => { if(e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              style={{ background: 'rgba(13,17,28,0.98)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '30px', boxShadow: '0 20px 60px rgba(255,51,51,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#FF3333' }}>Log Missed Setup</h2>
                  <div style={{ color: '#9B9A97', fontSize: '0.85rem' }}>Catalog your FOMO to eliminate it.</div>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Symbol / Pair</label>
                    <input name="symbol" value={formData.symbol} onChange={handleChange} required style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Missed Entry Price</label>
                    <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} required style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Missed Exit Price</label>
                    <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} required style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#FF3333', textTransform: 'uppercase', marginBottom: '6px', display: 'block', fontWeight: 800 }}>Opportunity Cost (P&L $)</label>
                  <input type="number" step="any" name="predictedPnL" value={formData.predictedPnL} onChange={handleChange} placeholder="e.g. 200" required style={{ width: '100%', background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.3)', color: '#FF3333', padding: '12px 14px', borderRadius: '8px', outline: 'none', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Reason for Missing</label>
                  <select name="reason" value={formData.reason} onChange={handleChange} style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}>
                    <option>Hesitation / Fear</option>
                    <option>Wanted Better Price (Greed)</option>
                    <option>Missed FVG Entry</option>
                    <option>Liquidity Sweep Too Fast</option>
                    <option>In Another Trade</option>
                    <option>Distracted / Away from screen</option>
                    <option>Technical/Platform Issue</option>
                  </select>
                </div>
                <button type="submit" style={{ width: '100%', marginTop: '16px', background: '#FF3333', color: '#FFF', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background='#E62E2E'} onMouseLeave={e => e.target.style.background='#FF3333'}>
                  Add to Vault
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0', background: 'linear-gradient(135deg, #ffffff 0%, #FF3333 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🚨 MISSED OPPORTUNITIES
          </h1>
          <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Track, measure, and eliminate FOMO by analyzing setups you missed.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', color: '#FF3333', padding: '10px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,51,51,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,51,51,0.1)'}
        >
          + Log Missed Setup
        </button>
      </div>

      {!missedTrades || missedTrades.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6B7280', padding: '80px', background: 'rgba(13,17,28,0.95)', borderRadius: '16px', border: '1px dashed rgba(255,51,51,0.2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#FFF' }}>No Missed Trades Logged</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Click "Log Missed Setup" when you spot a flawless setup you failed to execute.</p>
        </div>
      ) : (
        <>
          {/* QUICK STATS BENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Capital Missed', value: formatMoney(metrics.totalMissed), color: '#FF3333' },
              { label: 'Biggest Missed Winner', value: formatMoney(metrics.biggestMissed), sub: metrics.biggestMissedSymbol, color: '#FFAA00' },
              { label: 'Win Rate if Caught', value: `${metrics.winRateIfCaught}%`, color: metrics.winRateIfCaught > 50 ? '#00FF88' : '#FF3333' },
              { label: 'Opportunity Cost', value: formatMoney(metrics.cumulativeImpact), color: '#FF3333' }
            ].map((stat, i) => (
              <motion.div key={i} whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(255,51,51,0.1)' }} style={{ background: 'rgba(13,17,28,0.95)', border: `1px solid rgba(255,51,51,0.15)`, borderRadius: '16px', padding: '20px 16px', textAlign: 'center', transition: 'all 0.3s' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ color: stat.color, fontSize: '1.8rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</div>
                {stat.sub && <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{stat.sub}</div>}
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* AREA CHART */}
            <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>📈 Cumulative Opportunity Cost</h3>
              <div style={{ flex: 1, minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativePnL}>
                    <defs>
                      <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF3333" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FF3333" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="trade" stroke="#6B7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" stroke="#FF3333" strokeWidth={3} fill="url(#redGlow)" activeDot={{ r: 6, fill: '#191919', stroke: '#FF3333', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIE CHART - REASONS */}
            <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>🔍 Root Cause Breakdown</h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={reasonBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                      {reasonBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#191919', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#FFF' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {topReasons.map((reason, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#D1D5DB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      {reason.name}
                    </div>
                    <span style={{ fontWeight: 800 }}>{reason.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* WHAT-IF BENTO BOXES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.2)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '12px' }}>📈 If you caught all these trades:</div>
              <div style={{ fontSize: '1.6rem', color: '#FF3333', fontWeight: 800 }}>
                {metrics.totalMissed >= 0 ? `Account would be ${formatMoney(metrics.totalMissed)} richer.` : `Dodged a bullet! Saved ${formatMoney(Math.abs(metrics.totalMissed))}.`}
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '12px' }}>🧠 Deep Psychology Flaw:</div>
              <div style={{ fontSize: '1.3rem', color: '#FFAA00', fontWeight: 800, lineHeight: 1.3 }}>
                Focus on conquering "{topReasons[0]?.name || 'Hesitation'}"
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '12px' }}>🚀 How to fully recover:</div>
              <div style={{ fontSize: '1.4rem', color: '#00FF88', fontWeight: 800, lineHeight: 1.3 }}>
                Need {Math.max(0, Math.ceil(metrics.totalMissed / 200))} flawless setups @ $200 avg profit
              </div>
            </motion.div>
          </div>

          {/* TABLE LOG */}
          <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>📋 FOMO Log Database</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#9B9A97', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '12px 10px' }}>Date</th>
                    <th style={{ padding: '12px 10px' }}>Symbol</th>
                    <th style={{ padding: '12px 10px' }}>Ghost Entry</th>
                    <th style={{ padding: '12px 10px' }}>Ghost Exit</th>
                    <th style={{ padding: '12px 10px' }}>Failure Reason</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Cost ($)</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {missedTrades.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '14px 10px', color: '#D1D5DB' }}>{t.date ? new Date(t.date).toLocaleDateString() : '--'}</td>
                      <td style={{ padding: '14px 10px', fontWeight: 800, color: '#FFF' }}>{t.symbol}</td>
                      <td style={{ padding: '14px 10px', fontFamily: 'JetBrains Mono, monospace', color: '#9CA3AF' }}>{t.missedEntryPrice || '-'}</td>
                      <td style={{ padding: '14px 10px', fontFamily: 'JetBrains Mono, monospace', color: '#9CA3AF' }}>{t.missedExitPrice || '-'}</td>
                      <td style={{ padding: '14px 10px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: '#D1D5DB', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>{t.reason}</span>
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: t.predictedPnl >= 0 ? '#00FF88' : '#FF3333' }}>
                        {formatMoney(t.predictedPnl)}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                        <button 
                          onClick={() => onDeleteMissedTrade(t.id)}
                          style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.target.style.color='#FF3333'} onMouseLeave={e => e.target.style.color='#6B7280'}
                          title="Delete Record"
                        >🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </motion.div>
  );
};

export default MissedTradeDB;