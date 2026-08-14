import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import ReviewPage from './pages/ReviewPage';
import MilestonesPage from './pages/MilestonesPage';
import Analytics from './pages/Analytics.jsx';
import MissedTradeDB from './pages/MissedTradeDB.jsx';
import TradesDB from './pages/TradeDB.jsx';
import Playbook from './pages/Playbook.jsx';
import ChartGallery from './pages/ChartGallery.jsx'; // 🟢 NEW TAB COMPONENT
import LoginPage from './pages/LoginPage';
import { getUser, getToken, saveAuth, logout } from './auth/authService';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Animated number counter
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 2 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const duration = 1000;
    const step = (end - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(parseFloat(current.toFixed(decimals)));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
};

// Magnetic card component
const MagneticCard = ({ children, style, className, ...props }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.08);
    y.set((e.clientY - centerY) * 0.08);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, x: springX, y: springY }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [trades, setTrades] = useState([]);
  const [missedTrades, setMissedTrades] = useState([]);
  const [playbooks, setPlaybooks] = useState([]); 
  const [charts, setCharts] = useState([]); // 🟢 NEW STATE
  const [user, setUser] = useState(getUser());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const parseTags = (tags) => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string' && tags.trim() !== '') return tags.split(',').map(t => t.trim());
    return [];
  };

  const formatTradeData = (data) => ({
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
  });

  const formatMissedTradeData = (data) => ({
    id: data.id,
    symbol: data.symbol,
    missedEntryPrice: parseFloat(data.missedEntryPrice !== undefined ? data.missedEntryPrice : data.missed_entry_price) || 0,
    missedExitPrice: parseFloat(data.missedExitPrice !== undefined ? data.missedExitPrice : data.missed_exit_price) || 0,
    predictedPnl: parseFloat(data.predictedPnl !== undefined ? data.predictedPnl : data.predicted_pnl) || 0,
    date: data.date || data.entry_time,
    reason: data.reason || ''
  });

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/trades`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrades(data.map(formatTradeData)); })
      .catch(err => console.error('Failed to fetch trades:', err));
    fetch(`${API}/missed-trades`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setMissedTrades(data.map(formatMissedTradeData)); })
      .catch(err => console.error('Failed to fetch missed trades:', err));
    
    fetch(`${API}/playbooks`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPlaybooks(data); })
      .catch(err => console.error('Failed to fetch playbooks:', err));

    // 🟢 NEW: Fetch Charts
    fetch(`${API}/charts`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCharts(data); })
      .catch(err => console.error('Failed to fetch charts:', err));
  }, [user]);

  const handleAddTrade = (newTrade) => {
    const safeTrade = { entryPrice: 0, exitPrice: 0, ...newTrade };
    fetch(`${API}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(safeTrade)
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
      .then(saved => { if (!saved || !saved.symbol) return; setTrades((prev) => [formatTradeData(saved), ...prev]); })
      .catch(() => alert("⚠️ Connection Error: Could not reach the database backend."));
  };

  const handleDeleteTrade = (idToDelete) => {
    fetch(`${API}/trades/${idToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setTrades((prev) => prev.filter(trade => trade.id !== idToDelete)))
      .catch(err => console.error('Failed to delete trade:', err));
  };

  const handleUpdateTrade = (updatedTrade) => {
    fetch(`${API}/trades/${updatedTrade.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(updatedTrade)
    })
      .then(res => res.json())
      .then(saved => {
        if (!saved || !saved.symbol) return;
        const mapped = formatTradeData(saved);
        setTrades((prev) => prev.map(trade => trade.id === mapped.id ? mapped : trade));
      })
      .catch(err => console.error('Failed to update trade:', err));
  };

  const handleAddMissedTrade = (newMissedTrade) => {
    fetch(`${API}/missed-trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(newMissedTrade)
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); return res.json(); })
      .then(saved => { if (!saved || !saved.symbol) return; setMissedTrades((prev) => [formatMissedTradeData(saved), ...prev]); })
      .catch(() => alert("⚠️ Connection Error: Could not save missed trade."));
  };

  const handleDeleteMissedTrade = (idToDelete) => {
    fetch(`${API}/missed-trades/${idToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setMissedTrades((prev) => prev.filter(trade => trade.id !== idToDelete)))
      .catch(err => console.error('Failed to delete missed trade:', err));
  };

  const handleAddPlaybook = (newPb) => {
    fetch(`${API}/playbooks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(newPb) })
      .then(res => res.json())
      .then(saved => setPlaybooks(prev => [saved, ...prev]))
      .catch(err => console.error('Failed to save playbook:', err));
  };

  const handleDeletePlaybook = (id) => {
    fetch(`${API}/playbooks/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setPlaybooks(prev => prev.filter(p => p.id !== id)))
      .catch(err => console.error('Failed to delete playbook:', err));
  };

  // 🟢 NEW: Chart Handlers
  const handleAddChart = (newChart) => {
    fetch(`${API}/charts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(newChart) })
      .then(res => res.json())
      .then(saved => setCharts(prev => [saved, ...prev]))
      .catch(err => console.error('Failed to save chart:', err));
  };

  const handleDeleteChart = (id) => {
    fetch(`${API}/charts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setCharts(prev => prev.filter(c => c.id !== id)))
      .catch(err => console.error('Failed to delete chart:', err));
  };

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { logout(); setUser(null); setTrades([]); setMissedTrades([]); setPlaybooks([]); setCharts([]); };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
    else setCalendarMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
    else setCalendarMonth(m => m + 1);
  };

  const tabs = [
    { label: 'HOME', value: 'home', icon: '⚡' },
    { label: 'PLAYBOOK', value: 'playbook', icon: '📘' },
    { label: 'CHART GALLERY', value: 'chartGallery', icon: '🖼️' },
    { label: 'ANALYTICS', value: 'analytics', icon: '📊' },
    { label: 'REVIEW', value: 'review', icon: '📝' },
    { label: 'TRADES DB', value: 'tradesDb', icon: '📗' },
    { label: 'MISSED', value: 'missedTradesDb', icon: '🎯' },
    { label: 'MILESTONES', value: 'milestones', icon: '🏆' },
  ];

  const calculateMetrics = (trades) => {
    const total = trades.length;
    if (total === 0) return { winRate: 0, totalPnL: 0, returns: 0, profitFactor: 0, maxDrawdown: 0, avgWin: 0, avgLoss: 0 };
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
    let cumulative = 0, peak = 0, maxDrawdown = 0;
    sortedTrades.forEach(t => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const avgWin = winning === 0 ? 0 : grossProfit / winning;
    const avgLoss = losing === 0 ? 0 : grossLoss / losing;
    return {
      winRate: parseFloat(winRate.toFixed(2)), totalPnL: parseFloat(totalPnL.toFixed(2)),
      returns: parseFloat(returns.toFixed(2)), profitFactor: parseFloat(profitFactor.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)), avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
    };
  };

  const calculateSymbolPerformance = (trades) => {
    const symbols = [...new Set(trades.map(t => t.symbol))];
    const performance = {};
    symbols.forEach(symbol => {
      const symbolTrades = trades.filter(t => t.symbol === symbol);
      performance[symbol] = parseFloat(symbolTrades.reduce((sum, t) => sum + t.profitLoss, 0).toFixed(2));
    });
    return performance;
  };

  const calculateAccountGrowth = (trades) => {
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0;
    return sortedTrades.map((t, index) => {
      cumulative += t.profitLoss;
      return { trade: index + 1, cumulative: parseFloat(cumulative.toFixed(2)), date: t.entryTime };
    });
  };

  const calculateRecoveryFactor = (trades) => {
    if (trades.length === 0) return 0;
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0, peak = 0, maxDrawdown = 0;
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
    const winRate = trades.filter(t => t.profitLoss > 0).length / trades.length;
    const metrics = calculateMetrics(trades);
    return parseFloat((winRate * 0.6 + Math.min(metrics.profitFactor, 3) / 3 * 0.4) * 100).toFixed(2);
  };

  const formatCurrency = (number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);

  const getCalendarData = (trades) => {
    const grouped = {};
    trades.forEach(t => {
      if (!t.entryTime) return;
      const date = t.entryTime.split('T')[0];
      if (!grouped[date]) grouped[date] = 0;
      grouped[date] += t.profitLoss;
    });
    const calendarData = {};
    for (const [date, pnl] of Object.entries(grouped)) {
      calendarData[date] = { color: pnl > 0 ? 'green' : pnl < 0 ? 'red' : 'darkgray', pnl: parseFloat(pnl.toFixed(2)) };
    }
    return calendarData;
  };

  const calculateDOWPerformance = (trades) => {
    const dow = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 };
    trades.forEach(t => {
      if (t.entryTime) {
        const day = new Date(t.entryTime).toLocaleDateString('en-US', { weekday: 'short' });
        if (dow[day] !== undefined) dow[day] += t.profitLoss;
      }
    });
    return Object.keys(dow).map(day => ({ day, pnl: parseFloat(dow[day].toFixed(2)) }));
  };

  const metrics = calculateMetrics(trades);
  const calendarData = getCalendarData(trades);
  const symbolData = Object.entries(calculateSymbolPerformance(trades)).map(([symbol, pnl]) => ({ symbol, pnl }));
  const dowData = calculateDOWPerformance(trades);
  const currentMonth = calendarMonth;
  const currentYear = calendarYear;
  const currentMonthName = new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const profileData = [
    { subject: 'Win Rate', A: metrics.winRate, fullMark: 100 },
    { subject: 'Plan Adherence', A: trades.length ? (trades.filter(t => t.followedPlan !== false).length / trades.length) * 100 : 0, fullMark: 100 },
    { subject: 'Consistency', A: parseFloat(calculateConsistencyScore(trades)), fullMark: 100 },
    { subject: 'Profit Factor', A: Math.min((metrics.profitFactor / 3) * 100, 100), fullMark: 100 },
    { subject: 'Recovery', A: Math.min((calculateRecoveryFactor(trades) / 3) * 100, 100), fullMark: 100 },
  ];

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const metricCards = [
    { label: 'Win Rate', value: metrics.winRate, suffix: '%', color: '#00FF88', glow: 'rgba(0,255,136,0.4)' },
    { label: 'Total P&L', value: metrics.totalPnL, prefix: '$', color: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333', glow: metrics.totalPnL >= 0 ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,51,0.4)' },
    { label: 'Returns', value: metrics.returns, suffix: '%', color: metrics.returns >= 0 ? '#00FF88' : '#FF3333', glow: 'rgba(0,255,136,0.4)' },
    { label: 'Profit Factor', value: metrics.profitFactor, color: '#00FF88', glow: 'rgba(0,255,136,0.4)' },
  ];

  return (
    <div className="App" style={{ background: '#080B14', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,255,136,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(59,130,246,0.05) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 50% 50%, rgba(139,92,246,0.03) 0%, transparent 70%)'
      }} />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
      }} />

      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(8,11,20,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,255,136,0.08)',
          padding: '0 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          height: '64px',
        }}
      >
        <div
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <svg width="28" height="28" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hboltG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BF8FFF" />
                <stop offset="100%" stopColor="#6A0EDB" />
              </linearGradient>
            </defs>
            <polygon points="62,0 28,55 48,55 18,110 82,50 55,50 72,0" fill="url(#hboltG)" />
          </svg>
          <span style={{
            fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #00FF88 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            Trading Journal Pro
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)',
            borderRadius: '8px', padding: '6px 12px'
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px #00FF88' }} />
            <span style={{ color: '#00FF88', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {user?.email || 'User'}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            style={{
              background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.25)',
              color: '#FF5555', padding: '6px 14px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              transition: 'all 0.2s', fontFamily: 'Inter, sans-serif'
            }}
          >
            Logout
          </motion.button>
        </div>
      </motion.header>

      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(8,11,20,0.6)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 2rem', display: 'flex', gap: '4px'
      }}>
        {tabs.map((tab, i) => (
          <motion.button
            key={tab.value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '14px 18px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.value ? '2px solid #00FF88' : '2px solid transparent',
              color: activeTab === tab.value ? '#00FF88' : 'rgba(255,255,255,0.45)',
              fontWeight: activeTab === tab.value ? 700 : 500,
              cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.06em',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <span style={{ fontSize: '0.75rem' }}>{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: '1.5rem', width: '100%' }}
            >
              <div className="left-column">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <MagneticCard style={{
                    background: 'rgba(13,17,28,0.9)', border: '1px solid rgba(0,255,136,0.12)',
                    borderRadius: '16px', padding: '20px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 15px 0', fontSize: '0.8rem', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Performance Profile
                    </h3>
                    <ResponsiveContainer width="100%" height={230}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={profileData}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Performance" dataKey="A" stroke="#00FF88" fill="#00FF88" fillOpacity={0.15} strokeWidth={2} />
                        <Tooltip contentStyle={{ background: '#0D111C', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', fontSize: '0.8rem' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </MagneticCard>

                  <MagneticCard style={{
                    background: 'rgba(13,17,28,0.9)', border: '1px solid rgba(0,255,136,0.12)',
                    borderRadius: '16px', padding: '20px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 15px 0', fontSize: '0.8rem', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Day of Week
                    </h3>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={dowData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#0D111C', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', fontSize: '0.8rem' }} />
                        <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                          {dowData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF88' : '#FF3333'} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </MagneticCard>
                </motion.div>
              </div>

              <div className="center-column">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <div style={{
                    textAlign: 'center', marginBottom: '24px',
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.04) 0%, rgba(59,130,246,0.03) 100%)',
                    padding: '28px 24px', borderRadius: '20px',
                    border: '1px solid rgba(0,255,136,0.1)',
                    boxShadow: '0 0 60px rgba(0,255,136,0.04), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}>
                    <motion.h1
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px 0',
                        background: 'linear-gradient(135deg, #ffffff 0%, #00FF88 60%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        letterSpacing: '-0.03em', lineHeight: 1.1
                      }}
                    >
                      Trading Dashboard
                    </motion.h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Win Rate', value: `${metrics.winRate}%`, color: '#00FF88' },
                        { label: 'Total P&L', value: `$${metrics.totalPnL}`, color: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333' },
                        { label: 'Profit Factor', value: metrics.profitFactor, color: '#00FF88' },
                      ].map((stat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{stat.label}</span>
                          <span style={{ color: stat.color, fontWeight: 700, fontSize: '0.95rem', fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {metricCards.map((card, i) => (
                      <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        whileHover={{ y: -4, boxShadow: `0 12px 40px ${card.glow}` }}
                        style={{
                          background: 'rgba(13,17,28,0.95)', border: `1px solid rgba(255,255,255,0.07)`,
                          borderRadius: '16px', padding: '20px 16px', textAlign: 'center',
                          cursor: 'pointer', transition: 'all 0.3s',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
                        }}
                      >
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {card.label}
                        </div>
                        <div style={{ color: card.color, fontSize: '2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
                          <AnimatedNumber value={card.value} prefix={card.prefix || ''} suffix={card.suffix || ''} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    {[
                      { title: 'Account Growth', chart: 'line' },
                      { title: 'Symbol Performance', chart: 'bar' }
                    ].map((item, i) => (
                      <MagneticCard
                        key={item.title}
                        style={{
                          background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '16px', padding: '20px',
                          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
                        }}
                      >
                        <h3 style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 14px 0', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {item.title}
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                          {item.chart === 'line' ? (
                            <LineChart data={calculateAccountGrowth(trades)}>
                              <defs>
                                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="trade" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                              <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={{ background: '#0D111C', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', fontSize: '0.8rem' }} />
                              <Line type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={2.5} dot={false} />
                            </LineChart>
                          ) : (
                            <BarChart data={symbolData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="symbol" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                              <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={{ background: '#0D111C', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', fontSize: '0.8rem' }} />
                              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                                {symbolData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF88' : '#FF3333'} fillOpacity={0.85} />
                                ))}
                              </Bar>
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </MagneticCard>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px', padding: '20px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <motion.button
                        whileHover={{ scale: 1.1, background: 'rgba(0,255,136,0.15)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePrevMonth}
                        style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                      >←</motion.button>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {currentMonthName} {currentYear}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1, background: 'rgba(0,255,136,0.15)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNextMonth}
                        style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                      >→</motion.button>
                    </div>
                    <div className="calendar-header" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <div key={index} style={{ textAlign: 'center', textTransform: 'uppercase' }}>{day}</div>
                      ))}
                    </div>
                    <div className="calendar-days">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day" style={{ visibility: 'hidden' }} />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const monthStr = (currentMonth + 1).toString().padStart(2, '0');
                        const dayStr = day.toString().padStart(2, '0');
                        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
                        const data = calendarData[dateStr];
                        const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth, day).getDay());
                        const dayClass = data ? (data.pnl > 0 ? 'positive' : data.pnl < 0 ? 'negative' : 'neutral') : isWeekend ? 'weekend' : '';
                        return (
                          <motion.div
                            key={dateStr}
                            whileHover={{ scale: 1.08, boxShadow: data ? (data.pnl > 0 ? '0 0 12px rgba(0,255,136,0.4)' : '0 0 12px rgba(255,51,51,0.4)') : 'none' }}
                            className={`calendar-day ${dayClass}`}
                            style={{ transition: 'all 0.2s', borderRadius: '8px' }}
                          >
                            <div className="calendar-day-number" style={{ fontSize: '0.8rem' }}>{day}</div>
                            {data && <div className="calendar-day-pnl" style={{ fontSize: '0.6rem' }}>{formatCurrency(data.pnl)}</div>}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              <div className="right-column">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div style={{
                    background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(0,255,136,0.15)',
                    borderRadius: '16px', padding: '24px', textAlign: 'center',
                    boxShadow: '0 0 30px rgba(0,255,136,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Win Rate</div>
                    <div style={{
                      fontSize: '3rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
                      color: metrics.winRate >= 50 ? '#00FF88' : '#FF3333',
                      textShadow: metrics.winRate >= 50 ? '0 0 30px rgba(0,255,136,0.4)' : '0 0 30px rgba(255,51,51,0.4)'
                    }}>
                      <AnimatedNumber value={metrics.winRate} suffix="%" />
                    </div>
                    <div style={{ marginTop: '12px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metrics.winRate}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ height: '100%', borderRadius: '2px', background: metrics.winRate >= 50 ? 'linear-gradient(90deg, #00FF88, #00CC6A)' : 'linear-gradient(90deg, #FF3333, #CC0000)' }}
                      />
                    </div>
                  </div>

                  {[
                    { title: 'Avg Win', value: formatCurrency(metrics.avgWin), color: '#00FF88', bg: 'rgba(0,255,136,0.04)' },
                    { title: 'Avg Loss', value: formatCurrency(metrics.avgLoss), color: '#FF3333', bg: 'rgba(255,51,51,0.04)' },
                    { title: 'Max Drawdown', value: `${metrics.maxDrawdown}%`, color: '#FF3333', bg: 'rgba(255,51,51,0.04)' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.title}
                      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                      style={{
                        background: card.bg, border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '18px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {card.title}
                      </div>
                      <div style={{ color: card.color, fontSize: '1.6rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                        {card.value}
                      </div>
                    </motion.div>
                  ))}

                  <motion.div
                    whileHover={{ y: -2 }}
                    style={{
                      background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)',
                      borderRadius: '14px', padding: '18px', textAlign: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Total Trades
                    </div>
                    <div style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      {trades.length}
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, width: '100%', maxWidth: '100%' }}
            >
              {activeTab === 'playbook' ? (
                <Playbook playbooks={playbooks} trades={trades} onAddPlaybook={handleAddPlaybook} onDeletePlaybook={handleDeletePlaybook} />
              ) : activeTab === 'chartGallery' ? (
                <ChartGallery charts={charts} onAddChart={handleAddChart} onDeleteChart={handleDeleteChart} />
              ) : activeTab === 'analytics' ? (
                <Analytics trades={trades} />
              ) : activeTab === 'review' ? (
                <ReviewPage trades={trades} onUpdateTrade={handleUpdateTrade} />
              ) : activeTab === 'milestones' ? (
                <MilestonesPage trades={trades} />
              ) : activeTab === 'missedTradesDb' ? (
                <MissedTradeDB missedTrades={missedTrades} onAddMissedTrade={handleAddMissedTrade} onDeleteMissedTrade={handleDeleteMissedTrade} />
              ) : activeTab === 'tradesDb' ? (
                <TradesDB trades={trades} playbooks={playbooks} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} onUpdateTrade={handleUpdateTrade} />
              ) : (
                <div className="tab-content">Content for {activeTab}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}