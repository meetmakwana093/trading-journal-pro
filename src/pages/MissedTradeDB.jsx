import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// 🟢 NEW: Accept the database pipeline props from App.jsx!
const MissedTradesDB = ({ missedTrades = [], onAddMissedTrade, onDeleteMissedTrade }) => {
  
  // 1. Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: 'NIFTY',
    date: new Date().toISOString().split('T')[0],
    entryPrice: '',
    exitPrice: '',
    predictedPnL: '',
    reason: 'Fear'
  });

  // 2. Handle Form Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Submit Missed Trade (Wired to Live Database)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Package it exactly how the MySQL backend expects it
    const newTrade = {
      symbol: formData.symbol.toUpperCase(),
      date: formData.date,
      missedEntryPrice: parseFloat(formData.entryPrice) || 0,
      missedExitPrice: parseFloat(formData.exitPrice) || 0,
      predictedPnl: parseFloat(formData.predictedPnL) || 0,
      reason: formData.reason,
    };
    
    // Send it to the server instead of Local Storage!
    onAddMissedTrade(newTrade);
    
    setShowForm(false);
    setFormData(prev => ({ ...prev, entryPrice: '', exitPrice: '', predictedPnL: '' })); 
  };

  // Helper for formatting currency like -$200 instead of $-200
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
    (missedTrades || []).forEach(t => {
      breakdown[t.reason] = (breakdown[t.reason] || 0) + 1;
    });
    return Object.entries(breakdown).map(([reason, count]) => ({ name: reason, value: count }));
  }, [missedTrades]);
 
  const symbolPerformance = useMemo(() => {
    const perf = {};
    (missedTrades || []).forEach(t => {
      perf[t.symbol] = (perf[t.symbol] || 0) + 1;
    });
    return Object.entries(perf).map(([symbol, count]) => ({ symbol, count }));
  }, [missedTrades]);
 
  const cumulativePnL = useMemo(() => {
    let cumulative = 0;
    // Reverse so oldest is first in the chart
    return [...(missedTrades || [])].reverse().map((t, index) => {
      cumulative += (t.predictedPnl || 0);
      return { trade: index + 1, cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  }, [missedTrades]);
 
  const topReasons = useMemo(() => {
    return [...reasonBreakdown].sort((a, b) => b.value - a.value).slice(0, 3);
  }, [reasonBreakdown]);
 
  const colors = ['#FF3333', '#FFAA00', '#FF6B6B', '#FF8B8B', '#FFBB99', '#FFCCCC', '#FF9999'];
 
  const styles = {
    page: { backgroundColor: '#0F0F0F', minHeight: '100vh', padding: '20px', color: 'white' },
    heroSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 51, 51, 0.05)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255, 51, 51, 0.2)', marginBottom: '30px' },
    titleBlock: { textAlign: 'left' },
    title: { fontSize: '2.5rem', color: '#FF3333', margin: '0 0 10px 0', fontWeight: 'bold' },
    subtitle: { color: '#B0B0B0', margin: 0, fontSize: '1rem' },
    addButton: { backgroundColor: '#FF3333', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' },
    formContainer: { backgroundColor: '#262626', border: '1px solid rgba(255,51,51,0.2)', borderRadius: '12px', padding: '25px', marginBottom: '30px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', color: '#B0B0B0', fontWeight: 'bold', textTransform: 'uppercase' },
    input: { backgroundColor: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', outline: 'none' },
    submitButton: { backgroundColor: '#FFAA00', color: '#0F0F0F', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%', fontSize: '1.1rem' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' },
    card: { background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(255, 51, 51, 0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center' },
    cardLabel: { color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '10px' },
    cardValue: { fontSize: '2rem', fontWeight: 'bold', color: '#FF3333' },
    sectionTitle: { fontSize: '1.5rem', color: '#FF3333', marginBottom: '20px', fontWeight: 'bold' },
    section: { background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(255, 51, 51, 0.2)', borderRadius: '12px', padding: '25px', marginBottom: '25px' },
    tradeCard: { background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 51, 51, 0.3)', borderRadius: '10px', padding: '15px', marginBottom: '15px', transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tradeSymbol: { fontSize: '1.2rem', fontWeight: 'bold', color: '#FF3333', marginBottom: '10px' },
    tradeDetails: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', fontSize: '0.95rem' },
    detailItem: { color: '#B0B0B0' },
    detailValue: { color: '#FFAA00', fontWeight: 'bold', fontSize: '1.1rem', marginLeft: '5px' },
    reasonBadge: { display: 'inline-block', padding: '5px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 170, 0, 0.2)', border: '1px solid #FFAA00', color: '#FFAA00' },
    deleteBtn: { backgroundColor: 'transparent', color: '#B0B0B0', border: '1px solid #B0B0B0', borderRadius: '4px', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', transition: 'all 0.2s', marginLeft: '20px' },
    insightCard: { background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: '10px', padding: '15px' },
    insightTitle: { color: '#FFAA00', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' },
    insightValue: { color: '#B0B0B0', fontSize: '1.3rem', fontWeight: 'bold' },
    chartContainer: { marginBottom: '25px' },
    scenarioBox: { background: 'rgba(255, 51, 51, 0.1)', border: '1px solid rgba(255, 51, 51, 0.3)', borderRadius: '10px', padding: '20px', marginBottom: '15px' },
    scenarioText: { color: '#B0B0B0', fontSize: '1.05rem', marginBottom: '8px' },
    scenarioValue: { fontSize: '2rem', fontWeight: 'bold', color: '#FF3333' },
    noData: { textAlign: 'center', color: '#B0B0B0', padding: '60px', background: 'rgba(26, 26, 26, 0.5)', borderRadius: '12px', border: '1px dashed rgba(255, 51, 51, 0.3)', fontSize: '1.1rem' },
  };
 
  return (
    <motion.div style={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HERO SECTION */}
      <motion.div style={styles.heroSection} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>📊 Missed Trades Analysis</h1>
          <p style={styles.subtitle}>Track, measure, and eliminate FOMO by analyzing missed opportunities</p>
        </div>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Close Form' : '➕ Add Missed Trade'}
        </button>
      </motion.div>

      {/* ADD MISSED TRADE FORM */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={styles.formContainer}
            onSubmit={handleSubmit}
          >
            <h2 style={{color: '#FF3333', marginTop: 0, marginBottom: '20px', fontSize: '1.2rem'}}>Log a Missed Setup</h2>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Symbol / Pair</label>
                <input style={styles.input} name="symbol" value={formData.symbol} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date</label>
                <input style={styles.input} type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Missed Entry Price</label>
                <input style={styles.input} type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Missed Exit Price</label>
                <input style={styles.input} type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Predicted P&L ($)</label>
                <input style={styles.input} type="number" step="any" name="predictedPnL" value={formData.predictedPnL} onChange={handleChange} placeholder="e.g. 200 or -50" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Reason for Missing</label>
                <select style={styles.input} name="reason" value={formData.reason} onChange={handleChange}>
                  <option>Fear</option>
                  <option>Timing</option>
                  <option>Didn't See</option>
                  <option>In Another Trade</option>
                  <option>Ignored Alert</option>
                  <option>Technical Issue</option>
                  <option>Psychology/Doubt</option>
                </select>
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Save Missed Opportunity</button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* RENDER CONTENT ONLY IF TRADES EXIST */}
      {!missedTrades || missedTrades.length === 0 ? (
        <div style={styles.noData}>
          You haven't logged any missed trades yet.<br/><br/>
          Click <b>"Add Missed Trade"</b> above when you spot a setup you missed!
        </div>
      ) : (
        <>
          {/* 4 BIG CARDS */}
          <motion.div style={styles.cardsGrid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}>
            <motion.div style={styles.card} whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(255, 51, 51, 0.5)' }}>
              <div style={styles.cardLabel}>Total Missed Opportunity</div>
              <div style={styles.cardValue}>{formatMoney(metrics.totalMissed)}</div>
            </motion.div>
            <motion.div style={styles.card} whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(255, 51, 51, 0.5)' }}>
              <div style={styles.cardLabel}>Biggest Missed Trade</div>
              <div style={styles.cardValue}>{formatMoney(metrics.biggestMissed)}</div>
              <div style={styles.cardLabel}>{metrics.biggestMissedSymbol}</div>
            </motion.div>
            <motion.div style={styles.card} whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(255, 170, 0, 0.5)' }}>
              <div style={styles.cardLabel}>Win Rate if All Caught</div>
              <div style={{ ...styles.cardValue, color: '#FFAA00' }}>{metrics.winRateIfCaught}%</div>
            </motion.div>
            <motion.div style={styles.card} whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(255, 51, 51, 0.5)' }}>
              <div style={styles.cardLabel}>Cumulative Impact</div>
              <div style={styles.cardValue}>{formatMoney(metrics.cumulativeImpact)}</div>
            </motion.div>
          </motion.div>
    
          {/* TABLE OF MISSED TRADES */}
          <motion.div style={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={styles.sectionTitle}>📋 Logged Misses ({missedTrades.length})</h2>
            {missedTrades.map((trade, index) => (
              <motion.div key={trade.id} style={styles.tradeCard} whileHover={{ boxShadow: '0 0 20px rgba(255, 51, 51, 0.4)' }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.tradeSymbol}>{trade.symbol} <span style={{fontSize: '0.8rem', color: '#666', fontWeight: 'normal'}}>- {trade.date ? new Date(trade.date).toLocaleDateString() : ''}</span></div>
                  <div style={styles.tradeDetails}>
                    <div style={styles.detailItem}>Entry: <span style={{color: '#FFF', fontWeight: 'bold'}}>${trade.missedEntryPrice}</span></div>
                    <div style={styles.detailItem}>Exit: <span style={{color: '#FFF', fontWeight: 'bold'}}>${trade.missedExitPrice}</span></div>
                    <div style={styles.detailItem}>
                      P&L: <span style={{ ...styles.detailValue, color: trade.predictedPnl >= 0 ? '#00FF88' : '#FF3333' }}>
                        {formatMoney(trade.predictedPnl)}
                      </span>
                    </div>
                    <div style={styles.reasonBadge}>{trade.reason}</div>
                  </div>
                </div>
                <button 
                  style={styles.deleteBtn} 
                  // 🟢 NEW: Call the secure database delete function!
                  onClick={() => onDeleteMissedTrade(trade.id)}
                  onMouseOver={(e) => { e.target.style.color = '#FF3333'; e.target.style.borderColor = '#FF3333'; }}
                  onMouseOut={(e) => { e.target.style.color = '#B0B0B0'; e.target.style.borderColor = '#B0B0B0'; }}
                >
                  Delete
                </button>
              </motion.div>
            ))}
          </motion.div>
    
          {/* PATTERN ANALYSIS */}
          <motion.div style={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={styles.sectionTitle}>🔍 Pattern Analysis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={styles.chartContainer}>
                <h3 style={{ color: '#FFAA00', marginBottom: '15px' }}>Most Missed Symbols</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={symbolPerformance}>
                    <CartesianGrid stroke="#3A3A3A" />
                    <XAxis dataKey="symbol" stroke="#B0B0B0" />
                    <YAxis stroke="#B0B0B0" />
                    <Tooltip contentStyle={{ background: '#262626', border: '1px solid #FF3333' }} />
                    <Bar dataKey="count" fill="#FF3333" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
    
              <div style={styles.chartContainer}>
                <h3 style={{ color: '#FFAA00', marginBottom: '15px' }}>Reason Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={reasonBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {reasonBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#262626', border: '1px solid #FF3333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
    
          {/* PSYCHOLOGY INSIGHTS */}
          <motion.div style={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={styles.sectionTitle}>🧠 Psychology Insights</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={styles.insightCard}>
                <div style={styles.insightTitle}>Top Reason You Miss</div>
                {topReasons.map((reason, index) => (
                  <div key={index} style={{ color: '#B0B0B0', marginBottom: '8px', fontSize: '0.95rem' }}>
                    {index + 1}. {reason.name} ({reason.value} times)
                  </div>
                ))}
              </div>
              <div style={styles.insightCard}>
                <div style={styles.insightTitle}>Recovery Rate</div>
                <div style={styles.insightValue}>{((topReasons[0]?.value || 0) / missedTrades.length * 100).toFixed(1)}%</div>
                <div style={{ color: '#B0B0B0', marginTop: '8px', fontSize: '0.9rem' }}>Of missed trades were due to top reason</div>
              </div>
              <div style={styles.insightCard}>
                <div style={styles.insightTitle}>FOMO Impact</div>
                <div style={styles.insightValue}>{metrics.totalMissed > 0 ? '🔴 High' : '🟢 Low'}</div>
                <div style={{ color: '#B0B0B0', marginTop: '8px', fontSize: '0.9rem' }}>Your opportunity cost</div>
              </div>
              <div style={styles.insightCard}>
                <div style={styles.insightTitle}>Emotional Stability</div>
                <div style={{ ...styles.insightValue, color: metrics.winRateIfCaught > 50 ? '#FFAA00' : '#FF3333' }}>
                  {metrics.winRateIfCaught > 50 ? '⭐ Good' : '⚠️ Needs Work'}
                </div>
                <div style={{ color: '#B0B0B0', marginTop: '8px', fontSize: '0.9rem' }}>Based on win rate if caught</div>
              </div>
            </div>
          </motion.div>
    
          {/* OPPORTUNITY COST */}
          <motion.div style={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={styles.sectionTitle}>💰 Opportunity Cost Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativePnL}>
                <defs>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3333" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF3333" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#3A3A3A" />
                <XAxis dataKey="trade" stroke="#B0B0B0" />
                <YAxis stroke="#B0B0B0" />
                <Tooltip contentStyle={{ background: '#262626', border: '1px solid #FF3333' }} />
                <Line type="monotone" dataKey="cumulative" stroke="#FF3333" strokeWidth={3} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
    
          {/* WHAT-IF SCENARIO */}
          <motion.div style={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={styles.sectionTitle}>🎯 What-If Scenarios</h2>
            <motion.div style={styles.scenarioBox} whileHover={{ scale: 1.02 }}>
              <div style={styles.scenarioText}>📈 If you caught all these trades:</div>
              <div style={styles.scenarioValue}>
                {metrics.totalMissed >= 0 
                  ? `Account would be ${formatMoney(metrics.totalMissed)} richer!` 
                  : `You dodged a bullet! Saved ${formatMoney(Math.abs(metrics.totalMissed))}!`
                }
              </div>
            </motion.div>
            <motion.div style={styles.scenarioBox} whileHover={{ scale: 1.02 }}>
              <div style={styles.scenarioText}>🎓 Best Recovery Strategy:</div>
              <div style={{ color: '#FFAA00', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Focus on avoiding "{topReasons[0]?.name || 'mistakes'}" - your biggest miss reason
              </div>
            </motion.div>
            <motion.div style={styles.scenarioBox} whileHover={{ scale: 1.02 }}>
              <div style={styles.scenarioText}>🚀 To fully recover:</div>
              <div style={styles.scenarioValue}>
                Need {Math.max(0, Math.ceil(metrics.totalMissed / 200))} more trades @ $200 avg profit
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
 
export default MissedTradesDB;