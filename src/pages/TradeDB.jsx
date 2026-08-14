import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TradesDB = ({ trades, playbooks = [], onAddTrade, onDeleteTrade }) => {
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: 'EURUSD',
    date: new Date().toISOString().split('T')[0],
    session: 'New York',
    direction: 'LONG',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '', // 🟢 NEW
    playbookId: '', // 🟢 NEW
    profitLoss: 0,
    followedPlan: true,
    be: false,
    entryWindow: '9-10am',
    positiveTags: '',
    negativeTags: '',
    account: 'Account1',
    rating: 5
  });

  // 🟢 NEW: Auto-calculate R-Multiple
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
    
    // Resolve playbook model name
    const selectedPb = playbooks.find(p => p.id === parseInt(formData.playbookId));
    const modelName = selectedPb ? selectedPb.name : 'Manual Setup';

    const newTrade = {
      id: Date.now(), 
      symbol: formData.symbol.toUpperCase(),
      entryPrice: parseFloat(formData.entryPrice) || 0,
      exitPrice: parseFloat(formData.exitPrice) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0, // 🟢 NEW
      profitLoss: parseFloat(formData.profitLoss),
      riskReward: calculatedRR, // 🟢 NEW
      entryTime: dateObj.toISOString().slice(0, 19).replace('T', ' '),
      date: formData.date,
      formattedDate: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      session: formData.session,
      direction: formData.direction,
      followedPlan: formData.followedPlan,
      be: formData.be,
      entryWindow: formData.entryWindow,
      model: modelName, // 🟢 NEW
      playbookId: formData.playbookId ? parseInt(formData.playbookId) : null, // 🟢 NEW
      positiveTags: formData.positiveTags.split(',').map(t => t.trim()).filter(t => t),
      negativeTags: formData.negativeTags.split(',').map(t => t.trim()).filter(t => t),
      account: formData.account,
      rating: parseInt(formData.rating),
      win: parseFloat(formData.profitLoss) > 0,
      dow: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      month: dateObj.toLocaleDateString('en-US', { month: 'long' }),
      year: dateObj.getFullYear()
    };

    onAddTrade(newTrade); 
    setShowForm(false); 
    setFormData(prev => ({ ...prev, profitLoss: 0, entryPrice: '', exitPrice: '', stopLoss: '', positiveTags: '', negativeTags: '' }));
  };

  const summary = useMemo(() => {
    if (!trades || trades.length === 0) return { totalPnL: 0, planPercent: 0, avgRating: 0, winRate: 0, avgRR: 0 };
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const planFollowed = trades.filter(t => t.followedPlan).length;
    const totalWins = trades.filter(t => (t.win || t.profitLoss > 0)).length;
    const totalRating = trades.reduce((sum, t) => sum + (t.rating || 5), 0);
    const totalRR = trades.reduce((sum, t) => sum + (t.riskReward || 0), 0); // 🟢 NEW

    return {
      totalPnL: totalPnL.toFixed(2),
      planPercent: ((planFollowed / trades.length) * 100).toFixed(0),
      avgRating: (totalRating / trades.length).toFixed(2),
      winRate: ((totalWins / trades.length) * 100).toFixed(2),
      avgRR: (totalRR / trades.length).toFixed(2) // 🟢 NEW
    };
  }, [trades]);

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
    checkboxGroup: { display: 'flex', alignItems: 'center', gap: '8px', height: '100%', paddingTop: '15px' },
    submitButton: { backgroundColor: '#219653', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%' },
    tableWrapper: { overflowX: 'auto', paddingBottom: '20px' },
    table: { width: '100%', minWidth: '1700px', borderCollapse: 'collapse', fontSize: '14px' }, 
    th: { textAlign: 'left', padding: '12px 16px', color: '#9B9A97', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' },
    td: { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' },
    deleteBtn: { backgroundColor: 'transparent', color: '#EB5757', border: '1px solid rgba(235, 87, 87, 0.4)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', transition: 'all 0.2s' },
    pill: (type) => {
      const base = { padding: '2px 6px', borderRadius: '3px', fontSize: '13px', display: 'inline-block' };
      switch(type) {
        case 'SHORT': return { ...base, backgroundColor: 'rgba(235, 87, 87, 0.2)', color: '#EB5757' };
        case 'LONG': return { ...base, backgroundColor: 'rgba(33, 150, 83, 0.2)', color: '#219653' };
        case 'London': return { ...base, backgroundColor: 'rgba(39, 174, 96, 0.15)', color: '#27AE60' };
        case 'New York': return { ...base, backgroundColor: 'rgba(45, 156, 219, 0.15)', color: '#2D9CDB' };
        case 'Asian': return { ...base, backgroundColor: 'rgba(242, 153, 74, 0.15)', color: '#F2994A' };
        case 'Account1': return { ...base, backgroundColor: 'rgba(155, 154, 151, 0.2)', color: '#9B9A97' };
        case 'Account2': return { ...base, backgroundColor: 'rgba(155, 89, 182, 0.2)', color: '#9B59B6' };
        case 'Window': return { ...base, backgroundColor: 'rgba(45, 156, 219, 0.2)', color: '#2D9CDB' };
        case 'Model': return { ...base, backgroundColor: 'rgba(130, 130, 130, 0.2)', color: '#BDBDBD' };
        default: return base;
      }
    },
    tagPos: { padding: '2px 6px', borderRadius: '3px', fontSize: '12px', display: 'inline-block', marginRight: '4px', border: '1px solid rgba(33, 150, 83, 0.4)', color: '#219653', backgroundColor: 'rgba(33, 150, 83, 0.1)' },
    tagNeg: { padding: '2px 6px', borderRadius: '3px', fontSize: '12px', display: 'inline-block', marginRight: '4px', border: '1px solid rgba(235, 87, 87, 0.4)', color: '#EB5757', backgroundColor: 'rgba(235, 87, 87, 0.1)' },
    checkbox: { accentColor: '#2D9CDB', cursor: 'pointer', width: '16px', height: '16px' },
    footerRow: { fontWeight: 'bold', color: '#9B9A97' },
    emptyState: { textAlign: 'center', padding: '40px', color: '#9B9A97', fontStyle: 'italic' }
  };

  const renderStars = (rating) => '★'.repeat(rating || 5) + '☆'.repeat(5 - (rating || 5));

  return (
    <motion.div style={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>📗 TRADES DB</h1>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '➕ Add Manual Trade'}
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
                <label style={styles.label}>Symbol / Pair</label>
                <input style={styles.input} name="symbol" value={formData.symbol} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date</label>
                <input style={styles.input} type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Session</label>
                <select style={styles.input} name="session" value={formData.session} onChange={handleChange}>
                  <option>London</option>
                  <option>New York</option>
                  <option>Asian</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Direction</label>
                <select style={styles.input} name="direction" value={formData.direction} onChange={handleChange}>
                  <option>LONG</option>
                  <option>SHORT</option>
                </select>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Entry Price</label>
                <input style={styles.input} type="number" step="any" name="entryPrice" placeholder="e.g. 45000.5" value={formData.entryPrice} onChange={handleChange} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Stop Loss</label>
                <input style={styles.input} type="number" step="any" name="stopLoss" placeholder="e.g. 44950.0" value={formData.stopLoss} onChange={handleChange} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Exit Price</label>
                <input style={styles.input} type="number" step="any" name="exitPrice" placeholder="e.g. 45100.0" value={formData.exitPrice} onChange={handleChange} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Est. R-Multiple</label>
                <div style={{ ...styles.input, color: calculatedRR >= 0 ? '#219653' : '#EB5757', fontWeight: 'bold' }}>
                  {calculatedRR}R
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Profit / Loss ($)</label>
                <input style={styles.input} type="number" name="profitLoss" value={formData.profitLoss} onChange={handleChange} required />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Playbook Model</label>
                <select style={styles.input} name="playbookId" value={formData.playbookId} onChange={handleChange}>
                  <option value="">-- Custom / Manual --</option>
                  {playbooks.map(pb => <option key={pb.id} value={pb.id}>{pb.name}</option>)}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Entry Window</label>
                <input style={styles.input} type="text" name="entryWindow" placeholder="e.g., 9-10am" value={formData.entryWindow} onChange={handleChange} />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Positive Tags</label>
                <input style={styles.input} type="text" name="positiveTags" placeholder="patient, good entry..." value={formData.positiveTags} onChange={handleChange} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Negative Tags</label>
                <input style={styles.input} type="text" name="negativeTags" placeholder="fomo, early exit..." value={formData.negativeTags} onChange={handleChange} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Rating (1-5)</label>
                <input style={styles.input} type="number" min="1" max="5" name="rating" value={formData.rating} onChange={handleChange} />
              </div>
              <div style={styles.checkboxGroup}>
                <input type="checkbox" name="followedPlan" checked={formData.followedPlan} onChange={handleChange} style={styles.checkbox} />
                <label style={styles.label}>Followed Plan</label>
              </div>
              <div style={styles.checkboxGroup}>
                <input type="checkbox" name="be" checked={formData.be} onChange={handleChange} style={styles.checkbox} />
                <label style={styles.label}>Hit Breakeven (BE)</label>
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Save Trade to Database</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>📄 Name</th>
              <th style={styles.th}>📅 Date</th>
              <th style={styles.th}>📈 Pairs</th>
              <th style={styles.th}>⏳ Session</th>
              <th style={styles.th}>↕️ Direction</th>
              <th style={styles.th}>🎯 Entry</th>
              <th style={styles.th}>🛡️ SL</th>
              <th style={styles.th}>🏁 Exit</th>
              <th style={styles.th}>⚖️ R:R</th>
              <th style={styles.th}>💵 P/L</th>
              <th style={styles.th}>☑️ Plan</th>
              <th style={styles.th}>☑️ BE</th>
              <th style={styles.th}>🕒 Window</th>
              <th style={styles.th}>🎯 Model</th>
              <th style={styles.th}>➕ Pos tags</th>
              <th style={styles.th}>➖ Neg tags</th>
              <th style={styles.th}>💼 Acc</th>
              <th style={styles.th}>⭐ Rate</th>
              <th style={styles.th}>🏆 WIN</th>
              <th style={styles.th}>⚙️ Action</th>
            </tr>
          </thead>
          <tbody>
            {!trades || trades.length === 0 ? (
              <tr>
                <td colSpan={20} style={styles.emptyState}>
                  No trades logged yet. Click "Add Manual Trade" to start journaling!
                </td>
              </tr>
            ) : (
              trades.map((trade, index) => (
                <tr key={trade.id}>
                  <td style={styles.td}><strong>{trades.length - index}</strong></td>
                  <td style={styles.td}>{trade.formattedDate || (trade.entryTime ? new Date(trade.entryTime).toLocaleDateString() : '')}</td>
                  <td style={styles.td}><strong>{trade.symbol}</strong></td>
                  <td style={styles.td}><span style={styles.pill(trade.session || 'New York')}>{trade.session || 'N/A'}</span></td>
                  <td style={styles.td}><span style={styles.pill(trade.direction || (trade.profitLoss > 0 ? 'LONG' : 'SHORT'))}>{trade.direction || '-'}</span></td>
                  
                  <td style={styles.td}>{trade.entryPrice === 0 ? '-' : trade.entryPrice}</td>
                  <td style={styles.td}>{trade.stopLoss === 0 ? '-' : trade.stopLoss}</td>
                  <td style={styles.td}>{trade.exitPrice === 0 ? '-' : trade.exitPrice}</td>
                  
                  <td style={{...styles.td, color: trade.riskReward >= 0 ? '#219653' : '#EB5757', fontWeight: 'bold'}}>
                    {trade.riskReward ? `${trade.riskReward}R` : '-'}
                  </td>

                  <td style={{...styles.td, color: trade.profitLoss > 0 ? '#219653' : '#EB5757', fontWeight: 'bold'}}>
                    ${trade.profitLoss}
                  </td>
                  <td style={styles.td}><input type="checkbox" checked={trade.followedPlan !== false} readOnly style={styles.checkbox}/></td>
                  <td style={styles.td}><input type="checkbox" checked={trade.be || false} readOnly style={styles.checkbox}/></td>
                  <td style={styles.td}><span style={styles.pill('Window')}>{trade.entryWindow || '-'}</span></td>
                  <td style={styles.td}><span style={styles.pill('Model')}>{trade.model || 'Manual'}</span></td>
                  <td style={styles.td}>
                    {(trade.positiveTags || []).map(tag => <span key={tag} style={styles.tagPos}>{tag}</span>)}
                  </td>
                  <td style={styles.td}>
                    {(trade.negativeTags || []).map(tag => <span key={tag} style={styles.tagNeg}>{tag}</span>)}
                  </td>
                  <td style={styles.td}><span style={styles.pill(trade.account || 'Account1')}>{trade.account || '-'}</span></td>
                  <td style={{...styles.td, color: '#F2C94C', letterSpacing: '2px'}}>{renderStars(trade.rating)}</td>
                  <td style={styles.td}><input type="checkbox" checked={trade.win || trade.profitLoss > 0} readOnly style={styles.checkbox}/></td>
                  <td style={styles.td}>
                    <button style={styles.deleteBtn} onClick={() => onDeleteTrade(trade.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
            
            {trades && trades.length > 0 && (
              <tr style={styles.footerRow}>
                <td style={{ ...styles.td, textAlign: 'right', paddingRight: '16px' }} colSpan={8}>SUM / AVG</td>
                <td style={{...styles.td, color: '#FFFFFF'}}>{summary.avgRR}R</td>
                <td style={{...styles.td, color: '#FFFFFF'}}>${summary.totalPnL}</td>
                <td style={{...styles.td, color: '#FFFFFF'}}>{summary.planPercent}%</td>
                <td style={styles.td} colSpan={5}></td>
                <td style={{...styles.td, color: '#FFFFFF'}}>{summary.avgRating}</td>
                <td style={{...styles.td, color: '#FFFFFF'}}>{summary.winRate}%</td>
                <td style={styles.td}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default TradesDB;