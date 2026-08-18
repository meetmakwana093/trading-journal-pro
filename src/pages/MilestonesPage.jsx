import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BADGES = [
  { id: 'first-trade', label: 'First Trade Ever', icon: '🏁', description: 'Executed your first logged trade.' },
  { id: 'first-profit', label: 'First Profitable Trade', icon: '💰', description: 'Closed a trade in the green.' },
  { id: 'first-loss', label: 'First Loss (Learning)', icon: '📉', description: 'Took a loss and logged it properly.' },
  { id: 'win-streak-5', label: 'Win Streak (5)', icon: '🔥', description: '5 consecutive winning trades.' },
  { id: 'win-streak-10', label: 'Win Streak (10)', icon: '🔥', description: '10 consecutive winning trades.' },
  { id: 'win-streak-20', label: 'Win Streak (20)', icon: '🔥', description: '20 consecutive winning trades.' },
  { id: 'profit-100', label: 'Profit Milestone ($100)', icon: '💵', description: 'Reached $100 in total net profit.' },
  { id: 'profit-500', label: 'Profit Milestone ($500)', icon: '💵', description: 'Reached $500 in total net profit.' },
  { id: 'profit-1k', label: 'Profit Milestone ($1K)', icon: '💸', description: 'Reached $1,000 in total net profit.' },
  { id: 'profit-5k', label: 'Profit Milestone ($5K)', icon: '🏦', description: 'Reached $5,000 in total net profit.' },
  { id: 'days-streak-7', label: 'Trading Days Streak (7)', icon: '📅', description: 'Traded 7 consecutive active days.' },
  { id: 'days-streak-30', label: 'Trading Days Streak (30)', icon: '📅', description: 'Traded 30 consecutive active days.' },
  { id: 'days-streak-100', label: 'Trading Days Streak (100)', icon: '📆', description: 'Traded 100 consecutive active days.' },
  { id: 'monthly-goal', label: 'Monthly Goal Reached', icon: '🎯', description: 'Hit your defined monthly profit target.' },
  { id: 'consistency-50', label: 'Consistency Score (50%)', icon: '📊', description: 'Maintained a 50% consistency metric.' },
  { id: 'consistency-60', label: 'Consistency Score (60%)', icon: '📊', description: 'Maintained a 60% consistency metric.' },
  { id: 'consistency-70', label: 'Consistency Score (70%)', icon: '📈', description: 'Elite 70% consistency metric reached.' }
];

