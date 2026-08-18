import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

const ReviewPage = ({ trades = [], onUpdateTrade }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const getTradesForMonth = (month) => trades.filter(t => (t.entryTime || t.date || '').startsWith(month));
  const monthlyTrades = getTradesForMonth(selectedMonth);

  const calculateMonthlyMetrics = (tradeSet) => {
    if (tradeSet.length === 0) return { totalTrades: 0, winRate: 0, totalPnL: 0, profitFactor: 0, bestTrade: null, worstTrade: null };
    const wins = tradeSet.filter(t => t.profitLoss > 0);
    const losses = tradeSet.filter(t => t.profitLoss < 0);
    const winRate = (wins.length / tradeSet.length) * 100;
    const totalPnL = tradeSet.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    
    const bestTrade = tradeSet.reduce((prev, current) => (prev.profitLoss > current.profitLoss) ? prev : current, tradeSet[0]);
    const worstTrade = tradeSet.reduce((prev, current) => (prev.profitLoss < current.profitLoss) ? prev : current, tradeSet[0]);
    
    return { 
      totalTrades: tradeSet.length, 
      winRate: parseFloat(winRate.toFixed(1)), 
      totalPnL: parseFloat(totalPnL.toFixed(2)), 
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      bestTrade, 
      worstTrade 
    };
  };

  const monthlyMetrics = calculateMonthlyMetrics(monthlyTrades);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER & TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0', background: 'linear-gradient(135deg, #ffffff 0%, #00FF88 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            📝 END OF DAY REVIEW
          </h1>
          <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Log your mistakes, analyze your execution, and refine your edge.</p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', border: `1px solid rgba(255,255,255,0.05)` }}>
          <button 
            onClick={() => setActiveTab('daily')}
            style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'daily' ? 'rgba(0, 255, 136, 0.15)' : 'transparent', color: activeTab === 'daily' ? '#00FF88' : '#9B9A97' }}
          >
            Daily Session
          </button>
          <button 
            onClick={() => setActiveTab('monthly')}
            style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'monthly' ? 'rgba(0, 255, 136, 0.15)' : 'transparent', color: activeTab === 'monthly' ? '#00FF88' : '#9B9A97' }}
          >
            Monthly Aggregate
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'daily' ? (
          <DailyReviewTab key="daily" trades={trades} onUpdateTrade={onUpdateTrade} />
        ) : (
          <MonthlyReviewTab key="monthly" trades={monthlyTrades} metrics={monthlyMetrics} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

const DailyReviewTab = ({ trades, onUpdateTrade }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); 
  const [editTradeId, setEditTradeId] = useState(null); 
  const [tempData, setTempData] = useState({});

  const dailyTrades = useMemo(() => trades.filter(t => (t.entryTime || t.date || '').startsWith(selectedDate)), [trades, selectedDate]);

  const dayMetrics = useMemo(() => {
    if (dailyTrades.length === 0) return { pnl: 0, winRate: 0 };
    const wins = dailyTrades.filter(t => t.profitLoss > 0).length;
    const pnl = dailyTrades.reduce((s, t) => s + t.profitLoss, 0);
    return { pnl: pnl.toFixed(2), winRate: ((wins / dailyTrades.length) * 100).toFixed(0) };
  }, [dailyTrades]);

  const handleEdit = (trade) => {
    setEditTradeId(trade.id);
    setTempData({
      entryPrice: trade.entryPrice || '',
      exitPrice: trade.exitPrice || '',
      profitLoss: trade.profitLoss || '',
      mistakes: trade.mistakes || '',
      wentRight: trade.wentRight || ''
    });
  };

  const handleSave = (trade) => {
    onUpdateTrade({
      ...trade,
      entryPrice: parseFloat(tempData.entryPrice) || 0,
      exitPrice: parseFloat(tempData.exitPrice) || 0,
      profitLoss: parseFloat(tempData.profitLoss) || 0,
      win: parseFloat(tempData.profitLoss) > 0,
      mistakes: tempData.mistakes,
      wentRight: tempData.wentRight
    });
    setEditTradeId(null);
  };

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      
      {/* CONTROLS & DAY SUMMARY */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(38,38,38,0.4)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#9B9A97', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Select Date:</span>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#00FF88', padding: '8px 16px', borderRadius: '8px', outline: 'none', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
        
        {dailyTrades.length > 0 && (
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase' }}>Session P&L</div>
              <div style={{ color: dayMetrics.pnl >= 0 ? '#00FF88' : '#FF3333', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{dayMetrics.pnl >= 0 ? '+' : ''}${dayMetrics.pnl}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase' }}>Win Rate</div>
              <div style={{ color: '#FFF', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{dayMetrics.winRate}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#9B9A97', textTransform: 'uppercase' }}>Trades</div>
              <div style={{ color: '#2D9CDB', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{dailyTrades.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* TRADES GRID */}
      {dailyTrades.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6B7280', padding: '60px', background: 'rgba(38,38,38,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          No executions recorded for {selectedDate}.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '20px' }}>
          {dailyTrades.map((trade) => {
            const isWin = trade.profitLoss >= 0;
            const isEditing = editTradeId === trade.id;

            return (
              <motion.div layout key={trade.id} style={{ background: 'rgba(13,17,28,0.95)', borderRadius: '16px', border: `1px solid ${isWin ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,51,0.2)'}`, padding: '24px', boxShadow: `0 8px 24px ${isWin ? 'rgba(0,255,136,0.02)' : 'rgba(255,51,51,0.02)'}`, display: 'flex', flexDirection: 'column' }}>
                
                {/* CARD HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>{trade.symbol}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: trade.direction === 'LONG' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,51,0.1)', color: trade.direction === 'LONG' ? '#00FF88' : '#FF3333', fontWeight: 700 }}>{trade.direction || 'LONG'}</span>
                      {trade.model && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#D1D5DB' }}>{trade.model}</span>}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{trade.entryTime ? new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : trade.session || 'Manual Entry'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isWin ? '#00FF88' : '#FF3333', fontFamily: 'JetBrains Mono, monospace' }}>{isWin ? '+' : ''}{formatCurrency(trade.profitLoss)}</div>
                  </div>
                </div>

                {/* EDIT OR VIEW BODY */}
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div><label style={{ fontSize: '0.7rem', color: '#9B9A97' }}>Entry Price</label><input type="number" value={tempData.entryPrice} onChange={e => setTempData({...tempData, entryPrice: e.target.value})} style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px', borderRadius: '6px' }} /></div>
                        <div><label style={{ fontSize: '0.7rem', color: '#9B9A97' }}>Exit Price</label><input type="number" value={tempData.exitPrice} onChange={e => setTempData({...tempData, exitPrice: e.target.value})} style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px', borderRadius: '6px' }} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '0.7rem', color: '#9B9A97' }}>Net P&L ($)</label><input type="number" value={tempData.profitLoss} onChange={e => setTempData({...tempData, profitLoss: e.target.value})} style={{ width: '100%', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px', borderRadius: '6px' }} /></div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#FF3333', fontWeight: 600, display: 'flex', gap: '6px' }}><span>❌</span> Execution Mistakes</label>
                          <textarea value={tempData.mistakes} onChange={e => setTempData({...tempData, mistakes: e.target.value})} placeholder="Did you FOMO? Late entry? Stopped out early?" style={{ width: '100%', height: '80px', background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.2)', color: '#FFF', padding: '10px', borderRadius: '8px', outline: 'none', resize: 'vertical' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 600, display: 'flex', gap: '6px' }}><span>✅</span> What Went Right (Lessons)</label>
                          <textarea value={tempData.wentRight} onChange={e => setTempData({...tempData, wentRight: e.target.value})} placeholder="Followed plan? Good patience?" style={{ width: '100%', height: '80px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', color: '#FFF', padding: '10px', borderRadius: '8px', outline: 'none', resize: 'vertical' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleSave(trade)} style={{ flex: 1, padding: '10px', background: '#00FF88', color: '#080B14', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
                        <button onClick={() => setEditTradeId(null)} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div><div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>Entry</div><div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{trade.entryPrice || '-'}</div></div>
                        <div><div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>Exit</div><div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{trade.exitPrice || '-'}</div></div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#FF3333', fontWeight: 600, marginBottom: '6px' }}>❌ Mistakes:</div>
                          <div style={{ fontSize: '0.85rem', color: trade.mistakes ? '#D1D5DB' : '#6B7280', lineHeight: 1.5 }}>{trade.mistakes || 'No mistakes logged.'}</div>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 600, marginBottom: '6px' }}>✅ Lessons:</div>
                          <div style={{ fontSize: '0.85rem', color: trade.wentRight ? '#D1D5DB' : '#6B7280', lineHeight: 1.5 }}>{trade.wentRight || 'No lessons logged.'}</div>
                        </div>
                      </div>

                      <button onClick={() => handleEdit(trade)} style={{ width: '100%', padding: '12px', marginTop: '16px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.05)'}>
                        Refine Notes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

const MonthlyReviewTab = ({ trades, metrics, selectedMonth, onMonthChange }) => {
  const [lessons, setLessons] = useState(() => localStorage.getItem(`monthly_lessons_${selectedMonth}`) || '');

  const handleLessonsChange = (e) => {
    setLessons(e.target.value);
    localStorage.setItem(`monthly_lessons_${selectedMonth}`, e.target.value);
  };

  const dailyData = useMemo(() => {
    const grouped = {};
    trades.forEach(t => {
      const date = (t.entryTime || t.date || '').split('T')[0].split(' ')[0];
      if(!date) return;
      grouped[date] = (grouped[date] || 0) + t.profitLoss;
    });
    return Object.entries(grouped)
      .map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [trades]);

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const isWorstTradeLoss = metrics.worstTrade?.profitLoss < 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isNegative = val < 0;
      return (
        <div style={{ background: 'rgba(10, 14, 23, 0.95)', border: `1px solid ${isNegative ? '#FF3333' : '#00FF88'}`, padding: '12px 16px', borderRadius: '8px', boxShadow: `0 8px 24px rgba(0,0,0,0.4)` }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700 }}>{label}</p>
          <p style={{ color: isNegative ? '#FF3333' : '#00FF88', margin: 0, fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {val >= 0 ? '+' : '-'}${Math.abs(val).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: 'rgba(38,38,38,0.4)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#9B9A97', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Select Month:</span>
        <input type="month" value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} style={{ background: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#00FF88', padding: '8px 16px', borderRadius: '8px', outline: 'none', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Total Executions', val: metrics.totalTrades, c: '#2D9CDB' },
          { label: 'Monthly Win Rate', val: metrics.winRate, suffix: '%', c: '#00FF88' },
          { label: 'Net P&L', val: metrics.totalPnL, prefix: '$', c: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333' },
          { label: 'Profit Factor', val: metrics.profitFactor, c: '#00FF88' }
        ].map((m, i) => (
          <div key={i} style={{ background: 'rgba(13,17,28,0.95)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ color: '#9B9A97', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ color: m.c, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{m.prefix || ''}{m.val}{m.suffix || ''}</div>
          </div>
        ))}
      </div>

      {metrics.bestTrade && metrics.worstTrade && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#00FF88', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 700 }}>🏆 Best Execution</div>
              <div style={{ fontSize: '1.4rem', color: '#FFF', fontWeight: 800 }}>{metrics.bestTrade.symbol}</div>
              <div style={{ fontSize: '0.8rem', color: '#9B9A97', marginTop: '4px' }}>{metrics.bestTrade.date || (metrics.bestTrade.entryTime ? metrics.bestTrade.entryTime.split(' ')[0] : '')}</div>
            </div>
            <div style={{ fontSize: '2rem', color: '#00FF88', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>+{formatCurrency(metrics.bestTrade.profitLoss)}</div>
          </div>

          <div style={{ background: isWorstTradeLoss ? 'rgba(255, 51, 51, 0.05)' : 'rgba(0, 255, 136, 0.05)', border: isWorstTradeLoss ? '1px solid rgba(255, 51, 51, 0.2)' : '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: isWorstTradeLoss ? '#FF3333' : '#00FF88', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 700 }}>{isWorstTradeLoss ? '📉 Heaviest Drawdown' : '🥈 Lowest Profit'}</div>
              <div style={{ fontSize: '1.4rem', color: '#FFF', fontWeight: 800 }}>{metrics.worstTrade.symbol}</div>
              <div style={{ fontSize: '0.8rem', color: '#9B9A97', marginTop: '4px' }}>{metrics.worstTrade.date || (metrics.worstTrade.entryTime ? metrics.worstTrade.entryTime.split(' ')[0] : '')}</div>
            </div>
            <div style={{ fontSize: '2rem', color: isWorstTradeLoss ? '#FF3333' : '#00FF88', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{formatCurrency(metrics.worstTrade.profitLoss)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily P&L Distribution</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00FF88"/><stop offset="100%" stopColor="#00B35F"/></linearGradient>
                  <linearGradient id="barR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF3333"/><stop offset="100%" stopColor="#B32424"/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 10 }} tickFormatter={(val) => val.split('-')[2]} axisLine={false} tickLine={false} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'url(#barG)' : 'url(#barR)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#6B7280', padding: '100px 20px' }}>No trades logged for {selectedMonth}.</div>
          )}
        </div>

        <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#00FF88', textTransform: 'uppercase', letterSpacing: '1px' }}>💡 Monthly Adjustments</h3>
          <textarea 
            value={lessons} 
            onChange={handleLessonsChange} 
            placeholder="Write your end-of-month reflections here. What system tweaks are needed for next month?" 
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#D1D5DB', padding: '16px', fontSize: '0.9rem', outline: 'none', resize: 'none', lineHeight: '1.6' }} 
          />
        </div>
      </div>

    </motion.div>
  );
};

export default ReviewPage;