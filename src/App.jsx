import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import ReviewPage from './pages/ReviewPage';
import MilestonesPage from './pages/MilestonesPage';
import Analytics from './pages/Analytics.jsx';
import MissedTradeDB from './pages/MissedTradeDB.jsx';
import TradesDB from './pages/TradeDB.jsx';
import './App.css';
 
const API = 'https://trading-journal-pro-e732.onrender.com/api';
 
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
 
  // CALENDAR NAVIGATION STATE
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
 
  // 1. THIS IS THE BRAIN: Load trades from PostgreSQL backend
  const [trades, setTrades] = useState([]);
 
  const parseTags = (tags) => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string' && tags.trim() !== '') return tags.split(',').map(t => t.trim());
    return [];
  };
 
  const formatTradeData = (data) => {
    return {
      id: data.id,
      symbol: data.symbol,
      entryPrice: parseFloat(data.entryPrice !== undefined ? data.entryPrice : data.entry_price) || 0,
      exitPrice: parseFloat(data.exitPrice !== undefined ? data.exitPrice : data.exit_price) || 0,
      profitLoss: parseFloat(data.profitLoss !== undefined ? data.profitLoss : data.profit_loss) || 0,
      entryTime: data.entryTime || data.entry_time,
      session: data.session || '',
      direction: data.direction || '',
      followedPlan: data.followedPlan !== undefined ? data.followedPlan : data.followed_plan,
      rating: data.rating || 5,
      mistakes: data.mistakes || '',
      wentRight: data.wentRight || data.went_right || '',
      entryWindow: data.entryWindow || data.entry_window || '',
      model: data.model || '',
      positiveTags: parseTags(data.positiveTags || data.positive_tags),
      negativeTags: parseTags(data.negativeTags || data.negative_tags),
      account: data.account || '',
      be: data.be || false,
      win: (parseFloat(data.profitLoss !== undefined ? data.profitLoss : data.profit_loss) || 0) > 0
    };
  };
 
  // 2. Fetch trades from backend on app load
  useEffect(() => {
    fetch(`${API}/trades`)
      .then(res => res.json())
      .then(data => {
        setTrades(data.map(formatTradeData));
      })
      .catch(err => console.error('Failed to fetch trades:', err));
  }, []);
 
  // 3. Functions to modify the brain's data
  const handleAddTrade = (newTrade) => {
    fetch(`${API}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrade),
    })
      .then(res => res.json())
      .then(saved => {
        setTrades((prevTrades) => [formatTradeData(saved), ...prevTrades]);
      })
      .catch(err => console.error('Failed to add trade:', err));
  };
 
  const handleDeleteTrade = (idToDelete) => {
    fetch(`${API}/trades/${idToDelete}`, { method: 'DELETE' })
      .then(() => {
        setTrades((prevTrades) => prevTrades.filter(trade => trade.id !== idToDelete));
      })
      .catch(err => console.error('Failed to delete trade:', err));
  };
 
  const handleUpdateTrade = (updatedTrade) => {
    fetch(`${API}/trades/${updatedTrade.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTrade),
    })
      .then(res => res.json())
      .then(saved => {
        const mapped = formatTradeData(saved);
        setTrades((prevTrades) => prevTrades.map(trade => trade.id === mapped.id ? mapped : trade));
      })
      .catch(err => console.error('Failed to update trade:', err));
  };
 
  // CALENDAR NAVIGATION HANDLERS
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };
 
  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };
 
  const tabs = [
    { label: 'HOME', value: 'home' },
    { label: 'ANALYTICS', value: 'analytics' },
    { label: 'REVIEW', value: 'review' },
    { label: 'TRADES DB', value: 'tradesDb' },
    { label: 'MISSED TRADES DB', value: 'missedTradesDb' },
    { label: 'MILESTONES', value: 'milestones' },
  ];
 
  const calculateMetrics = (trades) => {
    const total = trades.length;
    if (total === 0) {
      return { winRate: 0, totalPnL: 0, returns: 0, profitFactor: 0, maxDrawdown: 0, avgWin: 0, avgLoss: 0 };
    }
 
    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const losingTrades = trades.filter(t => t.profitLoss < 0);
    const winning = winningTrades.length;
    const losing = losingTrades.length;
    const winRate = (winning / total) * 100;
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const returns = (totalPnL / 10000) * 100;
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    const profitFactor = grossLoss === 0 ? 0 : grossProfit / grossLoss;
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    sortedTrades.forEach(t => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const avgWin = winning === 0 ? 0 : grossProfit / winning;
    const avgLoss = losing === 0 ? 0 : grossLoss / losing;
    return {
      winRate: parseFloat(winRate.toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      returns: parseFloat(returns.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
    };
  };
 
  const calculateSymbolPerformance = (trades) => {
    const symbols = [...new Set(trades.map(t => t.symbol))]; 
    const performance = {};
    symbols.forEach(symbol => {
      const symbolTrades = trades.filter(t => t.symbol === symbol);
      const total = symbolTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      performance[symbol] = parseFloat(total.toFixed(2));
    });
    return performance;
  };
 
  const calculateAccountGrowth = (trades) => {
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0;
    const growth = [];
    sortedTrades.forEach((t, index) => {
      cumulative += t.profitLoss;
      growth.push({
        trade: index + 1,
        cumulative: parseFloat(cumulative.toFixed(2)),
        date: t.entryTime
      });
    });
    return growth;
  };
 
  const calculateRecoveryFactor = (trades) => {
    if (trades.length === 0) return 0;
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    sortedTrades.forEach(t => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    return maxDrawdown === 0 ? 0 : totalPnL / (maxDrawdown / 100 * Math.abs(peak));
  };
 
  const calculateConsistencyScore = (trades) => {
    if (trades.length === 0) return 0;
    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const winRate = winningTrades.length / trades.length;
    const metrics = calculateMetrics(trades);
    const profitFactorScore = Math.min(metrics.profitFactor, 3) / 3;
    return parseFloat((winRate * 0.6 + profitFactorScore * 0.4) * 100).toFixed(2);
  };
 
  const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };
 
  const getCalendarData = (trades) => {
    const grouped = {};
    trades.forEach(t => {
      if(!t.entryTime) return;
      const date = t.entryTime.split('T')[0];
      if (!grouped[date]) grouped[date] = 0;
      grouped[date] += t.profitLoss;
    });
    const calendarData = {};
    for (const [date, pnl] of Object.entries(grouped)) {
      let color = 'darkgray';
      if (pnl > 0) color = 'green';
      else if (pnl < 0) color = 'red';
      calendarData[date] = { color, pnl: parseFloat(pnl.toFixed(2)) };
    }
    return calendarData;
  };
 
  const calculateDOWPerformance = (trades) => {
    const dow = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 };
    trades.forEach(t => {
      if(t.entryTime) {
        const d = new Date(t.entryTime);
        const day = d.toLocaleDateString('en-US', {weekday: 'short'});
        if(dow[day] !== undefined) dow[day] += t.profitLoss;
      }
    });
    return Object.keys(dow).map(day => ({ day, pnl: parseFloat(dow[day].toFixed(2)) }));
  };
 
  const metrics = calculateMetrics(trades);
  const calendarData = getCalendarData(trades);
  const symbolData = Object.entries(calculateSymbolPerformance(trades)).map(([symbol, pnl]) => ({ symbol, pnl }));
  const dowData = calculateDOWPerformance(trades);
 
  // CALENDAR VARS - NOW DYNAMIC BASED ON STATE
  const currentMonth = calendarMonth;
  const currentYear = calendarYear;
  const currentMonthName = new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
 
  const profileData = [
    { subject: 'Win Rate', A: metrics.winRate, fullMark: 100 },
    { subject: 'Plan Adherence', A: trades.length ? (trades.filter(t => t.followedPlan !== false).length / trades.length) * 100 : 0, fullMark: 100 },
    { subject: 'Consistency Score', A: parseFloat(calculateConsistencyScore(trades)), fullMark: 100 },
    { subject: 'Profit Factor', A: Math.min((metrics.profitFactor / 3) * 100, 100), fullMark: 100 },
    { subject: 'Recovery Factor', A: Math.min((calculateRecoveryFactor(trades) / 3) * 100, 100), fullMark: 100 },
  ];
 
  return (
    <div className="App">
      <header className="header">
        <div className="logo" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon"></div>
          <h1>Trading Journal Pro</h1>
        </div>
      </header>
 
      <div className="tabs-container">
        {tabs.map(tab => (
          <button key={tab.value} className={`tab-btn ${activeTab === tab.value ? 'active' : ''}`} onClick={() => setActiveTab(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>
 
      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        
        {activeTab === 'home' ? (
          <>
            {/* Left Column (25%) */}
            <div className="left-column">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <motion.div whileHover={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: '#00FF88', margin: '0 0 15px 0', fontSize: '1.1rem', textAlign: 'center' }}>🎯 Performance Profile</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={profileData}>
                      <PolarGrid stroke="#3A3A3A" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#B0B0B0', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Performance" dataKey="A" stroke="#00FF88" fill="#00FF88" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ background: '#262626', border: '1px solid #00FF88', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
 
                <motion.div whileHover={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: '#00FF88', margin: '0 0 15px 0', fontSize: '1.1rem', textAlign: 'center' }}>📅 Daily Performance</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" vertical={false} />
                      <XAxis dataKey="day" stroke="#B0B0B0" />
                      <YAxis stroke="#B0B0B0" />
                      <Tooltip contentStyle={{ background: '#262626', border: '1px solid #00FF88', borderRadius: '8px' }} />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {dowData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF88' : '#FF3333'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            </div>
    
            {/* Center Column (50%) */}
            <div className="center-column">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '30px', background: 'rgba(0, 255, 136, 0.05)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                <h1 style={{ fontSize: '2.5rem', color: '#00FF88', margin: '0 0 10px 0', fontWeight: 'bold' }}>Trading Dashboard</h1>
                <p style={{ color: '#B0B0B0', margin: '10px 0 20px 0', fontSize: '1rem' }}>
                  <span style={{ color: '#00FF88', fontWeight: 'bold' }}>Win Rate: {metrics.winRate}%</span>
                  <span style={{ margin: '0 20px', color: '#666' }}>•</span>
                  <span style={{ color: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333', fontWeight: 'bold' }}>Total P&L: ${metrics.totalPnL}</span>
                  <span style={{ margin: '0 20px', color: '#666' }}>•</span>
                  <span style={{ color: '#00FF88', fontWeight: 'bold' }}>Profit Factor: {metrics.profitFactor}</span>
                </p>
              </motion.div>
    
              <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}>
                <motion.div whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(0, 255, 136, 0.6)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                  <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '10px' }}>Win Rate</div>
                  <div style={{ color: '#00FF88', fontSize: '2.5rem', fontWeight: 'bold' }}>{metrics.winRate}%</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.08, boxShadow: metrics.totalPnL >= 0 ? '0 0 25px rgba(0, 255, 136, 0.6)' : '0 0 25px rgba(255, 51, 51, 0.6)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: metrics.totalPnL >= 0 ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 51, 51, 0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                  <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '10px' }}>Total P&L</div>
                  <div style={{ color: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333', fontSize: '2.5rem', fontWeight: 'bold' }}>${metrics.totalPnL}</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(0, 255, 136, 0.6)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                  <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '10px' }}>Returns</div>
                  <div style={{ color: metrics.returns >= 0 ? '#00FF88' : '#FF3333', fontSize: '2.5rem', fontWeight: 'bold' }}>{metrics.returns}%</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.08, boxShadow: '0 0 25px rgba(0, 255, 136, 0.6)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                  <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginBottom: '10px' }}>Profit Factor</div>
                  <div style={{ color: '#00FF88', fontSize: '2.5rem', fontWeight: 'bold' }}>{metrics.profitFactor}</div>
                </motion.div>
              </motion.div>
    
              <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div whileHover={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: '#00FF88', margin: '0 0 15px 0', fontSize: '1.1rem' }}>📈 Account Growth</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={calculateAccountGrowth(trades)}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00FF88" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#00FF88" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                      <XAxis dataKey="trade" stroke="#B0B0B0" />
                      <YAxis stroke="#B0B0B0" />
                      <Tooltip contentStyle={{ background: '#262626', border: '1px solid #00FF88', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={3} isAnimationActive={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
    
                <motion.div whileHover={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)' }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: '#00FF88', margin: '0 0 15px 0', fontSize: '1.1rem' }}>📊 Symbol Performance</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={symbolData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                      <XAxis dataKey="symbol" stroke="#B0B0B0" />
                      <YAxis stroke="#B0B0B0" />
                      <Tooltip contentStyle={{ background: '#262626', border: '1px solid #00FF88', borderRadius: '8px' }} />
                      <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                        {symbolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF88' : '#FF3333'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
    
              {/* CALENDAR - NOW WITH NAVIGATION */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '20px' }}>
                
                {/* CALENDAR HEADER WITH PREV/NEXT BUTTONS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <button
                    onClick={handlePrevMonth}
                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.target.style.background = 'rgba(0,255,136,0.25)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(0,255,136,0.1)'}
                  >←</button>
 
                  <h3 style={{ color: '#00FF88', margin: 0, fontSize: '1.1rem' }}>
                    📅 {currentMonthName} {currentYear}
                  </h3>
 
                  <button
                    onClick={handleNextMonth}
                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.target.style.background = 'rgba(0,255,136,0.25)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(0,255,136,0.1)'}
                  >→</button>
                </div>
 
                <div className="calendar-header">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={index}>{day}</div>
                  ))}
                </div>
                <div className="calendar-days">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day" style={{ visibility: 'hidden' }}></div>
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
                    const dayStr = day.toString().padStart(2, '0');
                    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
                    
                    const data = calendarData[dateStr];
                    const isWeekend = new Date(currentYear, currentMonth, day).getDay() === 0 || new Date(currentYear, currentMonth, day).getDay() === 6;
                    const dayClass = data ? (data.pnl > 0 ? 'positive' : data.pnl < 0 ? 'negative' : 'neutral') : isWeekend ? 'weekend' : '';
                    
                    return (
                      <motion.div key={dateStr} whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(0, 255, 136, 0.5)' }} className={`calendar-day ${dayClass}`} style={{ transition: 'all 0.3s' }}>
                        <div className="calendar-day-number">{day}</div>
                        {data && <div className="calendar-day-pnl">{formatCurrency(data.pnl)}</div>}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
    
            {/* Right Column (25%) */}
            <div className="right-column">
              <div className="section-title">Win Rate</div>
              <div className="info-card">
                <div className={`info-card-value ${metrics.winRate >= 50 ? 'positive' : 'negative'}`}>
                  {metrics.winRate}%
                </div>
              </div>
    
              <div className="section-title">Info Cards</div>
              <div className="info-cards">
                <div className="info-card">
                  <div className="info-card-title">Avg Win</div>
                  <div className={`info-card-value positive`}>
                    {formatCurrency(metrics.avgWin)}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-card-title">Avg Loss</div>
                  <div className={`info-card-value negative`} style={{color: '#FF3333'}}>
                    {formatCurrency(metrics.avgLoss)}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-card-title">Max Drawdown</div>
                  <div className="info-card-value" style={{color: '#FF3333'}}>{metrics.maxDrawdown}%</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
            {activeTab === 'analytics' ? (
              <Analytics trades={trades} />
            ) : activeTab === 'review' ? (
              <ReviewPage trades={trades} onUpdateTrade={handleUpdateTrade} />
            ) : activeTab === 'milestones' ? (
              <MilestonesPage trades={trades} />
            ) : activeTab === 'missedTradesDb' ? (
              <MissedTradeDB trades={trades} />
            ) : activeTab === 'tradesDb' ? (
              <TradesDB trades={trades} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} />
            ) : (
              <div className="tab-content">Content for {activeTab}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}