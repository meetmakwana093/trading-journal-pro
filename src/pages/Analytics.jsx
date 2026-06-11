import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart, Bar, AreaChart, Area, ResponsiveContainer, Cell
} from 'recharts';

const Analytics = ({ trades }) => {
  const [subTab, setSubTab] = useState('calendar');

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
      winRate: parseFloat(winRate.toFixed(2)) || 0,
      totalPnL: parseFloat(totalPnL.toFixed(2)) || 0,
      returns: parseFloat(returns.toFixed(2)) || 0,
      profitFactor: parseFloat(profitFactor.toFixed(2)) || 0,
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
      const total = symbolTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      performance[symbol] = parseFloat(total.toFixed(2));
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

  const calculateDrawdownOverTime = (trades) => {
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0, peak = 0;
    return sortedTrades.map((t, index) => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      return { trade: index + 1, drawdown: parseFloat(drawdown.toFixed(2)), date: t.entryTime };
    });
  };

  // FIX: Safely checks for 0 losses or 0 wins so math doesn't return 'Infinity' and crash the tab
  const calculateBiggestWinnerLoser = (trades) => {
    if (trades.length === 0) return { biggestWinner: 0, biggestLoser: 0 };
    const wins = trades.filter(t => t.profitLoss > 0).map(t => t.profitLoss);
    const losses = trades.filter(t => t.profitLoss < 0).map(t => t.profitLoss);
    return { 
      biggestWinner: wins.length > 0 ? Math.max(...wins) : 0, 
      biggestLoser: losses.length > 0 ? Math.min(...losses) : 0 
    };
  };

  const calculateRecoveryFactor = (trades) => {
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0, peak = 0, maxDrawdown = 0;
    sortedTrades.forEach(t => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    if (maxDrawdown === 0 || peak === 0) return 0;
    const recovery = totalPnL / (maxDrawdown / 100 * Math.abs(peak));
    return parseFloat(recovery.toFixed(2)) || 0;
  };

  const calculateConsistencyScore = (trades) => {
    if (trades.length === 0) return 0;
    const winRate = trades.filter(t => t.profitLoss > 0).length / trades.length;
    const metrics = calculateMetrics(trades);
    const profitFactorScore = Math.min(metrics.profitFactor, 3) / 3;
    return parseFloat((winRate * 0.6 + profitFactorScore * 0.4) * 100).toFixed(2) || 0;
  };

  const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number || 0);
  };

  const metrics = calculateMetrics(trades);
  const symbolData = Object.entries(calculateSymbolPerformance(trades)).map(([symbol, pnl]) => ({ symbol, pnl }));
  const bigWinLoss = calculateBiggestWinnerLoser(trades);
  const recoveryFactor = calculateRecoveryFactor(trades);

  // FIX: Safely handles NaN so animations never freeze
  const AnimatedNumber = ({ value, prefix = '', suffix = '', isCurrency = false }) => {
    const [animated, setAnimated] = useState(0);
    useEffect(() => {
      let start = animated;
      const target = Number(value) || 0;
      const duration = 1000;
      const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setAnimated(start + (target - start) * progress);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [value]);

    return (
      <motion.div whileHover={{ scale: 1.05 }} style={{ borderRadius: '8px', padding: '4px 8px', transition: 'all 0.2s' }}>
        {prefix}{isCurrency ? formatCurrency(animated) : animated.toFixed(2)}{suffix}
      </motion.div>
    );
  };

  const containerStyle = { backgroundColor: '#0F0F0F', minHeight: '100vh', padding: '20px', color: 'white' };
  const cardStyle = { backgroundColor: 'rgba(26, 26, 26, 0.8)', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center', border: '1px solid rgba(0, 255, 136, 0.2)' };
  const metricLabelStyle = { fontSize: '14px', opacity: 0.7, marginBottom: '8px', color: '#B0B0B0', textTransform: 'uppercase', fontWeight: 'bold' };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#00FF88' }}>Analytics</h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <motion.div onClick={() => setSubTab('calendar')} style={{ padding: '8px 16px', margin: '0 4px', backgroundColor: subTab === 'calendar' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${subTab === 'calendar' ? '#00FF88' : 'rgba(255,255,255,0.2)'}`, borderRadius: '8px', color: subTab === 'calendar' ? '#00FF88' : 'white', cursor: 'pointer' }}>
          Calendar Analytics
        </motion.div>
        <motion.div onClick={() => setSubTab('risk')} style={{ padding: '8px 16px', margin: '0 4px', backgroundColor: subTab === 'risk' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${subTab === 'risk' ? '#00FF88' : 'rgba(255,255,255,0.2)'}`, borderRadius: '8px', color: subTab === 'risk' ? '#00FF88' : 'white', cursor: 'pointer' }}>
          Risk Analysis
        </motion.div>
      </div>

      {subTab === 'calendar' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div style={cardStyle}><div style={metricLabelStyle}>Win Rate (%)</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.winRate} suffix="%" /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Total P&L ($)</div><div style={{color: metrics.totalPnL >= 0 ? '#00FF88' : '#FF3333', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.totalPnL} isCurrency /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Profit Factor</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.profitFactor} /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Returns (%)</div><div style={{color: metrics.returns >= 0 ? '#00FF88' : '#FF3333', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.returns} suffix="%" /></div></div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#00FF88', marginBottom: '20px' }}>Account Growth Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={calculateAccountGrowth(trades)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                <XAxis dataKey="date" stroke="#B0B0B0" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
                <YAxis stroke="#B0B0B0" />
                <Tooltip contentStyle={{ background: '#262626', border: '1px solid #00FF88', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="cumulative" stroke="#00FF88" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#00FF88', marginBottom: '20px' }}>Symbol Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
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
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div style={cardStyle}><div style={metricLabelStyle}>Max Drawdown</div><div style={{color: '#FF3333', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.maxDrawdown} suffix="%" /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Biggest Winner</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={bigWinLoss.biggestWinner} isCurrency /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Biggest Loser</div><div style={{color: '#FF3333', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={bigWinLoss.biggestLoser} isCurrency /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Recovery Factor</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={recoveryFactor} /></div></div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div style={cardStyle}><div style={metricLabelStyle}>Avg Win</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.avgWin} isCurrency /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Avg Loss</div><div style={{color: '#FF3333', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={metrics.avgLoss} isCurrency /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Risk/Reward Ratio</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={(metrics.avgWin && metrics.avgLoss && metrics.avgLoss !== 0) ? (metrics.avgWin / Math.abs(metrics.avgLoss)) : 0} /></div></div>
            <div style={cardStyle}><div style={metricLabelStyle}>Consistency Score</div><div style={{color: '#00FF88', fontSize: '1.5rem', fontWeight: 'bold'}}><AnimatedNumber value={calculateConsistencyScore(trades)} suffix="%" /></div></div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#00FF88', marginBottom: '20px' }}>Drawdown Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={calculateDrawdownOverTime(trades)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                <XAxis dataKey="date" stroke="#B0B0B0" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
                <YAxis stroke="#B0B0B0" />
                <Tooltip contentStyle={{ background: '#262626', border: '1px solid #FF3333', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="drawdown" stroke="#FF3333" fill="#FF3333" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;