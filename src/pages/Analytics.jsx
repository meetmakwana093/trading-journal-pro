import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Analytics = ({ trades = [] }) => {
  const [activeTab, setActiveTab] = useState('performance'); 

  // --- HELPER FUNCTIONS FOR DATES ---
  const getSafeDateStr = (dateInput) => {
    if (!dateInput) return '';
    return dateInput.split('T')[0].split(' ')[0];
  };

  const getMonday = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    const day = d.getDay() || 7; 
    d.setDate(d.getDate() - (day - 1));
    return d.toISOString().split('T')[0];
  };

  // --- DATA GROUPING STRATEGIES ---
  const uniqueDays = useMemo(() => {
    const days = [...new Set(trades.map(t => getSafeDateStr(t.entryTime || t.date)))].filter(Boolean);
    return days.sort().reverse();
  }, [trades]);

  const uniqueWeeks = useMemo(() => {
    const weeks = [...new Set(trades.map(t => getMonday(getSafeDateStr(t.entryTime || t.date))))].filter(Boolean);
    return weeks.sort().reverse();
  }, [trades]);

  const [selectedDay, setSelectedDay] = useState(uniqueDays[0] || '');
  const [selectedWeek, setSelectedWeek] = useState(uniqueWeeks[0] || '');

  useMemo(() => { if (!uniqueDays.includes(selectedDay)) setSelectedDay(uniqueDays[0] || ''); }, [uniqueDays]);
  useMemo(() => { if (!uniqueWeeks.includes(selectedWeek)) setSelectedWeek(uniqueWeeks[0] || ''); }, [uniqueWeeks]);

  // --- CORE METRICS CALCULATION ENGINE ---
  const calcMetrics = (tradeList) => {
    const total = tradeList.length;
    if (total === 0) return { winRate: 0, totalPnL: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, maxDrawdown: 0, wins: 0, losses: 0 };
    
    const wins = tradeList.filter(t => t.profitLoss > 0);
    const losses = tradeList.filter(t => t.profitLoss < 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.profitLoss, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));
    
    const sortedTrades = [...tradeList].sort((a, b) => new Date(a.entryTime || a.date) - new Date(b.entryTime || b.date));
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
      maxDrawdown: maxDrawdown.toFixed(2),
      wins: wins.length,
      losses: losses.length
    };
  };

  const globalMetrics = useMemo(() => calcMetrics(trades), [trades]);
  const dayTrades = useMemo(() => trades.filter(t => getSafeDateStr(t.entryTime || t.date) === selectedDay), [trades, selectedDay]);
  const dayMetrics = useMemo(() => calcMetrics(dayTrades), [dayTrades]);
  
  const weekTrades = useMemo(() => trades.filter(t => getMonday(getSafeDateStr(t.entryTime || t.date)) === selectedWeek), [trades, selectedWeek]);
  const weekMetrics = useMemo(() => calcMetrics(weekTrades), [weekTrades]);

  // --- CHART DATA GENERATORS ---
  const generateGrowthData = (tradeList) => {
    let cumulative = 0;
    return [...tradeList].sort((a, b) => new Date(a.entryTime || a.date) - new Date(b.entryTime || b.date)).map((t, i) => {
      cumulative += t.profitLoss;
      return { trade: `T${i + 1}`, cumulative: parseFloat(cumulative.toFixed(2)), pnl: t.profitLoss };
    });
  };

  // 🟢 FIXED: Bulletproof Date Parsing for the Weekly Bar Chart to prevent "Invalid Date"
  const generateWeeklyBarData = (tradeList) => {
    const days = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    tradeList.forEach(t => {
      const safeStr = getSafeDateStr(t.entryTime || t.date);
      if (!safeStr) return;
      
      const [y, m, d] = safeStr.split('-');
      // By using year, month-1, and day directly, we completely bypass string parsing crashes
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0); 
      
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      if (days[dayName] !== undefined) days[dayName] += t.profitLoss;
    });
    return Object.keys(days).map(day => ({ day, pnl: parseFloat(days[day].toFixed(2)) }));
  };

  const getGradientOffset = (data) => {
    if (data.length === 0) return 0;
    const dataMax = Math.max(...data.map(i => i.cumulative));
    const dataMin = Math.min(...data.map(i => i.cumulative));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };

  const growthData = generateGrowthData(trades);
  const globalOff = getGradientOffset(growthData);
  const dayGrowthData = generateGrowthData(dayTrades);
  const dayOff = getGradientOffset(dayGrowthData);
  const weekBarData = generateWeeklyBarData(weekTrades);

  const symbolData = useMemo(() => {
    const acc = {};
    trades.forEach(t => { acc[t.symbol] = (acc[t.symbol] || 0) + t.profitLoss; });
    return Object.keys(acc).map(symbol => ({ symbol, pnl: parseFloat(acc[symbol].toFixed(2)) })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const modelData = useMemo(() => {
    const acc = {};
    trades.forEach(t => { const m = t.model || 'Manual'; acc[m] = (acc[m] || 0) + t.profitLoss; });
    return Object.keys(acc).map(model => ({ model, pnl: parseFloat(acc[model].toFixed(2)) })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const directionData = useMemo(() => {
    const acc = { LONG: 0, SHORT: 0 };
    trades.forEach(t => { if (t.direction) acc[t.direction] += t.profitLoss; });
    return [{ name: 'LONG', pnl: parseFloat(acc.LONG.toFixed(2)) }, { name: 'SHORT', pnl: parseFloat(acc.SHORT.toFixed(2)) }];
  }, [trades]);

  // --- STYLES & COMPONENTS ---
  const COLORS = { green: '#00FF88', red: '#FF3333', darkGreen: '#00B35F', darkRed: '#B32424', cardBg: 'rgba(38, 38, 38, 0.4)', border: 'rgba(255, 255, 255, 0.05)', textMuted: '#9B9A97', textBright: '#FFF' };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isNegative = val < 0;
      const color = isNegative ? '#FF3333' : '#00FF88';
      return (
        <div style={{ background: 'rgba(10, 14, 23, 0.95)', border: `1px solid ${color}`, padding: '12px 16px', borderRadius: '8px', boxShadow: `0 8px 24px rgba(0,0,0,0.4)` }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 4px 0', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>{label}</p>
          <p style={{ color: color, margin: 0, fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {val >= 0 ? '+' : '-'}${Math.abs(val).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderMetricCards = (metricsObj, tradeCount) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
      {[
        { label: 'Win Rate', val: metricsObj.winRate, suffix: '%', c: COLORS.green },
        { label: 'Net Profit', val: metricsObj.totalPnL, prefix: '$', c: metricsObj.totalPnL >= 0 ? COLORS.green : COLORS.red },
        { label: 'Profit Factor', val: metricsObj.profitFactor, c: COLORS.green },
        { label: 'Total Trades', val: tradeCount, c: '#2D9CDB' }
      ].map((m, i) => (
        <div key={i} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ color: COLORS.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</span>
          <span style={{ color: m.c, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{m.prefix || ''}{m.val}{m.suffix || ''}</span>
        </div>
      ))}
    </div>
  );

  const renderTradeTable = (tradeList) => (
    <div style={{ background: 'rgba(38,38,38,0.5)', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: COLORS.textBright }}>Trade Breakdown</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ color: '#9B9A97', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '10px' }}>Time</th>
              <th style={{ padding: '10px' }}>Symbol</th>
              <th style={{ padding: '10px' }}>Side</th>
              <th style={{ padding: '10px' }}>Entry</th>
              <th style={{ padding: '10px' }}>Exit</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>P&L ($)</th>
            </tr>
          </thead>
          <tbody>
            {tradeList.map((t, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '10px' }}>{t.entryTime ? new Date(t.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : t.date}</td>
                <td style={{ padding: '10px', fontWeight: 700 }}>{t.symbol}</td>
                <td style={{ padding: '10px', color: t.direction === 'LONG' ? COLORS.green : COLORS.red }}>{t.direction}</td>
                <td style={{ padding: '10px' }}>{t.entryPrice || '-'}</td>
                <td style={{ padding: '10px' }}>{t.exitPrice || '-'}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: t.profitLoss >= 0 ? COLORS.green : COLORS.red }}>
                  {t.profitLoss >= 0 ? '+' : ''}${t.profitLoss}
                </td>
              </tr>
            ))}
            {tradeList.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>No trades executed in this timeframe.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ padding: '10px 0', color: COLORS.textBright, fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER & TOGGLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0' }}>📊 ADVANCED ANALYTICS</h1>
          <p style={{ color: COLORS.textMuted, margin: 0, fontSize: '0.9rem' }}>Deep-dive into your mathematical edge.</p>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', border: `1px solid ${COLORS.border}`, overflowX: 'auto' }}>
          {[
            { id: 'performance', label: 'Edge & Performance' },
            { id: 'risk', label: 'Risk & Drawdown' },
            { id: 'day', label: 'Daily Insights' },
            { id: 'week', label: 'Weekly Insights' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap',
                background: activeTab === tab.id ? 'rgba(0, 255, 136, 0.15)' : 'transparent', 
                color: activeTab === tab.id ? COLORS.green : COLORS.textMuted 
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* =========================================
                  PERFORMANCE TAB
        ========================================= */}
        {activeTab === 'performance' && (
          <motion.div key="perf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {renderMetricCards(globalMetrics, trades.length)}

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Global Equity Curve</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="splitColorAnalytic" x1="0" y1="0" x2="0" y2="1"><stop offset={globalOff} stopColor={COLORS.green} stopOpacity={0.4} /><stop offset={globalOff} stopColor={COLORS.red} stopOpacity={0.4} /></linearGradient>
                      <linearGradient id="splitStrokeAnalytic" x1="0" y1="0" x2="0" y2="1"><stop offset={globalOff} stopColor={COLORS.green} stopOpacity={1} /><stop offset={globalOff} stopColor={COLORS.red} stopOpacity={1} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="trade" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" stroke="url(#splitStrokeAnalytic)" strokeWidth={3} fill="url(#splitColorAnalytic)" activeDot={{ r: 6, fill: '#191919', stroke: 'url(#splitStrokeAnalytic)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: COLORS.textBright }}>Strike Rate</h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={[{ name: 'Wins', value: globalMetrics.wins }, { name: 'Losses', value: globalMetrics.losses }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        <Cell fill={COLORS.green} /><Cell fill={COLORS.red} />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Playbook Edge Matrix</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={modelData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="model" type="category" stroke={COLORS.textBright} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={24}>
                      {modelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

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
                      {symbolData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'url(#barGreen)' : 'url(#barRed)'} />)}
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
            {/* Keeping existing Risk tab logic */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
              {[
                { label: 'Max Drawdown', val: globalMetrics.maxDrawdown, suffix: '%', c: COLORS.red },
                { label: 'Average Win', val: globalMetrics.avgWin, prefix: '$', c: COLORS.green },
                { label: 'Average Loss', val: globalMetrics.avgLoss, prefix: '$', c: COLORS.red },
                { label: 'Risk/Reward Ratio', val: globalMetrics.avgLoss == 0 ? 0 : Math.abs(globalMetrics.avgWin / globalMetrics.avgLoss).toFixed(2), suffix: 'R', c: '#2D9CDB' }
              ].map((m, i) => (
                <div key={i} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</span>
                  <span style={{ color: m.c, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{m.prefix || ''}{m.val}{m.suffix || ''}</span>
                </div>
              ))}
            </div>

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
                      {directionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: COLORS.textMuted, textAlign: 'center', maxWidth: '80%' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: COLORS.textBright }}>Trade Distribution Warning</h3>
                  <p style={{ lineHeight: '1.6' }}>If your Max Drawdown exceeds 20%, or if your Average Loss is larger than your Average Win, your risk profile is unstable. Ensure your Stop Loss is logged accurately in the Trades DB to unlock Scatter Mapping in future updates.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================
                    DAY ANALYTICS TAB
        ========================================= */}
        {activeTab === 'day' && (
          <motion.div key="day" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', background: 'rgba(38,38,38,0.5)', padding: '16px', borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontWeight: 700, color: '#9B9A97', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Select Trading Day:</span>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ background: '#191919', color: '#FFF', border: `1px solid ${COLORS.border}`, padding: '8px 16px', borderRadius: '8px', outline: 'none', fontWeight: 700, fontSize: '1rem' }}
              >
                {uniqueDays.length === 0 ? <option value="">No Data</option> : uniqueDays.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</option>)}
              </select>
            </div>

            {renderMetricCards(dayMetrics, dayTrades.length)}

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px' }}>
              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Intraday Equity Curve ({selectedDay})</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dayGrowthData}>
                    <defs>
                      <linearGradient id="splitColorDay" x1="0" y1="0" x2="0" y2="1"><stop offset={dayOff} stopColor={COLORS.green} stopOpacity={0.4} /><stop offset={dayOff} stopColor={COLORS.red} stopOpacity={0.4} /></linearGradient>
                      <linearGradient id="splitStrokeDay" x1="0" y1="0" x2="0" y2="1"><stop offset={dayOff} stopColor={COLORS.green} stopOpacity={1} /><stop offset={dayOff} stopColor={COLORS.red} stopOpacity={1} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="trade" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" stroke="url(#splitStrokeDay)" strokeWidth={3} fill="url(#splitColorDay)" activeDot={{ r: 6, fill: '#191919', stroke: 'url(#splitStrokeDay)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: COLORS.textBright }}>Daily Strike Rate</h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[{ name: 'Wins', value: dayMetrics.wins }, { name: 'Losses', value: dayMetrics.losses }]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                        <Cell fill={COLORS.green} /><Cell fill={COLORS.red} />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#191919', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#FFF' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {renderTradeTable(dayTrades)}

          </motion.div>
        )}

        {/* =========================================
                    WEEK ANALYTICS TAB
        ========================================= */}
        {activeTab === 'week' && (
          <motion.div key="week" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', background: 'rgba(38,38,38,0.5)', padding: '16px', borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontWeight: 700, color: '#9B9A97', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Select Trading Week:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                style={{ background: '#191919', color: '#FFF', border: `1px solid ${COLORS.border}`, padding: '8px 16px', borderRadius: '8px', outline: 'none', fontWeight: 700, fontSize: '1rem' }}
              >
                {uniqueWeeks.length === 0 ? <option value="">No Data</option> : uniqueWeeks.map(w => {
                  const end = new Date(new Date(w + 'T00:00:00').getTime() + 6 * 24 * 60 * 60 * 1000);
                  const label = `${new Date(w).toLocaleDateString('en-US', {month:'short', day:'numeric'})} - ${end.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}`;
                  return <option key={w} value={w}>Week of {label}</option>;
                })}
              </select>
            </div>

            {renderMetricCards(weekMetrics, weekTrades.length)}

            <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: COLORS.textBright }}>Daily Net P&L Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekBarData} barSize={40}>
                  <defs>
                    <linearGradient id="barGreenWeek" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.green} /><stop offset="100%" stopColor={COLORS.darkGreen} /></linearGradient>
                    <linearGradient id="barRedWeek" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.red} /><stop offset="100%" stopColor={COLORS.darkRed} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="day" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    {weekBarData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'url(#barGreenWeek)' : 'url(#barRedWeek)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {renderTradeTable(weekTrades)}

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Analytics;