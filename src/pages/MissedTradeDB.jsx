import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TradesDB = ({ trades = [], playbooks = [], onAddTrade, onDeleteTrade }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: 'NIFTY',
    date: new Date().toISOString().split('T')[0],
    session: 'New York',
    direction: 'LONG',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    profitLoss: 0,
    followedPlan: true,
    be: false,
    entryWindow: '9-10am',
    model: '',
    playbookId: '',
    chartLink: '',
    positiveTags: '',
    negativeTags: '',
    account: 'Account1',
    rating: 5
  });

  // Calculate R-Multiple automatically when user types entry, stop loss, exit
  const calculatedRR = useMemo(() => {
    const entry = parseFloat(formData.entryPrice);
    const exit = parseFloat(formData.exitPrice);
    const sl = parseFloat(formData.stopLoss);

    if (!entry || !exit || !sl || entry === sl) return 0;

    const risk = Math.abs(entry - sl);
    const reward = formData.direction === 'LONG' ? (exit - entry) : (entry - exit);
    return parseFloat((reward / risk).toFixed(2));
  }, [formData.entryPrice, formData.exitPrice, formData.stopLoss, formData.direction]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dateObj = new Date(formData.date);
    
    // Resolve Playbook Name
    const selectedPb = playbooks.find(p => p.id === parseInt(formData.playbookId));
    const modelName = selectedPb ? selectedPb.name : (formData.model || 'Manual Setup');

    const newTrade = {
      id: Date.now(), 
      symbol: formData.symbol.toUpperCase(),
      entryPrice: parseFloat(formData.entryPrice) || 0,
      exitPrice: parseFloat(formData.exitPrice) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      profitLoss: parseFloat(formData.profitLoss) || 0,
      riskReward: calculatedRR,
      entryTime: dateObj.toISOString().slice(0, 19).replace('T', ' '),
      date: formData.date,
      formattedDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      session: formData.session,
      direction: formData.direction,
      followedPlan: formData.followedPlan,
      be: formData.be,
      entryWindow: formData.entryWindow,
      model: modelName,
      playbookId: formData.playbookId ? parseInt(formData.playbookId) : null,
      chartLink: formData.chartLink,
      positiveTags: formData.positiveTags ? formData.positiveTags.split(',').map(t => t.trim()).filter(t => t) : [],
      negativeTags: formData.negativeTags ? formData.negativeTags.split(',').map(t => t.trim()).filter(t => t) : [],
      account: formData.account,
      rating: parseInt(formData.rating) || 5,
      win: parseFloat(formData.profitLoss) > 0,
    };

    onAddTrade(newTrade); 
    setShowForm(false); 
    setFormData(prev => ({ ...prev, profitLoss: 0, entryPrice: '', exitPrice: '', stopLoss: '', chartLink: '', positiveTags: '', negativeTags: '' }));
  };

  const styles = {
    formCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px', marginBottom: '24px', backdropFilter: 'blur(20px)' },
    input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', width: '100%' },
    label: { fontSize: '0.75rem', color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' },
    tableContainer: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflowX: 'auto', backdropFilter: 'blur(20px)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1300px' },
    th: { padding: '20px 24px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8F98', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    td: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', fontWeight: 500 },
    pill: (color, bg) => ({ background: bg, color: color, padding: '6px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }),
    button: { background: '#00FF88', color: '#000', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button style={styles.button} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel Entry' : '+ Log Trade Execution'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={styles.formCard} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div><label style={styles.label}>Symbol</label><input style={styles.input} name="symbol" value={formData.symbol} onChange={handleChange} required /></div>
              <div><label style={styles.label}>Date</label><input style={styles.input} type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
              <div>
                <label style={styles.label}>Playbook Model Setup</label>
                <select style={styles.input} name="playbookId" value={formData.playbookId} onChange={handleChange}>
                  <option value="">-- Select Setup Model --</option>
                  {playbooks.map(pb => <option key={pb.id} value={pb.id}>{pb.name}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Direction</label>
                <select style={styles.input} name="direction" value={formData.direction} onChange={handleChange}>
                  <option>LONG</option><option>SHORT</option>
                </select>
              </div>

              <div><label style={styles.label}>Entry Price</label><input style={styles.input} type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} /></div>
              <div><label style={styles.label}>Stop Loss</label><input style={styles.input} type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} /></div>
              <div><label style={styles.label}>Exit Price</label><input style={styles.input} type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} /></div>
              <div><label style={styles.label}>Calculated R-Multiple</label><div style={{ ...styles.input, color: calculatedRR >= 0 ? '#00FF88' : '#FF3366', fontWeight: 700 }}>{calculatedRR}R</div></div>

              <div><label style={styles.label}>Profit/Loss ($)</label><input style={styles.input} type="number" step="any" name="profitLoss" value={formData.profitLoss} onChange={handleChange} required /></div>
              <div style={{ gridColumn: 'span 3' }}><label style={styles.label}>TradingView Chart Screenshot Link</label><input style={styles.input} type="url" name="chartLink" placeholder="https://www.tradingview.com/x/..." value={formData.chartLink} onChange={handleChange} /></div>
            </div>
            <button type="submit" style={{ ...styles.button, width: '100%', marginTop: '24px' }}>Save Executed Trade</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Asset</th>
              <th style={styles.th}>Model</th>
              <th style={styles.th}>Direction</th>
              <th style={styles.th}>Entry / SL / Exit</th>
              <th style={styles.th}>R-Multiple</th>
              <th style={styles.th}>Net Return</th>
              <th style={styles.th}>Chart</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} style={{ transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...styles.td, color: '#8A8F98' }}>{trade.formattedDate || (trade.entryTime ? new Date(trade.entryTime).toLocaleDateString() : '')}</td>
                <td style={{ ...styles.td, color: '#FFF', fontWeight: 700 }}>{trade.symbol}</td>
                <td style={styles.td}>
                  <span style={styles.pill('#00FF88', 'rgba(0,255,136,0.1)')}>{trade.model || 'Manual Setup'}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.pill(trade.direction === 'LONG' ? '#00FF88' : '#FF3366', trade.direction === 'LONG' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)')}>
                    {trade.direction}
                  </span>
                </td>
                <td style={{ ...styles.td, fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#8A8F98' }}>
                  E: {trade.entryPrice} | SL: {trade.stopLoss} | Ex: {trade.exitPrice}
                </td>
                <td style={{ ...styles.td, color: trade.riskReward >= 0 ? '#00FF88' : '#FF3366', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  {trade.riskReward ? `${trade.riskReward}R` : '--'}
                </td>
                <td style={{ ...styles.td, color: trade.profitLoss >= 0 ? '#00FF88' : '#FF3366', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  ${trade.profitLoss}
                </td>
                <td style={styles.td}>
                  {trade.chartLink ? (
                    <a href={trade.chartLink} target="_blank" rel="noopener noreferrer" style={{ color: '#00FF88', textDecoration: 'underline', fontSize: '0.8rem' }}>View Chart</a>
                  ) : <span style={{ color: '#8A8F98' }}>No link</span>}
                </td>
                <td style={styles.td}>
                  <button onClick={() => onDeleteTrade(trade.id)} style={{ background: 'transparent', color: '#8A8F98', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default TradesDB;