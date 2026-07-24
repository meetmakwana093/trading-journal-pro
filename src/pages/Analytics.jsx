import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart, Bar, AreaChart, Area, ResponsiveContainer, Cell
} from 'recharts';

const Analytics = ({ trades }) => {
  const [subTab, setSubTab] = useState('calendar');

  // --- LOGIC REMAINS 100% UNCHANGED ---
  const calculateMetrics = (trades) => {
    const total = trades.length;
    if (total === 0) return { winRate: 0, totalPnL: 0, returns: 0, profitFactor: 0, maxDrawdown: 0, avgWin: 0, avgLoss: 0 };
    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const losingTrades = trades.filter(t => t.profitLoss < 0);
    const winRate = (winningTrades.length / total) * 100;
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
    return {
      winRate: parseFloat(winRate.toFixed(2)) || 0, totalPnL: parseFloat(totalPnL.toFixed(2)) || 0,
      returns: parseFloat(returns.toFixed(2)) || 0, profitFactor: parseFloat(profitFactor.toFixed(2)) || 0,
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)) || 0,
      avgWin: winningTrades.length === 0 ? 0 : parseFloat((grossProfit / winningTrades.length).toFixed(2)),
      avgLoss: losingTrades.length === 0 ? 0 : parseFloat((grossLoss / losingTrades.length).toFixed(2)),
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
    let cumulative = 0;
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).map((t, index) => {
      cumulative += t.profitLoss;
      return { trade: index + 1, cumulative: parseFloat(cumulative.toFixed(2)), date: t.entryTime };
    });
  };

  const calculateDrawdownOverTime = (trades) => {
    let cumulative = 0, peak = 0;
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).map((t, index) => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      return { trade: index + 1, drawdown: parseFloat(drawdown.toFixed(2)), date: t.entryTime };
    });
  };

  const calculateBiggestWinnerLoser = (trades) => {
    if (trades.length === 0) return { biggestWinner: 0, biggestLoser: 0 };
    const wins = trades.filter(t => t.profitLoss > 0).map(t => t.profitLoss);
    const losses = trades.filter(t => t.profitLoss < 0).map(t => t.profitLoss);
    return { biggestWinner: wins.length > 0 ? Math.max(...wins) : 0, biggestLoser: losses.length > 0 ? Math.min(...losses) : 0 };
  };

  const calculateRecoveryFactor = (trades) => {
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    let cumulative = 0, peak = 0, maxDrawdown = 0;
    [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).forEach(t => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    if (maxDrawdown === 0 || peak === 0) return 0;
    return parseFloat((totalPnL / (maxDrawdown / 100 * Math.abs(peak))).toFixed(2)) || 0;
  };

  const calculateConsistencyScore = (trades) => {
    if (trades.length === 0) return 0;
    const winRate = trades.filter(t => t.profitLoss > 0).length / trades.length;
    const metrics = calculateMetrics(trades);
    return parseFloat((winRate * 0.6 + Math.min(metrics.profitFactor, 3) / 3 * 0.4) * 100).toFixed(2) || 0;
  };

  const formatCurrency = (number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);

  const metrics = calculateMetrics(trades);
  const symbolData = Object.entries(calculateSymbolPerformance(trades)).map(([symbol, pnl]) => ({ symbol, pnl }));
  const bigWinLoss = calculateBiggestWinnerLoser(trades);
  const recoveryFactor = calculateRecoveryFactor(trades);

  const AnimatedNumber = ({ value, prefix = '', suffix = '', isCurrency = false }) => {
    const [animated, setAnimated] = useState(0);
    useEffect(() => {
      let start = animated; const target = Number(value) || 0; const duration = 1000; const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setAnimated(start + (target - start) * progress);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [value]);
    return <span>{prefix}{isCurrency ? formatCurrency(animated) : animated.toFixed(2)}{suffix}</span>;
  };
  // --- END LOGIC ---

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-grid">
      
      {/* Sleek Segmented Control Tab Bar */}
      <div className="bento-card col-span-12" style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setSubTab('calendar')} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: '0.2s', background: subTab === 'calendar' ? 'rgba(0,255,136,0.15)' : 'transparent', color: subTab === 'calendar' ? '#00FF88' : '#8A8F98' }}>Calendar Analytics</button>
          <button onClick={() => setSubTab('risk')} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: '0.2s', background: subTab === 'risk' ? 'rgba(0,255,136,0.15)' : 'transparent', color: subTab === 'risk' ? '#00FF88' : '#8A8F98' }}>Risk Analysis</button>
        </div>
      </div>

      {subTab === 'calendar' ? (
        <>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Win Rate (%)</div><div className="metric-value metric-green"><AnimatedNumber value={metrics.winRate} suffix="%" /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Total P&L</div><div className={`metric-value ${metrics.totalPnL >= 0 ? 'metric-green' : 'metric-red'}`}><AnimatedNumber value={metrics.totalPnL} isCurrency /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Profit Factor</div><div className="metric-value metric-green"><AnimatedNumber value={metrics.profitFactor} /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Returns</div><div className={`metric-value ${metrics.returns >= 0 ? 'metric-green' : 'metric-red'}`}><AnimatedNumber value={metrics.returns} suffix="%" /></div></div>

          <div className="bento-card col-span-6">
            <div className="card-label" style={{ marginBottom: '20px' }}>Account Growth Over Time</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={calculateAccountGrowth(trades)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="date" stroke="#8A8F98" tickFormatter={(t) => new Date(t).toLocaleDateString()} axisLine={false} tickLine={false}/>
                <YAxis stroke="#8A8F98" axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={3} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bento-card col-span-6">
            <div className="card-label" style={{ marginBottom: '20px' }}>Symbol Performance</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={symbolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="symbol" stroke="#8A8F98" axisLine={false} tickLine={false}/>
                <YAxis stroke="#8A8F98" axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '12px' }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {symbolData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF88' : '#FF3366'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Max Drawdown</div><div className="metric-value metric-red"><AnimatedNumber value={metrics.maxDrawdown} suffix="%" /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Biggest Winner</div><div className="metric-value metric-green"><AnimatedNumber value={bigWinLoss.biggestWinner} isCurrency /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Biggest Loser</div><div className="metric-value metric-red"><AnimatedNumber value={bigWinLoss.biggestLoser} isCurrency /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Recovery Factor</div><div className="metric-value metric-green"><AnimatedNumber value={recoveryFactor} /></div></div>
          
          <div className="bento-card col-span-3 text-center"><div className="card-label">Avg Win</div><div className="metric-value metric-green"><AnimatedNumber value={metrics.avgWin} isCurrency /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Avg Loss</div><div className="metric-value metric-red"><AnimatedNumber value={metrics.avgLoss} isCurrency /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Risk/Reward</div><div className="metric-value metric-green"><AnimatedNumber value={(metrics.avgWin && metrics.avgLoss) ? (metrics.avgWin / Math.abs(metrics.avgLoss)) : 0} /></div></div>
          <div className="bento-card col-span-3 text-center"><div className="card-label">Consistency Score</div><div className="metric-value metric-green"><AnimatedNumber value={calculateConsistencyScore(trades)} suffix="%" /></div></div>

          <div className="bento-card col-span-12">
            <div className="card-label" style={{ marginBottom: '20px' }}>Drawdown Over Time</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={calculateDrawdownOverTime(trades)}>
                <defs><linearGradient id="redArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF3366" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF3366" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="date" stroke="#8A8F98" tickFormatter={(t) => new Date(t).toLocaleDateString()} axisLine={false} tickLine={false}/>
                <YAxis stroke="#8A8F98" axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="drawdown" stroke="#FF3366" strokeWidth={3} fill="url(#redArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Analytics;