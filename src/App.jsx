import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewPage from './pages/ReviewPage';
import MilestonesPage from './pages/MilestonesPage';
import Analytics from './pages/Analytics.jsx';
import MissedTradeDB from './pages/MissedTradeDB.jsx';
import TradesDB from './pages/TradeDB.jsx';
import Playbook from './pages/Playbook.jsx';
import LoginPage from './pages/LoginPage';
import { getUser, getToken, logout } from './auth/authService';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [activeTab, setActiveTab] = useState('home');
  const [trades, setTrades] = useState([]);
  const [missedTrades, setMissedTrades] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [user, setUser] = useState(getUser());

  const formatTradeData = (data) => ({
    id: data.id, symbol: data.symbol,
    entryPrice: parseFloat(data.entryPrice !== undefined ? data.entryPrice : data.entry_price) || 0,
    exitPrice: parseFloat(data.exitPrice !== undefined ? data.exitPrice : data.exit_price) || 0,
    stopLoss: parseFloat(data.stopLoss !== undefined ? data.stopLoss : data.stop_loss) || 0,
    profitLoss: parseFloat(data.profitLoss !== undefined ? data.profitLoss : data.profit_loss) || 0,
    riskReward: parseFloat(data.riskReward !== undefined ? data.riskReward : data.risk_reward) || 0,
    entryTime: data.entryTime || data.entry_time, session: data.session || '', direction: data.direction || '',
    followedPlan: data.followedPlan !== undefined ? data.followedPlan : data.followed_plan,
    rating: data.rating || 5, mistakes: data.mistakes || '', wentRight: data.wentRight || data.went_right || '',
    entryWindow: data.entryWindow || data.entry_window || '', model: data.model || '',
    playbookId: data.playbookId || data.playbook_id || null, chartLink: data.chartLink || data.chart_link || '',
    positiveTags: data.positiveTags || data.positive_tags || [], negativeTags: data.negativeTags || data.negative_tags || [],
    account: data.account || '', win: (parseFloat(data.profitLoss !== undefined ? data.profitLoss : data.profit_loss) || 0) > 0
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
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setTrades(data.map(formatTradeData)); });
    fetch(`${API}/missed-trades`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setMissedTrades(data.map(formatMissedTradeData)); });
    fetch(`${API}/playbooks`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setPlaybooks(data); });
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
  const handleAddPlaybook = (newPb) => {
    fetch(`${API}/playbooks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(newPb) })
      .then(res => res.json()).then(saved => setPlaybooks(prev => [saved, ...prev]));
  };
  const handleDeletePlaybook = (id) => {
    fetch(`${API}/playbooks/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(() => setPlaybooks(prev => prev.filter(p => p.id !== id)));
  };

  const handleLogout = () => { logout(); setUser(null); setTrades([]); setMissedTrades([]); setPlaybooks([]); };

  const calculateMetrics = (trades) => {
    const total = trades.length;
    if (total === 0) return { winRate: 0, totalPnL: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0, avgRR: 0 };
    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss < 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const expectancy = totalPnL / total;
    const avgRR = trades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / total;

    return {
      winRate: (wins.length / total) * 100,
      totalPnL,
      profitFactor: grossLoss === 0 ? 0 : grossProfit / grossLoss,
      avgWin: wins.length === 0 ? 0 : grossProfit / wins.length,
      avgLoss: losses.length === 0 ? 0 : grossLoss / losses.length,
      expectancy: expectancy.toFixed(2),
      avgRR: avgRR.toFixed(2)
    };
  };

  const calculateAccountGrowth = (trades) => {
    let cumulative = 0;
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).map((t, i) => {
      cumulative += t.profitLoss; return { trade: i + 1, cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  };

  const metrics = calculateMetrics(trades);

  if (!user) return <LoginPage onLogin={setUser} />;

  const tabs = [
    { id: 'home', label: 'Overview', icon: '⊞' },
    { id: 'playbook', label: 'Playbook Models', icon: '📘' },
    { id: 'tradesDb', label: 'Transactions', icon: '📓' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'missedTradesDb', label: 'Missed Trades', icon: '🎯' },
    { id: 'review', label: 'Journal Review', icon: '🔍' },
    { id: 'milestones', label: 'Milestones', icon: '🏆' },
  ];

  return (
    <div className="app-layout">
      <div className="aurora-bg" />

      {/* SIDEBAR NAVIGATION */}
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

        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#8A8F98', marginBottom: '4px' }}>Logged in as</div>
          <div style={{ fontSize: '0.9rem', color: '#00FF88', fontWeight: 600, wordBreak: 'break-all', marginBottom: '12px' }}>{user.email}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'rgba(255,51,102,0.1)', color: '#FF3366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </nav>

      {/* MAIN VIEW */}
      <main className="main-view">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{tabs.find(t => t.id === activeTab)?.label}</h2>
            <p style={{ color: '#8A8F98', fontSize: '0.9rem' }}>Real-time execution stats and strategy models</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bento-grid">
              
              <div className="bento-card col-span-3">
                <div className="card-label">Total Net Return</div>
                <div className={`metric-value ${metrics.totalPnL >= 0 ? 'metric-green' : 'metric-red'}`}>
                  <AnimatedNumber value={metrics.totalPnL} prefix="$" />
                </div>
              </div>

              <div className="bento-card col-span-3">
                <div className="card-label">Overall Win Rate</div>
                <div className="metric-value metric-green">
                  <AnimatedNumber value={metrics.winRate} suffix="%" />
                </div>
              </div>

              <div className="bento-card col-span-3">
                <div className="card-label">Trade Expectancy</div>
                <div className={`metric-value ${metrics.expectancy >= 0 ? 'metric-green' : 'metric-red'}`}>
                  ${metrics.expectancy}<span style={{ fontSize: '0.8rem', color: '#8A8F98' }}> / trade</span>
                </div>
              </div>

              <div className="bento-card col-span-3">
                <div className="card-label">Avg R-Multiple</div>
                <div className="metric-value metric-green">
                  {metrics.avgRR}R
                </div>
              </div>

              <div className="bento-card col-span-8">
                <div className="card-label" style={{ marginBottom: '24px' }}>Portfolio Growth Curve</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={calculateAccountGrowth(trades)}>
                    <defs>
                      <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <Line type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={3} />
                    <Area type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={3} fill="url(#colorPnL)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bento-card col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div className="card-label">Average Win</div>
                  <div className="metric-value metric-green" style={{ fontSize: '1.8rem' }}>+${metrics.avgWin.toFixed(0)}</div>
                </div>
                <div>
                  <div className="card-label">Average Loss</div>
                  <div className="metric-value metric-red" style={{ fontSize: '1.8rem' }}>-${metrics.avgLoss.toFixed(0)}</div>
                </div>
                <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div className="card-label">Total Executions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trades.length}</div>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeTab === 'playbook' && <Playbook playbooks={playbooks} trades={trades} onAddPlaybook={handleAddPlaybook} onDeletePlaybook={handleDeletePlaybook} />}
              {activeTab === 'tradesDb' && <TradesDB trades={trades} playbooks={playbooks} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} />}
              {activeTab === 'analytics' && <Analytics trades={trades} />}
              {activeTab === 'missedTradesDb' && <MissedTradeDB missedTrades={missedTrades} onAddMissedTrade={handleAddMissedTrade} onDeleteMissedTrade={handleDeleteMissedTrade} />}
              {activeTab === 'review' && <ReviewPage trades={trades} onUpdateTrade={handleUpdateTrade} />}
              {activeTab === 'milestones' && <MilestonesPage trades={trades} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}