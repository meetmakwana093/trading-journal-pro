import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Playbook = ({ playbooks = [], trades = [], onAddPlaybook, onDeletePlaybook }) => {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // Tracks which card is clicked open
  const [formData, setFormData] = useState({
    name: '', timeframe: '15m', description: '', rules: ''
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

  // Attach trades and calculate stats for EACH playbook
  const playbookStats = useMemo(() => {
    return playbooks.map(pb => {
      // Find all trades that belong to this playbook
      const pbTrades = trades.filter(t => t.playbookId === pb.id || t.model === pb.name);
      
      const totalTrades = pbTrades.length;
      const wins = pbTrades.filter(t => t.profitLoss > 0).length;
      const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
      const totalPnL = pbTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      const avgRR = totalTrades > 0 ? (pbTrades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / totalTrades).toFixed(2) : 0;

      return { 
        ...pb, 
        totalTrades, 
        winRate, 
        totalPnL: totalPnL.toFixed(2), 
        avgRR,
        associatedTrades: pbTrades.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime)) // Newest first
      };
    });
  }, [playbooks, trades]);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const formatCurrency = (number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);

  const styles = {
    container: { backgroundColor: '#191919', color: '#E0E0E0', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
    addButton: { backgroundColor: '#2D9CDB', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(45, 156, 219, 0.2)' },
    formContainer: { backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '25px', marginBottom: '30px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', color: '#9B9A97', fontWeight: 'bold', textTransform: 'uppercase' },
    input: { backgroundColor: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', outline: 'none', transition: 'border 0.2s' },
    submitButton: { backgroundColor: '#219653', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%', fontSize: '1rem' },
    grid: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { background: 'rgba(38, 38, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' },
    cardHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    pill: { background: 'rgba(45, 156, 219, 0.15)', color: '#2D9CDB', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' },
    metricBox: { display: 'flex', gap: '30px', alignItems: 'center' },
    metric: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    metricLabel: { color: '#9B9A97', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' },
    metricValue: { color: '#FFF', fontWeight: 'bold', fontSize: '1.4rem', fontFamily: 'JetBrains Mono, monospace' },
    deleteBtn: { backgroundColor: 'transparent', color: '#EB5757', border: '1px solid rgba(235, 87, 87, 0.4)', borderRadius: '6px', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', transition: 'all 0.2s', marginLeft: '20px' },
    expandedContent: { padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' },
    tradeRow: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', padding: '12px 16px', background: '#191919', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.03)' },
    tradeHeader: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr', padding: '10px 16px', color: '#9B9A97', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }
  };

  return (
    <motion.div style={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '30px', background: '#2D9CDB', borderRadius: '4px' }} />
          <div>
            <h1 style={styles.title}>STRATEGY PLAYBOOK</h1>
            <p style={{ color: '#9B9A97', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Define models, track performance, and review execution history.</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '➕ Add Setup Model'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0, y: -20 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -20, margin: 0, padding: 0 }}
            style={styles.formContainer}
            onSubmit={handleSubmit}
          >
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Model Name</label>
                <input style={styles.input} name="name" value={formData.name} onChange={handleChange} placeholder="e.g. SMC Liquidity Sweep" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Timeframe</label>
                <select style={styles.input} name="timeframe" value={formData.timeframe} onChange={handleChange}>
                  <option value="1m">1m</option><option value="3m">3m</option><option value="5m">5m</option><option value="15m">15m</option><option value="1H">1H</option><option value="4H">4H</option><option value="Daily">Daily</option>
                </select>
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Brief Description</label>
                <input style={styles.input} name="description" value={formData.description} onChange={handleChange} placeholder="What is the core edge of this setup?" />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Execution Rules & Criteria</label>
                <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} name="rules" value={formData.rules} onChange={handleChange} placeholder="1. Sweep previous day high.&#10;2. Wait for 5m CHoCH.&#10;3. Enter on FVG retracement." />
              </div>
            </div>
            <motion.button whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.98 }} type="submit" style={styles.submitButton}>
              Save Playbook Model
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={styles.grid}>
        {playbookStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9B9A97', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
            No strategies defined yet. Click "Add Setup Model" to start building your playbook!
          </div>
        ) : (
          playbookStats.map(pb => {
            const isExpanded = expandedId === pb.id;
            
            return (
              <motion.div 
                key={pb.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={!isExpanded ? { boxShadow: '0 8px 30px rgba(0,0,0,0.4)', backgroundColor: 'rgba(45, 45, 45, 0.8)' } : {}}
                style={{ ...styles.card, border: isExpanded ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                {/* HEADER (ALWAYS VISIBLE) */}
                <div style={styles.cardHeader} onClick={() => toggleExpand(pb.id)}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.pill}>{pb.timeframe}</span>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: isExpanded ? '#00FF88' : '#FFF', transition: 'color 0.3s' }}>
                      {pb.name}
                    </h3>
                    <p style={{ margin: 0, color: '#9B9A97', fontSize: '0.9rem', maxWidth: '80%' }}>
                      {pb.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div style={styles.metricBox}>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Trades</span>
                      <span style={styles.metricValue}>{pb.totalTrades}</span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Win Rate</span>
                      <span style={{ ...styles.metricValue, color: pb.winRate >= 50 ? '#00FF88' : (pb.totalTrades > 0 ? '#EB5757' : '#FFF') }}>
                        {pb.winRate}%
                      </span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Avg R:R</span>
                      <span style={{ ...styles.metricValue, color: '#2D9CDB' }}>{pb.avgRR}R</span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Total P&L</span>
                      <span style={{ ...styles.metricValue, color: pb.totalPnL >= 0 ? '#00FF88' : '#EB5757' }}>
                        {pb.totalPnL >= 0 ? `+$${pb.totalPnL}` : `-$${Math.abs(pb.totalPnL)}`}
                      </span>
                    </div>
                    
                    <button 
                      style={styles.deleteBtn} 
                      onClick={(e) => { e.stopPropagation(); onDeletePlaybook(pb.id); }}
                      onMouseEnter={(e) => { e.target.style.background = 'rgba(235, 87, 87, 0.1)'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT (RULES & TRADE HISTORY) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={styles.expandedContent}>
                        
                        {/* Rules Section */}
                        {pb.rules && (
                          <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                            <div style={{ color: '#2D9CDB', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Execution Rules</div>
                            <div style={{ color: '#E0E0E0', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                              {pb.rules}
                            </div>
                          </div>
                        )}

                        {/* Trade History Section */}
                        <div>
                          <div style={{ color: '#00FF88', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '12px', marginTop: pb.rules ? '0' : '20px' }}>
                            Trade Execution History
                          </div>
                          
                          {pb.associatedTrades.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', background: '#191919', borderRadius: '8px', color: '#9B9A97' }}>
                              No trades have been logged using this model yet.
                            </div>
                          ) : (
                            <div>
                              <div style={styles.tradeHeader}>
                                <span>Date</span>
                                <span>Asset</span>
                                <span>Direction</span>
                                <span>R-Multiple</span>
                                <span style={{ textAlign: 'right' }}>Net Return</span>
                              </div>
                              
                              {pb.associatedTrades.map(trade => (
                                <motion.div 
                                  key={trade.id} 
                                  whileHover={{ x: 4, background: '#262626' }}
                                  style={{ 
                                    ...styles.tradeRow, 
                                    borderLeft: `4px solid ${trade.profitLoss >= 0 ? '#00FF88' : '#EB5757'}` 
                                  }}
                                >
                                  <span style={{ color: '#B0B0B0', fontSize: '0.9rem' }}>
                                    {trade.entryTime ? new Date(trade.entryTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : trade.date}
                                  </span>
                                  <span style={{ fontWeight: 'bold', color: '#FFF' }}>{trade.symbol}</span>
                                  <span style={{ 
                                    color: trade.direction === 'LONG' ? '#219653' : '#EB5757', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold',
                                    background: trade.direction === 'LONG' ? 'rgba(33, 150, 83, 0.15)' : 'rgba(235, 87, 87, 0.15)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    width: 'fit-content'
                                  }}>
                                    {trade.direction || '-'}
                                  </span>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#B0B0B0' }}>
                                    {trade.riskReward ? `${trade.riskReward}R` : '-'}
                                  </span>
                                  <span style={{ 
                                    fontFamily: 'JetBrains Mono, monospace', 
                                    fontWeight: 'bold', 
                                    textAlign: 'right',
                                    color: trade.profitLoss >= 0 ? '#00FF88' : '#EB5757' 
                                  }}>
                                    {trade.profitLoss >= 0 ? `+${formatCurrency(trade.profitLoss)}` : `-${formatCurrency(Math.abs(trade.profitLoss))}`}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default Playbook;