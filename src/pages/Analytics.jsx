import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

const Analytics = ({ trades = [] }) => {
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' or 'risk'

  // --- 1. CORE METRICS ---
  const metrics = useMemo(() => {
    const total = trades.length;
    if (total === 0) return { winRate: 0, totalPnL: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, maxDrawdown: 0 };
    
    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss < 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    let cumulative = 0, peak = 0, maxDrawdown = 0;
    
    sortedTrades.forEach(t => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return {
      winRate: ((wins.length / total) * 100).toFixed(1),
      totalPnL: (grossProfit - grossLoss).toFixed(2),
      profitFactor: grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2),
      avgWin: wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : 0,
      avgLoss: losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : 0,
      maxDrawdown: maxDrawdown.toFixed(2)
    };
  }, [trades]);

  // --- 2. CHART DATA CALCULATIONS ---
  const growthData = useMemo(() => {
    let cumulative = 0;
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).map((t, i) => {
      cumulative += t.profitLoss;
      return { trade: `Trade ${i + 1}`, cumulative: parseFloat(cumulative.toFixed(2)), date: t.entryTime };
    });
  }, [trades]);

  const drawdownData = useMemo(() => {
    let cumulative = 0, peak = 0;
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)).map((t, i) => {
      cumulative += t.profitLoss;
      if (cumulative > peak) peak = cumulative;
      let currentDrawdown = peak === 0 ? 0 : cumulative - peak; // Dollar drawdown
      return { trade: `T${i + 1}`, drawdown: parseFloat(currentDrawdown.toFixed(2)) };
    });
  }, [trades]);

  const symbolData = useMemo(() => {
    const acc = {};
    trades.forEach(t => { acc[t.symbol] = (acc[t.symbol] || 0) + t.profitLoss; });
    return Object.keys(acc).map(symbol => ({ symbol, pnl: parseFloat(acc[symbol].toFixed(2)) })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const modelData = useMemo(() => {
    const acc = {};
    trades.forEach(t => { 
      const m = t.model || 'Manual'; 
      acc[m] = (acc[m] || 0) + t.profitLoss; 
    });
    return Object.keys(acc).map(model => ({ model, pnl: parseFloat(acc[model].toFixed(2)) })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const directionData = useMemo(() => {
    const acc = { LONG: 0, SHORT: 0 };
    trades.forEach(t => { if (t.direction) acc[t.direction] += t.profitLoss; });
    return [
      { name: 'LONG', pnl: parseFloat(acc.LONG.toFixed(2)) },
      { name: 'SHORT', pnl: parseFloat(acc.SHORT.toFixed(2)) }
    ];
  }, [trades]);

  const winLossPieData = useMemo(() => {
    const wins = trades.filter(t => t.profitLoss > 0).length;
    const losses = trades.filter(t => t.profitLoss <= 0).length;
    return [{ name: 'Wins', value: wins }, { name: 'Losses', value: losses }];
  }, [trades]);

  // --- STYLES ---
  const COLORS = { green: '#00FF88', red: '#FF3333', darkGreen: '#00B35F', darkRed: '#B32424', bg: '#191919', cardBg: 'rgba(38, 38, 38, 0.6)', border: 'rgba(255, 255, 255, 0.05)', textMuted: '#9B9A97', textBright: '#FFF' };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#191919', border: `1px solid ${COLORS.border}`, padding: '10px 15px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <p style={{ color: COLORS.textMuted, margin: '0 0 5px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || COLORS.textBright, margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {entry.name === 'drawdown' ? '' : '$'}{entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
    return <span>{prefix}{value}{suffix}</span>; // Can be upgraded with framer-motion if desired
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ padding: '10px 0', color: COLORS.textBright, fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER & TOGGLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0' }}>📊 ADVANCED ANALYTICS</h1>
          <p style={{ color: COLORS.textMuted, margin: 0, fontSize: '0.9rem' }}>Deep-dive into your mathematical edge.</p>
        </div>
        
        {/* Sleek Segmented Control */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', border: `1px solid ${COLORS.border}` }}>
          <button 
            onClick={() => setActiveTab('performance')}
            style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'performance' ? 'rgba(0, 255, 136, 0.15)' : 'transparent', color: activeTab === 'performance' ? COLORS.green : COLORS.textMuted }}
          >
            Edge & Performance
          </button>
          <button 
            onClick={() => setActiveTab('risk')}
            style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'risk' ? 'rgba(255, 51, 51, 0.15)' : 'transparent', color: activeTab === 'risk' ? COLORS.red : COLORS.textMuted }}
          >
            Risk & Drawdown
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* =========================================
                  PERFORMANCE TAB
        ========================================= */}
        {activeTab === 'performance' && (
          <motion.div key="perf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            {/* TOP METRICS BENTO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
              {[
                { label: 'Win Rate', val: metrics.winRate, suffix: '%', c: COLORS.green },
                { label: 'Net Profit', val: metrics.totalPnL, prefix: '$', c: metrics.totalPnL >= 0 ? COLORS.green : COLORS.red },
                { label: 'Profit Factor', val: metrics.profitFactor, c: COLORS.green },
                { label: 'Total Trades', val: trades.length, c: '#2D9CDB' }
              ].map((m, i) => (
                <div key={i} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</span>
                  <span style={{ color: m.c, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{m.prefix || ''}{m.val}{m.suffix || ''}</span>
                </div>
              ))}
            </div>

            {/* CHARTS ROW 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
              
              {/* Account Growth Area Chart */}
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Equity Curve</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="trade" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" stroke={COLORS.green} strokeWidth={3} fillOpacity={1} fill="url(#colorPnL)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Win/Loss Donut */}
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: COLORS.textBright }}>Strike Rate</h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={winLossPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        <Cell fill={COLORS.green} />
                        <Cell fill={COLORS.red} />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#191919', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#FFF' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.green }} /> <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>Wins</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.red }} /> <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>Losses</span></div>
                </div>
              </div>

            </div>

            {/* CHARTS ROW 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Playbook Edge Matrix */}
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Playbook Edge Matrix (By Setup)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={modelData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="model" type="category" stroke={COLORS.textBright} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={24}>
                      {modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Asset Performance */}
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Asset Performance</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={symbolData} barSize={40}>
                    <defs>
                      <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.green} /><stop offset="100%" stopColor={COLORS.darkGreen} /></linearGradient>
                      <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.red} /><stop offset="100%" stopColor={COLORS.darkRed} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="symbol" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {symbolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'url(#barGreen)' : 'url(#barRed)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </motion.div>
        )}


        {/* =========================================
                    RISK TAB
        ========================================= */}
        {activeTab === 'risk' && (
          <motion.div key="risk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            {/* TOP RISK METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
              {[
                { label: 'Max Drawdown', val: metrics.maxDrawdown, suffix: '%', c: COLORS.red },
                { label: 'Average Win', val: metrics.avgWin, prefix: '$', c: COLORS.green },
                { label: 'Average Loss', val: metrics.avgLoss, prefix: '$', c: COLORS.red },
                { label: 'Risk/Reward Ratio', val: metrics.avgLoss == 0 ? 0 : Math.abs(metrics.avgWin / metrics.avgLoss).toFixed(2), suffix: 'R', c: '#2D9CDB' }
              ].map((m, i) => (
                <div key={i} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</span>
                  <span style={{ color: m.c, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{m.prefix || ''}{m.val}{m.suffix || ''}</span>
                </div>
              ))}
            </div>

            {/* Drawdown Mountain Chart */}
            <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Drawdown Mountain (Peak-to-Valley Drop)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={drawdownData}>
                  <defs>
                    <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="trade" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} reversed={true} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="drawdown" stroke={COLORS.red} strokeWidth={3} fillOpacity={1} fill="url(#colorDD)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Long vs Short Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Long vs Short Matrix</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={directionData} barSize={50}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {directionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* R:R Scatter Map */}
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: COLORS.textMuted, textAlign: 'center', maxWidth: '80%' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: COLORS.textBright }}>Trade Distribution Warning</h3>
                  <p style={{ lineHeight: '1.6' }}>If your Max Drawdown exceeds 20%, or if your Average Loss is larger than your Average Win, your risk profile is unstable. Ensure your Stop Loss is logged accurately in the Trades DB to unlock Scatter Mapping in the future updates.</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Analytics;