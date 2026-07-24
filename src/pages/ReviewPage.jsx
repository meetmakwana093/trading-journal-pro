import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
 
const ReviewPage = ({ trades = [], onUpdateTrade }) => {
  // --- 100% UNCHANGED LOGIC ---
  const [activeTab, setActiveTab] = useState('daily'); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
 
  const calculateTimeTaken = (entryTime, exitTime) => {
    if(!entryTime || !exitTime) return '--';
    const diffMs = new Date(exitTime) - new Date(entryTime);
    return `${Math.floor(diffMs / (1000 * 60 * 60))}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };
 
  const monthlyTrades = trades.filter(t => t.entryTime && t.entryTime.startsWith(selectedMonth));
  const monthlyMetrics = useMemo(() => {
    if (monthlyTrades.length === 0) return { totalTrades: 0, winRate: 0, totalPnL: 0, bestTrade: null, worstTrade: null };
    const winRate = (monthlyTrades.filter(t => t.profitLoss > 0).length / monthlyTrades.length) * 100;
    const totalPnL = monthlyTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const bestTrade = monthlyTrades.reduce((p, c) => (p.profitLoss > c.profitLoss) ? p : c);
    const worstTrade = monthlyTrades.reduce((p, c) => (p.profitLoss < c.profitLoss) ? p : c);
    return { totalTrades: monthlyTrades.length, winRate: parseFloat(winRate.toFixed(2)), totalPnL: parseFloat(totalPnL.toFixed(2)), bestTrade, worstTrade };
  }, [monthlyTrades]);
  // --- END LOGIC ---
 
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-grid">
      
      <div className="bento-card col-span-12" style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setActiveTab('daily')} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: '0.2s', background: activeTab === 'daily' ? 'rgba(0,255,136,0.15)' : 'transparent', color: activeTab === 'daily' ? '#00FF88' : '#8A8F98' }}>Daily Review</button>
          <button onClick={() => setActiveTab('monthly')} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: '0.2s', background: activeTab === 'monthly' ? 'rgba(0,255,136,0.15)' : 'transparent', color: activeTab === 'monthly' ? '#00FF88' : '#8A8F98' }}>Monthly Review</button>
        </div>
      </div>
 
      {activeTab === 'daily' ? <DailyReviewTab trades={trades} onUpdateTrade={onUpdateTrade} /> : <MonthlyReviewTab trades={monthlyTrades} metrics={monthlyMetrics} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
    </motion.div>
  );
};
 
const DailyReviewTab = ({ trades, onUpdateTrade }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); 
  const [tradeNotes, setTradeNotes] = useState({}); 
  const [editTradeId, setEditTradeId] = useState(null); 
  const [tempData, setTempData] = useState({ entry: '', exit: '', pnl: '', mistakes: '', lessons: '' });
 
  const dailyTrades = trades.filter(t => t.entryTime && t.entryTime.startsWith(selectedDate));

  useEffect(() => {
    const notes = {}; dailyTrades.forEach(t => { notes[t.id] = { mistakes: t.mistakes || '', lessons: t.wentRight || '' }; });
    setTradeNotes(notes);
  }, [trades, selectedDate]);
 
  const handleEdit = (trade) => {
    setEditTradeId(trade.id);
    setTempData({ entry: trade.entryPrice||0, exit: trade.exitPrice||0, pnl: trade.profitLoss||0, mistakes: tradeNotes[trade.id]?.mistakes||'', lessons: tradeNotes[trade.id]?.lessons||'' });
  };
 
  const handleSave = (trade) => {
    setTradeNotes(prev => ({ ...prev, [trade.id]: { mistakes: tempData.mistakes, lessons: tempData.lessons } }));
    onUpdateTrade({ ...trade, entryPrice: parseFloat(tempData.entry), exitPrice: parseFloat(tempData.exit), profitLoss: parseFloat(tempData.pnl), win: parseFloat(tempData.pnl) > 0, mistakes: tempData.mistakes, wentRight: tempData.lessons });
    setEditTradeId(null);
  };
 
  const inputStyle = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 12px', borderRadius: '8px', outline: 'none', width: '100%' };

  return (
    <>
      <div className="bento-card col-span-12" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label className="card-label" style={{margin:0}}>Select Date:</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{...inputStyle, width: 'auto'}} />
      </div>

      <div className="col-span-12" style={{ display: 'grid', gap: '24px' }}>
        {dailyTrades.length === 0 ? (
          <div className="bento-card text-center" style={{color: '#8A8F98'}}>No trades recorded on {selectedDate}.</div>
        ) : dailyTrades.map(trade => {
          const isProfitable = trade.profitLoss >= 0;
          const isEditing = editTradeId === trade.id;
          return (
            <div key={trade.id} className="bento-card" style={{ borderLeft: `4px solid ${isProfitable ? '#00FF88' : '#FF3366'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{trade.symbol}</span>
                <span style={{ color: '#8A8F98' }}>{trade.entryTime ? new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
              </div>

              {isEditing ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div><span className="card-label">Entry</span><input type="number" style={inputStyle} value={tempData.entry} onChange={e => setTempData({...tempData, entry: e.target.value})} /></div>
                  <div><span className="card-label">Exit</span><input type="number" style={inputStyle} value={tempData.exit} onChange={e => setTempData({...tempData, exit: e.target.value})} /></div>
                  <div><span className="card-label">P&L</span><input type="number" style={inputStyle} value={tempData.pnl} onChange={e => setTempData({...tempData, pnl: e.target.value})} /></div>
                  <div><span className="card-label">Rating</span><div style={{color: '#00FF88', fontWeight: 'bold', marginTop:'10px'}}>{trade.rating}/5</div></div>
                  
                  <div style={{ gridColumn: 'span 2' }}><span className="card-label">Mistakes</span><textarea style={{...inputStyle, minHeight:'60px'}} value={tempData.mistakes} onChange={e => setTempData({...tempData, mistakes: e.target.value})} /></div>
                  <div style={{ gridColumn: 'span 2' }}><span className="card-label">Lessons</span><textarea style={{...inputStyle, minHeight:'60px'}} value={tempData.lessons} onChange={e => setTempData({...tempData, lessons: e.target.value})} /></div>
                  
                  <div style={{ gridColumn: 'span 4', display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleSave(trade)} style={{ padding: '8px 24px', background: '#00FF88', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save Notes</button>
                    <button onClick={() => setEditTradeId(null)} style={{ padding: '8px 24px', background: 'transparent', color: '#FF3366', border: '1px solid #FF3366', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div><span className="card-label">Entry</span><div className="metric-value" style={{fontSize: '1.2rem'}}>${trade.entryPrice}</div></div>
                    <div><span className="card-label">Exit</span><div className="metric-value" style={{fontSize: '1.2rem'}}>${trade.exitPrice}</div></div>
                    <div><span className="card-label">P&L</span><div className={`metric-value ${isProfitable?'metric-green':'metric-red'}`} style={{fontSize: '1.2rem'}}>${trade.profitLoss}</div></div>
                    <div><span className="card-label">Rating</span><div className="metric-value metric-green" style={{fontSize: '1.2rem'}}>{trade.rating}/5</div></div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div><span className="card-label">Mistakes</span><p style={{color: '#8A8F98', fontSize: '0.9rem'}}>{tradeNotes[trade.id]?.mistakes || 'None noted'}</p></div>
                    <div><span className="card-label">Lessons</span><p style={{color: '#8A8F98', fontSize: '0.9rem'}}>{tradeNotes[trade.id]?.lessons || 'None noted'}</p></div>
                  </div>
                  <button onClick={() => handleEdit(trade)} style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Edit Details</button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
};

const MonthlyReviewTab = ({ trades, metrics, selectedMonth, onMonthChange }) => {
  const [lessons, setLessons] = useState('');
  const dailyData = useMemo(() => {
    const grouped = {}; trades.forEach(t => { if(t.entryTime) grouped[t.entryTime.split('T')[0]] = (grouped[t.entryTime.split('T')[0]] || 0) + t.profitLoss; });
    return Object.entries(grouped).map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [trades]);

  return (
    <>
      <div className="bento-card col-span-12" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label className="card-label" style={{margin:0}}>Select Month:</label>
        <input type="month" value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 12px', borderRadius: '8px', outline: 'none' }} />
      </div>

      <div className="bento-card col-span-4 text-center"><div className="card-label">Total Trades</div><div className="metric-value text-primary">{metrics.totalTrades}</div></div>
      <div className="bento-card col-span-4 text-center"><div className="card-label">Win Rate</div><div className={`metric-value ${metrics.winRate >= 50 ? 'metric-green' : 'metric-red'}`}>{metrics.winRate}%</div></div>
      <div className="bento-card col-span-4 text-center"><div className="card-label">Total P&L</div><div className={`metric-value ${metrics.totalPnL >= 0 ? 'metric-green' : 'metric-red'}`}>${metrics.totalPnL}</div></div>

      {metrics.bestTrade && (
        <div className="bento-card col-span-6" style={{ background: 'rgba(0,255,136,0.05)', borderColor: 'rgba(0,255,136,0.2)' }}>
          <div className="card-label metric-green">Best Trade</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}><span>{metrics.bestTrade.symbol}</span><span>+${metrics.bestTrade.profitLoss}</span></div>
        </div>
      )}
      {metrics.worstTrade && (
        <div className="bento-card col-span-6" style={{ background: 'rgba(255,51,102,0.05)', borderColor: 'rgba(255,51,102,0.2)' }}>
          <div className="card-label metric-red">Worst Trade</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}><span>{metrics.worstTrade.symbol}</span><span>${metrics.worstTrade.profitLoss}</span></div>
        </div>
      )}

      <div className="bento-card col-span-12">
        <div className="card-label" style={{ marginBottom: '16px' }}>Monthly Performance</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#8A8F98" axisLine={false} tickLine={false} />
            <YAxis stroke="#8A8F98" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '12px' }} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {dailyData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#00FF88' : '#FF3366'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bento-card col-span-12">
        <div className="card-label">Monthly Lessons</div>
        <textarea value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="Type lessons learned..." style={{ width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '16px', borderRadius: '12px', outline: 'none', resize: 'vertical' }} />
      </div>
    </>
  )
};
 
export default ReviewPage;