const MilestonesPage = ({ trades = [] }) => {

  // --- SAFE DATE HELPERS ---
  const getSafeDateStr = (dateInput) => {
    if (!dateInput) return '';
    return dateInput.split('T')[0].split(' ')[0];
  };

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.entryTime || a.date) - new Date(b.entryTime || b.date));
  }, [trades]);

  // --- CORE LOGIC ---
  const calculateWinStreaks = (tradeList) => {
    let maxStreak = 0;
    let currentStreak = 0;
    const dates = {};

    tradeList.forEach((trade) => {
      if (trade.profitLoss > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          [5, 10, 20].forEach(milestone => {
            if (currentStreak === milestone && !dates[milestone]) {
              dates[milestone] = getSafeDateStr(trade.entryTime || trade.date);
            }
          });
        }
      } else {
        currentStreak = 0;
      }
    });
    return { maxStreak, dates };
  };

  const calculateProfitMilestones = (tradeList) => {
    const milestones = [100, 500, 1000, 5000];
    const achieved = {};
    const dates = {};
    let cumulative = 0;

    milestones.forEach(m => { achieved[m] = false; });

    tradeList.forEach(trade => {
      cumulative += trade.profitLoss;
      milestones.forEach(milestone => {
        if (cumulative >= milestone && !achieved[milestone]) {
          achieved[milestone] = true;
          dates[milestone] = getSafeDateStr(trade.entryTime || trade.date);
        }
      });
    });
    return { achieved, dates };
  };

  const calculateTradingDaysStreak = (tradeList) => {
    const daysMap = {};
    tradeList.forEach(trade => {
      const day = getSafeDateStr(trade.entryTime || trade.date);
      if(day) {
        if (!daysMap[day]) daysMap[day] = [];
        daysMap[day].push(trade);
      }
    });

    const sortedDays = Object.keys(daysMap).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    const dates = {};

    sortedDays.forEach((day, index) => {
      if (index > 0) {
        const prevDay = new Date(sortedDays[index - 1]);
        const currDay = new Date(day);
        const diffTime = Math.abs(currDay - prevDay);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        [7, 30, 100].forEach(milestone => {
          if (currentStreak === milestone && !dates[milestone]) {
            dates[milestone] = day;
          }
        });
      }
    });
    return { maxStreak, dates };
  };

  const calculateAchievements = (tradeList) => {
    const achievements = {};

    BADGES.forEach(badge => {
      achievements[badge.id] = { achieved: false, date: null, ...badge };
    });

    if (tradeList.length === 0) return achievements;

    // First trade
    achievements['first-trade'].achieved = true;
    achievements['first-trade'].date = getSafeDateStr(tradeList[0].entryTime || tradeList[0].date);

    // First profitable trade
    const firstProfitable = tradeList.find(t => t.profitLoss > 0);
    if (firstProfitable) {
      achievements['first-profit'].achieved = true;
      achievements['first-profit'].date = getSafeDateStr(firstProfitable.entryTime || firstProfitable.date);
    }

    // First loss
    const firstLoss = tradeList.find(t => t.profitLoss < 0);
    if (firstLoss) {
      achievements['first-loss'].achieved = true;
      achievements['first-loss'].date = getSafeDateStr(firstLoss.entryTime || firstLoss.date);
    }

    // Streaks
    const winStreaks = calculateWinStreaks(tradeList);
    if (winStreaks.maxStreak >= 5) { achievements['win-streak-5'].achieved = true; achievements['win-streak-5'].date = winStreaks.dates[5]; }
    if (winStreaks.maxStreak >= 10) { achievements['win-streak-10'].achieved = true; achievements['win-streak-10'].date = winStreaks.dates[10]; }
    if (winStreaks.maxStreak >= 20) { achievements['win-streak-20'].achieved = true; achievements['win-streak-20'].date = winStreaks.dates[20]; }

    // Profits
    const profitMilestones = calculateProfitMilestones(tradeList);
    if (profitMilestones.achieved[100]) { achievements['profit-100'].achieved = true; achievements['profit-100'].date = profitMilestones.dates[100]; }
    if (profitMilestones.achieved[500]) { achievements['profit-500'].achieved = true; achievements['profit-500'].date = profitMilestones.dates[500]; }
    if (profitMilestones.achieved[1000]) { achievements['profit-1k'].achieved = true; achievements['profit-1k'].date = profitMilestones.dates[1000]; }
    if (profitMilestones.achieved[5000]) { achievements['profit-5k'].achieved = true; achievements['profit-5k'].date = profitMilestones.dates[5000]; }

    // Days
    const daysStreaks = calculateTradingDaysStreak(tradeList);
    if (daysStreaks.maxStreak >= 7) { achievements['days-streak-7'].achieved = true; achievements['days-streak-7'].date = daysStreaks.dates[7]; }
    if (daysStreaks.maxStreak >= 30) { achievements['days-streak-30'].achieved = true; achievements['days-streak-30'].date = daysStreaks.dates[30]; }
    if (daysStreaks.maxStreak >= 100) { achievements['days-streak-100'].achieved = true; achievements['days-streak-100'].date = daysStreaks.dates[100]; }

    // Monthly Goal Check
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthProfit = tradeList.filter(t => getSafeDateStr(t.entryTime || t.date).startsWith(currentMonth)).reduce((sum, t) => sum + t.profitLoss, 0);
    if (monthProfit >= 1000) {
      achievements['monthly-goal'].achieved = true;
      achievements['monthly-goal'].date = new Date().toISOString().slice(0, 10);
    }

    return achievements;
  };

  const calculateKeyStatistics = (tradeList) => {
    if (tradeList.length === 0) {
      return { bestMonth: { month: 'N/A', profit: 0 }, bestDay: { date: 'N/A', profit: 0 }, longestWinStreak: { number: 0 }, totalTrades: { count: 0, profit: 0 } };
    }

    const monthsMap = {};
    const daysMap = {};
    
    tradeList.forEach(trade => {
      const dateStr = getSafeDateStr(trade.entryTime || trade.date);
      if(!dateStr) return;
      const month = dateStr.slice(0, 7);
      
      monthsMap[month] = (monthsMap[month] || 0) + trade.profitLoss;
      daysMap[dateStr] = (daysMap[dateStr] || 0) + trade.profitLoss;
    });

    let bestMonth = { month: 'N/A', profit: -Infinity };
    Object.keys(monthsMap).forEach(month => {
      if (monthsMap[month] > bestMonth.profit) {
        bestMonth = { month: new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }), profit: monthsMap[month] };
      }
    });
    if (bestMonth.profit === -Infinity) bestMonth.profit = 0;

    let bestDay = { date: 'N/A', profit: -Infinity };
    Object.keys(daysMap).forEach(day => {
      if (daysMap[day] > bestDay.profit) { bestDay = { date: day, profit: daysMap[day] }; }
    });
    if (bestDay.profit === -Infinity) bestDay.profit = 0;

    const winStreakInfo = calculateWinStreaks(tradeList);
    const totalProfit = tradeList.reduce((sum, t) => sum + t.profitLoss, 0);

    return {
      bestMonth,
      bestDay,
      longestWinStreak: { number: winStreakInfo.maxStreak },
      totalTrades: { count: tradeList.length, profit: totalProfit }
    };
  };

  // --- MEMOIZED DATA ---
  const achievements = useMemo(() => calculateAchievements(sortedTrades), [sortedTrades]);
  const keyStats = useMemo(() => calculateKeyStatistics(sortedTrades), [sortedTrades]);

  // Generate dynamic active timeline from achieved badges!
  const timelineEvents = useMemo(() => {
    return Object.values(achievements)
      .filter(a => a.achieved && a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
  }, [achievements]);

  const chartData = useMemo(() => {
    let cumulative = 0;
    return sortedTrades.map((t, i) => {
      cumulative += t.profitLoss;
      return { trade: `T${i + 1}`, cumulative: parseFloat(cumulative.toFixed(2)), date: getSafeDateStr(t.entryTime || t.date) };
    });
  }, [sortedTrades]);

  const getGradientOffset = () => {
    if (chartData.length === 0) return 0;
    const dataMax = Math.max(...chartData.map(i => i.cumulative));
    const dataMin = Math.min(...chartData.map(i => i.cumulative));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };
  const off = getGradientOffset();

  const goalsProgress = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthProfit = sortedTrades.filter(t => getSafeDateStr(t.entryTime || t.date).startsWith(currentMonth)).reduce((sum, t) => sum + t.profitLoss, 0);
    const winRate = sortedTrades.length > 0 ? (sortedTrades.filter(t => t.profitLoss > 0).length / sortedTrades.length) * 100 : 0;
    const consistencyScore = sortedTrades.length > 0 ? (sortedTrades.filter(t => t.profitLoss > 0).length / sortedTrades.length) * 100 : 0; // Simplified for now

    return {
      monthlyProfit: { goal: 1000, current: monthProfit, label: 'Monthly Profit Goal' },
      winRate: { goal: 60, current: winRate, label: 'Win Rate Target' },
      consistency: { goal: 65, current: consistencyScore, label: 'Consistency Target' }
    };
  }, [sortedTrades]);

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isNegative = val < 0;
      const color = isNegative ? '#FF3333' : '#00FF88';
      const date = payload[0].payload.date;
      return (
        <div style={{ background: 'rgba(10, 14, 23, 0.95)', border: `1px solid ${color}`, padding: '12px 16px', borderRadius: '8px', boxShadow: `0 8px 24px rgba(0,0,0,0.4)` }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700 }}>{date}</p>
          <p style={{ color: color, margin: 0, fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {val >= 0 ? '+' : '-'}${Math.abs(val).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0', background: 'linear-gradient(135deg, #ffffff 0%, #00FF88 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🏆 TROPHY ROOM & MILESTONES
          </h1>
          <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Track your long-term trading journey, streaks, and account unlocks.</p>
        </div>
      </div>

      {/* QUICK STATS BENTO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Best Month', value: keyStats.bestMonth.month, sub: formatCurrency(keyStats.bestMonth.profit), color: '#00FF88' },
          { label: 'Best Single Day', value: keyStats.bestDay.date, sub: formatCurrency(keyStats.bestDay.profit), color: '#00FF88' },
          { label: 'Longest Win Streak', value: keyStats.longestWinStreak.number, sub: 'Consecutive Wins', color: '#2D9CDB' },
          { label: 'Total Executions', value: keyStats.totalTrades.count, sub: `Net: ${formatCurrency(keyStats.totalTrades.profit)}`, color: keyStats.totalTrades.profit >= 0 ? '#00FF88' : '#FF3333' }
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }} style={{ background: 'rgba(13,17,28,0.95)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '16px', padding: '20px 16px', textAlign: 'center', transition: 'all 0.3s' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</div>
            <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '6px' }}>{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* ACCOUNT GROWTH PIPELINE (SPLIT GRADIENT) */}
        <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>📈 Milestone Equity Curve</h3>
          <div style={{ flex: 1, minHeight: '300px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="splitColorMilestone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={off} stopColor="#00FF88" stopOpacity={0.4} />
                      <stop offset={off} stopColor="#FF3333" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="splitStrokeMilestone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={off} stopColor="#00FF88" stopOpacity={1} />
                      <stop offset={off} stopColor="#FF3333" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="trade" stroke="#6B7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cumulative" stroke="url(#splitStrokeMilestone)" strokeWidth={3} fill="url(#splitColorMilestone)" activeDot={{ r: 6, fill: '#191919', stroke: 'url(#splitStrokeMilestone)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>Execute trades to generate chart.</div>
            )}
          </div>
        </div>

        {/* 🟢 NEW: LIVE INTERACTIVE TIMELINE */}
        <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '420px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>⏳ Unlock Timeline</h3>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
            {timelineEvents.length > 0 ? (
              <div style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.05)', marginLeft: '12px', paddingBottom: '10px' }}>
                {timelineEvents.map((event, i) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ position: 'relative', paddingLeft: '24px', marginBottom: '24px' }}
                  >
                    {/* Glowing Node */}
                    <div style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 10px #00FF88' }} />
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '8px', padding: '10px', display: 'inline-block', width: '100%' }}>
                      <div style={{ color: '#FFF', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{event.icon}</span> {event.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px 0' }}>No milestones unlocked yet. Keep trading!</div>
            )}
          </div>
        </div>

      </div>

      {/* GOALS TRACKER */}
      <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>🎯 Target Matrix</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {Object.keys(goalsProgress).map((key, i) => {
            const goal = goalsProgress[key];
            const percent = Math.min((goal.current / goal.goal) * 100, 100);
            const isDone = percent >= 100;
            const barColor = isDone ? '#00FF88' : percent >= 75 ? '#F2C94C' : '#2D9CDB';

            return (
              <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i*0.1) }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem', fontWeight: 600 }}>{goal.label}</span>
                  <span style={{ color: barColor, fontSize: '0.85rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                    {key === 'monthlyProfit' ? `$${goal.current.toFixed(0)} / $${goal.goal}` : `${goal.current.toFixed(1)}${key === 'winRate' ? '%' : ''} / ${goal.goal}${key === 'winRate' ? '%' : ''}`}
                  </span>
                </div>
                {/* Sleek Neon Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(percent, 0)}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ height: '100%', background: barColor, boxShadow: `0 0 10px ${barColor}` }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* BADGE VAULT */}
      <div style={{ background: 'rgba(13,17,28,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>🎖️ Achievement Vault</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {BADGES.map(badge => {
            const isUnlocked = achievements[badge.id]?.achieved;
            return (
              <div 
                key={badge.id} 
                title={badge.description}
                style={{
                  background: isUnlocked ? 'rgba(0,255,136,0.05)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${isUnlocked ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px', padding: '20px 16px', textAlign: 'center', position: 'relative',
                  transition: 'all 0.3s', filter: isUnlocked ? 'none' : 'grayscale(1)', opacity: isUnlocked ? 1 : 0.5
                }}
              >
                {isUnlocked && (
                  <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#00FF88', color: '#000', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 0 10px #00FF88' }}>
                    ✓
                  </div>
                )}
                <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>{badge.icon}</div>
                <div style={{ color: isUnlocked ? '#FFF' : '#6B7280', fontSize: '0.8rem', fontWeight: 600, lineHeight: '1.4' }}>{badge.label}</div>
                {isUnlocked && <div style={{ color: '#00FF88', fontSize: '0.65rem', marginTop: '8px', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(achievements[badge.id].date).toLocaleDateString()}</div>}
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
};

export default MilestonesPage;