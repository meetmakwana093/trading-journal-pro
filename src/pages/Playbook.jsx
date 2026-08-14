import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Playbook = ({ playbooks = [], trades = [], onAddPlaybook, onDeletePlaybook }) => {
  const [showForm, setShowForm] = useState(false);
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

  const playbookStats = useMemo(() => {
    return playbooks.map(pb => {
      const pbTrades = trades.filter(t => t.playbookId === pb.id || t.model === pb.name);
      const totalTrades = pbTrades.length;
      const wins = pbTrades.filter(t => t.profitLoss > 0).length;
      const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
      const totalPnL = pbTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      const avgRR = totalTrades > 0 ? (pbTrades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / totalTrades).toFixed(2) : 0;

      return { ...pb, totalTrades, winRate, totalPnL: totalPnL.toFixed(2), avgRR };
    });
  }, [playbooks, trades]);

  // Exact original styling matching TradesDB
  const styles = {
    container: { backgroundColor: '#191919', color: '#E0E0E0', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
    addButton: { backgroundColor: '#2D9CDB', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' },
    formContainer: { backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', color: '#9B9A97', fontWeight: 'bold', textTransform: 'uppercase' },
    input: { backgroundColor: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' },
    submitButton: { backgroundColor: '#219653', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%' },
    tableWrapper: { overflowX: 'auto', paddingBottom: '20px' },
    table: { width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '14px' },
    th: { textAlign: 'left', padding: '12px 16px', color: '#9B9A97', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' },
    td: { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' },
    deleteBtn: { backgroundColor: 'transparent', color: '#EB5757', border: '1px solid rgba(235, 87, 87, 0.4)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', transition: 'all 0.2s' },
    emptyState: { textAlign: 'center', padding: '40px', color: '#9B9A97', fontStyle: 'italic' }
  };

  return (
    <motion.div style={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>📘 STRATEGY PLAYBOOK</h1>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '➕ Add Setup Model'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={styles.formContainer}
            onSubmit={handleSubmit}
          >
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Model Name</label>
                <input style={styles.input} name="name" value={formData.name} onChange={handleChange} placeholder="e.g. SMC Liq Sweep" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Timeframe</label>
                <select style={styles.input} name="timeframe" value={formData.timeframe} onChange={handleChange}>
                  <option value="1m">1m</option><option value="3m">3m</option><option value="5m">5m</option><option value="15m">15m</option><option value="1H">1H</option>
                </select>
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Description</label>
                <input style={styles.input} name="description" value={formData.description} onChange={handleChange} placeholder="Short summary of setup..." />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Execution Rules</label>
                <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} name="rules" value={formData.rules} onChange={handleChange} placeholder="1. Sweep high... 2. FVG entry..." />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Save Playbook Model</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Model Name</th>
              <th style={styles.th}>Timeframe</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Trades Logged</th>
              <th style={styles.th}>Win Rate</th>
              <th style={styles.th}>Avg R:R</th>
              <th style={styles.th}>Total P&L</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {playbookStats.length === 0 ? (
              <tr>
                <td colSpan={8} style={styles.emptyState}>
                  No models created yet. Click "Add Setup Model" to start building your playbook!
                </td>
              </tr>
            ) : (
              playbookStats.map((pb) => (
                <tr key={pb.id}>
                  <td style={{...styles.td, color: '#FFFFFF', fontWeight: 'bold'}}>{pb.name}</td>
                  <td style={styles.td}>{pb.timeframe}</td>
                  <td style={styles.td}>{pb.description || '-'}</td>
                  <td style={styles.td}>{pb.totalTrades}</td>
                  <td style={{...styles.td, color: pb.winRate >= 50 ? '#219653' : '#EB5757', fontWeight: 'bold'}}>{pb.winRate}%</td>
                  <td style={{...styles.td, color: '#2D9CDB', fontWeight: 'bold'}}>{pb.avgRR}R</td>
                  <td style={{...styles.td, color: pb.totalPnL >= 0 ? '#219653' : '#EB5757', fontWeight: 'bold'}}>${pb.totalPnL}</td>
                  <td style={styles.td}><button style={styles.deleteBtn} onClick={() => onDeletePlaybook(pb.id)}>Delete</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Playbook;