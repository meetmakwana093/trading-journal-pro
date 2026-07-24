import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import ReviewPage from './pages/ReviewPage';
import MilestonesPage from './pages/MilestonesPage';
import Analytics from './pages/Analytics.jsx';
import MissedTradeDB from './pages/MissedTradeDB.jsx';
import TradesDB from './pages/TradeDB.jsx';
import LoginPage from './pages/LoginPage';
import { getUser, getToken, logout } from './auth/authService';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Animated Counter (Unchanged Logic)
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 2 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0; const end = parseFloat(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const duration = 1000; const step = (end - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
        setDisplay(end); clearInterval(timer);
      } else { setDisplay(parseFloat(current.toFixed(decimals))); }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
};

export default function App() {
  // --- 100% UNCHANGED LOGIC BLOCK START ---
  const [activeTab, setActiveTab] = useState('home');
  const [trades, setTrades] = useState([]);
  const [missedTrades, setMissedTrades] = useState([]);
  const [user, setUser] = useState(getUser());

  const formatTradeData = (data) => ({
    id: data.id, symbol: data.symbol,
    entryPrice: parseFloat(data.entryPrice !== undefined ? data.entryPrice : data.entry_price) || 0,
    exitPrice: parseFloat(data.exitPrice !== undefined ? data.exitPrice : data.exit_price) || 0,
    profitLoss: parseFloat(data.profitLoss !== undefined ? data.profitLoss : data.profit_loss) || 0,
    entryTime: data.entryTime || data.entry_time, session: data.session || '', direction: data.direction || '',
    followedPlan: data.followedPlan !== undefined ? data.followedPlan : data.followed_plan,
    rating: data.rating || 5, mistakes: data.mistakes || '', wentRight: data.wentRight || data.went_right || '',
    entryWindow: data.entryWindow || data.entry_window || '', model: data.model || '',
    positiveTags: data.positiveTags || data.positive_tags || [],
    negativeTags: data.negativeTags || data.negative_tags || [], account: data.account || '',
    win: (parseFloat(data.profitLoss !== undefined ? data.profitLoss : data.profit_loss) || 0) > 0
  });

  const formatMissedTradeData = (data) => ({
    id: data.id, symbol: data.symbol,
    missedEntryPrice: parseFloat(data.missedEntryPrice !== undefined ? data.missedEntryPrice : data.missed_entry_price) || 0,
    missedExitPrice: parseFloat(data.missedExitPrice !== undefined ? data.missedExitPrice : data.missed_exit_price) || 0,
    predictedPnl: parseFloat(data.predictedPnl !== undefined ? data.predictedPnl : data.predicted_pnl) || 0,
    date: data.date || data.entry_time, reason: data.reason || ''
  });

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/trades`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrades(data.map(formatTradeData)); })
    fetch(`${API}/missed-trades`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setMissedTrades(data.map(formatMissedTradeData)); })
  }, [user]);

  const handleAddTrade = (newTrade) => {
    fetch(`${API}/trades`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(newTrade) })
      .then(res => res.json()).then(saved => setTrades((prev) => [formatTradeData(saved), ...prev]));
  };
  const handleDeleteTrade = (id) => {
    fetch(`${API}/trades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setTrades((prev) => prev.filter(t => t.id !== id)));
  };
  const handleUpdateTrade = (updatedTrade) => {
    fetch(`${API}/trades/${updatedTrade.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(updatedTrade) })
      .then(res => res.json()).then(saved => setTrades((prev) => prev.map(t => t.id === saved.id ? formatTradeData(saved) : t)));
  };
  const handleAddMissedTrade = (newMissed) => {
    fetch(`${API}/missed-trades`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(newMissed) })
      .then(res => res.json()).then(saved => setMissedTrades((prev) => [formatMissedTradeData(saved), ...prev]));
  };
  const handleDeleteMissedTrade = (id) => {
    fetch(`${API}/missed-trades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setMissedTrades((prev) => prev.filter(t => t.id !== id)));
  };

  const handleLogout = () => { logout(); setUser(null); setTrades([]); setMissedTrades([]); };

  const calculateMetrics = (trades) => {
    const total = trades.length;
    if (total === 0) return { winRate: 0, totalPnL: 0, returns: 0, profitFactor: 0, avgWin: 0, avgLoss: 0 };
    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss < 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));
    return {
      winRate: (wins.length / total) * 100,
      totalPnL: trades.reduce((sum, t) => sum + t.profitLoss, 0),
      profitFactor: grossLoss === 0 ? 0 : grossProfit / grossLoss,
      avgWin: wins.length === 0 ? 0 : grossProfit / wins.length,
      avgLoss: losses.length === 0 ? 0 : grossLoss / losses.length,
    };
  };

  const calculateAccountGrowth = (trades) => {
    let cumulative = 0;
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).map((t, i) => {
      cumulative += t.profitLoss; return { trade: i + 1, cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  };

  const metrics = calculateMetrics(trades);
  // --- UNCHANGED LOGIC BLOCK END ---

  if (!user) return <LoginPage onLogin={setUser} />;

  const tabs = [
    { id: 'home', label: 'Overview', icon: '⊞' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'tradesDb', label: 'Transactions', icon: '📓' },
    { id: 'missedTradesDb', label: 'Missed Trades', icon: '🎯' },
    { id: 'review', label: 'Journal Review', icon: '🔍' },
    { id: 'milestones', label: 'Milestones', icon: '🏆' },
  ];

  return (
    <div className="app-layout">
      <div className="aurora-bg" />

      {/* NEW SIDEBAR COMPONENT */}
      <nav className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00FF88, #0088FF)', borderRadius: '8px' }} />
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>Journal Pro.</h1>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', marginLeft: '16px' }}>Main Menu</div>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}>
              <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* User Profile at bottom */}
        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#8A8F98', marginBottom: '4px' }}>Logged in as</div>
          <div style={{ fontSize: '0.9rem', color: '#00FF88', fontWeight: 600, wordBreak: 'break-all', marginBottom: '12px' }}>{user.email}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'rgba(255,51,102,0.1)', color: '#FF3366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="main-view">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{tabs.find(t => t.id === activeTab)?.label}</h2>
            <p style={{ color: '#8A8F98', fontSize: '0.9rem' }}>Here is the summary of your overall data</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bento-grid">
              
              {/* BENTO CARD 1: Total PnL */}
              <div className="bento-card col-span-4" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,0,0,0))' }}>
                <div className="card-label">Total Net Return</div>
                <div className={`metric-value ${metrics.totalPnL >= 0 ? 'metric-green' : 'metric-red'}`}>
                  <AnimatedNumber value={metrics.totalPnL} prefix="$" />
                </div>
              </div>

              {/* BENTO CARD 2: Win Rate */}
              <div className="bento-card col-span-4">
                <div className="card-label">Overall Win Rate</div>
                <div className="metric-value metric-green">
                  <AnimatedNumber value={metrics.winRate} suffix="%" />
                </div>
              </div>

              {/* BENTO CARD 3: Profit Factor */}
              <div className="bento-card col-span-4">
                <div className="card-label">Profit Factor</div>
                <div className="metric-value text-primary">
                  <AnimatedNumber value={metrics.profitFactor} />
                </div>
              </div>

              {/* BENTO CARD 4: Account Growth Chart (Wide) */}
              <div className="bento-card col-span-8">
                <div className="card-label" style={{ marginBottom: '24px' }}>Portfolio Performance</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={calculateAccountGrowth(trades)}>
                    <defs>
                      <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="trade" stroke="#8A8F98" axisLine={false} tickLine={false} />
                    <YAxis stroke="#8A8F98" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={3} fill="url(#colorPnL)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* BENTO CARD 5: Avg Stats (Tall) */}
              <div className="bento-card col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div className="card-label">Average Win</div>
                  <div className="metric-value metric-green" style={{ fontSize: '2rem' }}>+${metrics.avgWin.toFixed(0)}</div>
                </div>
                <div>
                  <div className="card-label">Average Loss</div>
                  <div className="metric-value metric-red" style={{ fontSize: '2rem' }}>-${metrics.avgLoss.toFixed(0)}</div>
                </div>
                <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div className="card-label">Total Trades Logged</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trades.length}</div>
                </div>
              </div>

            </motion.div>
          ) : (
            /* DYNAMIC TAB RENDERING */
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
              {activeTab === 'analytics' && <Analytics trades={trades} />}
              {activeTab === 'review' && <ReviewPage trades={trades} onUpdateTrade={handleUpdateTrade} />}
              {activeTab === 'milestones' && <MilestonesPage trades={trades} />}
              {activeTab === 'missedTradesDb' && <MissedTradeDB missedTrades={missedTrades} onAddMissedTrade={handleAddMissedTrade} onDeleteMissedTrade={handleDeleteMissedTrade} />}
              {activeTab === 'tradesDb' && <TradesDB trades={trades} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}