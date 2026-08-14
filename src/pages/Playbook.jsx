// import React, { useState, useMemo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const Playbook = ({ playbooks = [], trades = [], onAddPlaybook, onDeletePlaybook }) => {
//   const [showForm, setShowForm] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '', timeframe: '15m', description: '', rules: ''
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.name.trim()) return;
//     onAddPlaybook(formData);
//     setFormData({ name: '', timeframe: '15m', description: '', rules: '' });
//     setShowForm(false);
//   };

//   const playbookStats = useMemo(() => {
//     return playbooks.map(pb => {
//       const pbTrades = trades.filter(t => t.playbookId === pb.id || t.model === pb.name);
//       const totalTrades = pbTrades.length;
//       const wins = pbTrades.filter(t => t.profitLoss > 0).length;
//       const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
//       const totalPnL = pbTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
//       const avgRR = totalTrades > 0 ? (pbTrades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / totalTrades).toFixed(2) : 0;

//       return { ...pb, totalTrades, winRate, totalPnL: totalPnL.toFixed(2), avgRR };
//     });
//   }, [playbooks, trades]);

//   const styles = {
//     container: { backgroundColor: '#191919', color: '#E0E0E0', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
//     header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
//     title: { fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
//     addButton: { backgroundColor: '#2D9CDB', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' },
//     formContainer: { backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
//     formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
//     inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
//     label: { fontSize: '12px', color: '#9B9A97', fontWeight: 'bold', textTransform: 'uppercase' },
//     input: { backgroundColor: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' },
//     submitButton: { backgroundColor: '#219653', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%' },
//     grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
//     card: { background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' },
//     cardLabel: { color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '10px' },
//     cardValue: { fontSize: '2rem', fontWeight: 'bold', color: '#00FF88' },
//     deleteBtn: { backgroundColor: 'transparent', color: '#EB5757', border: '1px solid rgba(235, 87, 87, 0.4)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', transition: 'all 0.2s', float: 'right' },
//     metricBox: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#191919', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }
//   };

//   return (
//     <motion.div style={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//       <div style={styles.header}>
//         <h1 style={styles.title}>📘 STRATEGY PLAYBOOK</h1>
//         <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
//           {showForm ? 'Close Form' : '➕ Add Setup Model'}
//         </button>
//       </div>

//       <AnimatePresence>
//         {showForm && (
//           <motion.form 
//             initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
//             animate={{ opacity: 1, height: 'auto' }} 
//             exit={{ opacity: 0, height: 0 }}
//             style={styles.formContainer}
//             onSubmit={handleSubmit}
//           >
//             <div style={styles.formGrid}>
//               <div style={styles.inputGroup}>
//                 <label style={styles.label}>Model Name</label>
//                 <input style={styles.input} name="name" value={formData.name} onChange={handleChange} placeholder="e.g. SMC Liq Sweep" required />
//               </div>
//               <div style={styles.inputGroup}>
//                 <label style={styles.label}>Timeframe</label>
//                 <select style={styles.input} name="timeframe" value={formData.timeframe} onChange={handleChange}>
//                   <option value="1m">1m</option><option value="3m">3m</option><option value="5m">5m</option><option value="15m">15m</option><option value="1H">1H</option>
//                 </select>
//               </div>
//               <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
//                 <label style={styles.label}>Description</label>
//                 <input style={styles.input} name="description" value={formData.description} onChange={handleChange} placeholder="Short summary of setup..." />
//               </div>
//               <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
//                 <label style={styles.label}>Execution Rules</label>
//                 <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} name="rules" value={formData.rules} onChange={handleChange} placeholder="1. Sweep high... 2. FVG entry..." />
//               </div>
//             </div>
//             <button type="submit" style={styles.submitButton}>Save Playbook Model</button>
//           </motion.form>
//         )}
//       </AnimatePresence>

//       <div style={styles.grid}>
//         {playbookStats.length === 0 ? (
//           <div style={{ ...styles.card, gridColumn: 'span 2', textAlign: 'center', color: '#B0B0B0', borderStyle: 'dashed' }}>
//             No models created yet. Click "Add Setup Model" to start building your playbook!
//           </div>
//         ) : (
//           playbookStats.map(pb => (
//             <motion.div key={pb.id} style={styles.card} whileHover={{ y: -5, boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)' }}>
//               <button style={styles.deleteBtn} onClick={() => onDeletePlaybook(pb.id)}>Delete</button>
//               <h3 style={{ color: '#00FF88', margin: '0 0 5px 0', fontSize: '1.4rem' }}>{pb.name} <span style={{fontSize: '0.8rem', color: '#9B9A97', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px'}}>{pb.timeframe}</span></h3>
//               <p style={{ color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '15px' }}>{pb.description || 'No description'}</p>
              
//               <div style={styles.metricBox}>
//                 <div><div style={{color: '#9B9A97', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'}}>Trades</div><div style={{color: '#FFF', fontWeight: 'bold', fontSize: '1.2rem'}}>{pb.totalTrades}</div></div>
//                 <div><div style={{color: '#9B9A97', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'}}>Win %</div><div style={{color: pb.winRate >= 50 ? '#219653' : '#EB5757', fontWeight: 'bold', fontSize: '1.2rem'}}>{pb.winRate}%</div></div>
//                 <div><div style={{color: '#9B9A97', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'}}>Avg R:R</div><div style={{color: '#2D9CDB', fontWeight: 'bold', fontSize: '1.2rem'}}>{pb.avgRR}R</div></div>
//                 <div><div style={{color: '#9B9A97', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'}}>P&L</div><div style={{color: pb.totalPnL >= 0 ? '#219653' : '#EB5757', fontWeight: 'bold', fontSize: '1.2rem'}}>${pb.totalPnL}</div></div>
//               </div>

//               {pb.rules && (
//                 <div>
//                   <div style={{color: '#9B9A97', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 'bold'}}>Rules</div>
//                   <div style={{color: '#FFF', fontSize: '0.9rem', whiteSpace: 'pre-line', background: '#191919', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)'}}>{pb.rules}</div>
//                 </div>
//               )}
//             </motion.div>
//           ))
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default Playbook;