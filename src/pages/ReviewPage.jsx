import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
 
const ReviewPage = ({ trades = [], onUpdateTrade }) => {
  const [activeTab, setActiveTab] = useState('daily'); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
 
  const calculateTimeTaken = (entryTime, exitTime) => {
    if(!entryTime || !exitTime) return '--';
    const diffMs = new Date(exitTime) - new Date(entryTime);
    return `${Math.floor(diffMs / (1000 * 60 * 60))}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };
 
  const getTradesForMonth = (month) => trades.filter(t => t.entryTime && t.entryTime.startsWith(month));
 
  const monthlyTrades = getTradesForMonth(selectedMonth);
  const calculateMonthlyMetrics = (tradeSet) => {
    if (tradeSet.length === 0) return { totalTrades: 0, winRate: 0, totalPnL: 0, bestTrade: null, worstTrade: null };
    const winRate = (tradeSet.filter(t => t.profitLoss > 0).length / tradeSet.length) * 100;
    const totalPnL = tradeSet.reduce((sum, t) => sum + t.profitLoss, 0);
    const bestTrade = tradeSet.reduce((prev, current) => (prev.profitLoss > current.profitLoss) ? prev : current);
    const worstTrade = tradeSet.reduce((prev, current) => (prev.profitLoss < current.profitLoss) ? prev : current);
    return { totalTrades: tradeSet.length, winRate: parseFloat(winRate.toFixed(2)), totalPnL: parseFloat(totalPnL.toFixed(2)), bestTrade, worstTrade };
  };
 
  const monthlyMetrics = calculateMonthlyMetrics(monthlyTrades);
 
  const pageStyles = {
    page: { backgroundColor: '#0F0F0F', minHeight: '100vh', padding: '20px', color: 'white' },
    pageHeader: { textAlign: 'center', marginBottom: '30px', background: 'rgba(0, 255, 136, 0.05)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.2)' },
    headerTitle: { fontSize: '2.5rem', color: '#00FF88', margin: '0 0 10px 0', fontWeight: 'bold' },
    headerSubtitle: { color: '#B0B0B0', margin: 0, fontSize: '1rem' },
    tabsContainer: { display: 'flex', gap: '15px', marginBottom: '30px', justifyContent: 'center' },
    tabBtn: { padding: '12px 30px', background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', color: '#B0B0B0', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', transition: 'all 0.3s' },
    tabBtnActive: { background: 'rgba(0, 255, 136, 0.1)', color: '#00FF88', border: '1px solid #00FF88', boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)' },
  };
 
  return (
    <motion.div style={pageStyles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div style={pageStyles.pageHeader} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={pageStyles.headerTitle}>📊 Trade Review</h1>
        <p style={pageStyles.headerSubtitle}>Analyze your trading performance in detail</p>
      </motion.div>
 
      <div style={pageStyles.tabsContainer}>
        <motion.button style={{ ...pageStyles.tabBtn, ...(activeTab === 'daily' && pageStyles.tabBtnActive) }} onClick={() => setActiveTab('daily')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>📅 Daily Review</motion.button>
        <motion.button style={{ ...pageStyles.tabBtn, ...(activeTab === 'monthly' && pageStyles.tabBtnActive) }} onClick={() => setActiveTab('monthly')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>📈 Monthly Review</motion.button>
      </div>
 
      <div style={{marginTop: '20px'}}>
        {activeTab === 'daily' ? <DailyReviewTab trades={trades} calculateTimeTaken={calculateTimeTaken} onUpdateTrade={onUpdateTrade} /> : <MonthlyReviewTab trades={monthlyTrades} metrics={monthlyMetrics} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
      </div>
    </motion.div>
  );
};
 
const DailyReviewTab = ({ trades, calculateTimeTaken, onUpdateTrade }) => {
  // NEW: Let the user select the exact date they want to review!
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); 
  const [tradeNotes, setTradeNotes] = useState({}); 
  const [editTradeId, setEditTradeId] = useState(null); 
  
  const [tempEntry, setTempEntry] = useState('');
  const [tempExit, setTempExit] = useState('');
  const [tempPnL, setTempPnL] = useState('');
  const [tempMistakes, setTempMistakes] = useState('');
  const [tempLessons, setTempLessons] = useState('');
 
  // Get trades only for the specific selected date
  const dailyTrades = trades.filter(t => t.entryTime && t.entryTime.startsWith(selectedDate));

  useEffect(() => {
    const notes = {};
    dailyTrades.forEach(t => { notes[t.id] = { mistakes: t.mistakes || '', lessonsLearned: t.wentRight || '' }; });
    setTradeNotes(notes);
  }, [trades, selectedDate]);
 
  const handleEdit = (trade) => {
    setEditTradeId(trade.id);
    setTempEntry(trade.entryPrice || 0);
    setTempExit(trade.exitPrice || 0);
    setTempPnL(trade.profitLoss || 0);
    setTempMistakes(tradeNotes[trade.id]?.mistakes || '');
    setTempLessons(tradeNotes[trade.id]?.lessonsLearned || '');
  };
 
  const handleSave = (trade) => {
    // Save Notes Locally
    setTradeNotes(prev => ({ ...prev, [trade.id]: { mistakes: tempMistakes, lessonsLearned: tempLessons } }));
    
    // Save Actual Entry/Exit/PnL to Database
    onUpdateTrade({
      ...trade,
      entryPrice: parseFloat(tempEntry),
      exitPrice: parseFloat(tempExit),
      profitLoss: parseFloat(tempPnL),
      win: parseFloat(tempPnL) > 0, // auto update win/loss status
      mistakes: tempMistakes,
      wentRight: tempLessons
    });
    
    setEditTradeId(null);
  };
 
  const styles = {
    sectionTitle: { fontSize: '1.5rem', color: '#00FF88', marginBottom: '20px', fontWeight: 'bold' },
    tradeCard: { background: 'rgba(26, 26, 26, 0.8)', borderRadius: '12px', padding: '20px', transition: 'all 0.3s' },
    tradeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(0, 255, 136, 0.1)' },
    detailRow: { display: 'flex', flexDirection: 'column', gap: '5px' },
    notesInput: { background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', padding: '10px', color: '#B0B0B0', minHeight: '80px', fontFamily: 'inherit' },
    shortInput: { background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', padding: '8px', color: '#FFFFFF', width: '100px' }
  };
 
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label style={{ color: '#B0B0B0', fontWeight: '500' }}>📆 Select Day:</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '10px 15px', background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', color: '#00FF88' }} />
      </div>

      <div style={styles.sectionTitle}>Daily Review ({dailyTrades.length} trades)</div>
      
      {dailyTrades.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#B0B0B0', padding: '40px', background: 'rgba(26, 26, 26, 0.5)', borderRadius: '12px', border: '1px dashed rgba(0, 255, 136, 0.2)' }}>No trades recorded on {selectedDate}. Choose another date! 🎯</div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {dailyTrades.map((trade) => {
            const isProfitable = trade.profitLoss >= 0;
            const isEditing = editTradeId === trade.id;

            return (
              <motion.div key={trade.id} style={{ ...styles.tradeCard, border: isProfitable ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 51, 51, 0.3)' }} whileHover={{ y: -2 }}>
                <div style={styles.tradeHeader}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#00FF88' }}>{trade.symbol}</span>
                  <span style={{ color: '#B0B0B0' }}>{trade.entryTime ? new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
                </div>

                {isEditing ? (
                  // EDIT MODE FOR TRADE DETAILS
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>Entry</span><input type="number" style={styles.shortInput} value={tempEntry} onChange={(e) => setTempEntry(e.target.value)} /></div>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>Exit</span><input type="number" style={styles.shortInput} value={tempExit} onChange={(e) => setTempExit(e.target.value)} /></div>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>P&L</span><input type="number" style={styles.shortInput} value={tempPnL} onChange={(e) => setTempPnL(e.target.value)} /></div>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>Rating</span><span style={{ color: '#00FF88', fontSize: '1.1rem', fontWeight: 'bold', paddingTop: '8px' }}>{trade.rating || '--'}/5</span></div>
                  </div>
                ) : (
                  // VIEW MODE FOR TRADE DETAILS
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>Entry</span><span style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 'bold' }}>${trade.entryPrice || 0}</span></div>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>Exit</span><span style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 'bold' }}>${trade.exitPrice || 0}</span></div>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>P&L</span><span style={{ color: isProfitable ? '#00FF88' : '#FF3333', fontSize: '1.1rem', fontWeight: 'bold' }}>${trade.profitLoss}</span></div>
                    <div style={styles.detailRow}><span style={{color: '#B0B0B0'}}>Rating</span><span style={{ color: '#00FF88', fontSize: '1.1rem', fontWeight: 'bold' }}>{trade.rating || '--'}/5</span></div>
                  </div>
                )}

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(0, 255, 136, 0.1)' }}>
                  {isEditing ? (
                    // EDIT MODE FOR NOTES
                    <div style={{ display: 'grid', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{color: '#B0B0B0', fontSize: '0.9rem', fontWeight: '500'}}>❌ Mistakes:</span>
                        <textarea value={tempMistakes} onChange={(e) => setTempMistakes(e.target.value)} style={styles.notesInput} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{color: '#B0B0B0', fontSize: '0.9rem', fontWeight: '500'}}>✅ Lessons learned:</span>
                        <textarea value={tempLessons} onChange={(e) => setTempLessons(e.target.value)} style={styles.notesInput} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleSave(trade)} style={{ flex: 1, padding: '10px 20px', background: '#00FF88', color: '#0F0F0F', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                        <button onClick={() => setEditTradeId(null)} style={{ flex: 1, padding: '10px 20px', background: 'rgba(255, 51, 51, 0.2)', color: '#FF3333', border: '1px solid #FF3333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE FOR NOTES
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <span style={{color: '#B0B0B0', fontSize: '0.9rem', fontWeight: '500'}}>❌ Mistakes:</span>
                        <span style={{color: '#B0B0B0', fontSize: '0.95rem', lineHeight: '1.5'}}>{tradeNotes[trade.id]?.mistakes || 'None noted'}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <span style={{color: '#B0B0B0', fontSize: '0.9rem', fontWeight: '500'}}>✅ Lessons learned:</span>
                        <span style={{color: '#B0B0B0', fontSize: '0.95rem', lineHeight: '1.5'}}>{tradeNotes[trade.id]?.lessonsLearned || 'None noted'}</span>
                      </div>
                      <button onClick={() => handleEdit(trade)} style={{ padding: '10px 20px', background: 'rgba(0, 255, 136, 0.1)', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginTop: '10px' }}>✏️ Edit Trade & Notes</button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
 
const MonthlyReviewTab = ({ trades, metrics, selectedMonth, onMonthChange }) => {
  const [lessons, setLessons] = useState('');

  const dailyData = useMemo(() => {
    const grouped = {};
    trades.forEach(t => {
      if(!t.entryTime) return;
      const date = t.entryTime.split('T')[0];
      grouped[date] = (grouped[date] || 0) + t.profitLoss;
    });
    return Object.entries(grouped)
      .map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [trades]);

  const isWorstTradeLoss = metrics.worstTrade?.profitLoss < 0;
 
  const styles = {
    metricCard: { background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '25px', textAlign: 'center', transition: 'all 0.3s' },
    tradeCard: { borderRadius: '12px', padding: '25px', transition: 'all 0.3s' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    lessonsTextarea: { width: '100%', minHeight: '150px', padding: '20px', background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', color: '#B0B0B0', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' },
  };
 
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label style={{ color: '#B0B0B0', fontWeight: '500' }}>📆 Select Month:</label>
        <input type="month" value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} style={{ padding: '10px 15px', background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', color: '#00FF88' }} />
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <motion.div style={styles.metricCard} whileHover={{ scale: 1.05 }}><div style={{ color: '#B0B0B0', marginBottom: '10px' }}>Total Trades</div><div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00FF88' }}>{metrics.totalTrades}</div></motion.div>
        <motion.div style={styles.metricCard} whileHover={{ scale: 1.05 }}><div style={{ color: '#B0B0B0', marginBottom: '10px' }}>Win Rate</div><div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: metrics.winRate >= 50 ? '#00FF88' : '#FF3333' }}>{metrics.winRate}%</div></motion.div>
        <motion.div style={styles.metricCard} whileHover={{ scale: 1.05 }}><div style={{ color: '#B0B0B0', marginBottom: '10px' }}>Total P&L</div><div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333' }}>${metrics.totalPnL}</div></motion.div>
      </div>
 
      {metrics.bestTrade && metrics.worstTrade && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <motion.div style={{ ...styles.tradeCard, background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.3)' }} whileHover={{ scale: 1.05 }}>
            <div style={{ fontSize: '1.2rem', color: '#00FF88', marginBottom: '15px', fontWeight: 'bold' }}>🏆 Best Trade</div>
            <div>
              <div style={styles.detailRow}><span style={{ color: '#B0B0B0' }}>Symbol:</span><span style={{ color: '#00FF88', fontWeight: 'bold', fontSize: '1.1rem' }}>{metrics.bestTrade.symbol}</span></div>
              <div style={styles.detailRow}><span style={{ color: '#B0B0B0' }}>P&L:</span><span style={{ color: '#00FF88', fontWeight: 'bold', fontSize: '1.1rem' }}>${metrics.bestTrade.profitLoss}</span></div>
            </div>
          </motion.div>

          <motion.div style={{ ...styles.tradeCard, background: isWorstTradeLoss ? 'rgba(255, 51, 51, 0.05)' : 'rgba(0, 255, 136, 0.05)', border: isWorstTradeLoss ? '1px solid rgba(255, 51, 51, 0.3)' : '1px solid rgba(0, 255, 136, 0.3)' }} whileHover={{ scale: 1.05 }}>
            <div style={{ fontSize: '1.2rem', color: isWorstTradeLoss ? '#FF3333' : '#00FF88', marginBottom: '15px', fontWeight: 'bold' }}>
              {isWorstTradeLoss ? '📉 Worst Trade' : '🥈 Lowest Profit Trade'}
            </div>
            <div>
              <div style={styles.detailRow}><span style={{ color: '#B0B0B0' }}>Symbol:</span><span style={{ color: isWorstTradeLoss ? '#FF3333' : '#00FF88', fontWeight: 'bold', fontSize: '1.1rem' }}>{metrics.worstTrade.symbol}</span></div>
              <div style={styles.detailRow}><span style={{ color: '#B0B0B0' }}>P&L:</span><span style={{ color: isWorstTradeLoss ? '#FF3333' : '#00FF88', fontWeight: 'bold', fontSize: '1.1rem' }}>${metrics.worstTrade.profitLoss}</span></div>
            </div>
          </motion.div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '1.2rem', color: '#00FF88', marginBottom: '15px', fontWeight: 'bold' }}>📊 Monthly Performance Chart</div>
        <div style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' }}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                <XAxis dataKey="date" stroke="#B0B0B0" />
                <YAxis stroke="#B0B0B0" />
                <Tooltip contentStyle={{ background: '#262626', border: '1px solid #00FF88', borderRadius: '8px' }} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF88' : '#FF3333'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#B0B0B0', padding: '60px 20px' }}>No trades logged for this month yet.</div>
          )}
        </div>
      </div>
 
      <div>
        <div style={{ fontSize: '1.2rem', color: '#00FF88', marginBottom: '15px', fontWeight: 'bold' }}>💡 Key Lessons Learned</div>
        <textarea value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="Enter key lessons learned this month..." style={styles.lessonsTextarea} />
      </div>
    </motion.div>
  );
};
 
export default ReviewPage;