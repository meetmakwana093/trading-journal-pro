import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MilestonesPage = ({ trades = [] }) => {
  // Sort trades by entryTime (ascending)
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
  }, [trades]);

  // Calculate achievements and milestones
  const achievements = useMemo(() => calculateAchievements(sortedTrades), [sortedTrades]);

  // Prepare data for growth chart (cumulative profit over time)
  const chartData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    sortedTrades.forEach((trade) => {
      cumulative += trade.profitLoss;
      data.push({
        date: new Date(trade.entryTime).toISOString().slice(0, 10),
        value: cumulative
      });
    });
    return data.length > 0 ? data : [{ date: 'No Data', value: 0 }];
  }, [sortedTrades]);

  // Calculate key statistics
  const keyStats = useMemo(() => calculateKeyStatistics(sortedTrades), [sortedTrades]);

  // Calculate goals progress
  const goalsProgress = useMemo(() => {
    const totalProfit = sortedTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const winRate = sortedTrades.length > 0
      ? (sortedTrades.filter(t => t.profitLoss > 0).length / sortedTrades.length) * 100
      : 0;
    const consistencyScore = sortedTrades.length > 0
      ? (sortedTrades.filter(t => t.profitLoss > 0).length / sortedTrades.length) * 100
      : 0;

    return {
      monthlyProfit: {
        goal: 1000,
        current: totalProfit,
        label: 'Monthly Profit Goal'
      },
      winRate: {
        goal: 60,
        current: winRate,
        label: 'Win Rate Target'
      },
      consistency: {
        goal: 65,
        current: consistencyScore,
        label: 'Consistency Target'
      }
    };
  }, [sortedTrades]);

  return (
    <div className="milestones-page" style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#00FF88' }}>
          🏆 Milestones & Achievements
        </h1>
        <p style={{ margin: 0, color: '#B0B0B0' }}>Track your trading journey and progress</p>
      </div>

      {/* Achievement Badges Grid */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎖️ Achievement Badges</h2>
        <div style={styles.badgesGrid}>
          {BADGES.map(badge => (
            <div
              key={badge.id}
              style={{
                ...styles.badgeContainer,
                ...(achievements[badge.id] && achievements[badge.id].achieved
                  ? styles.badgeAchieved
                  : styles.badgeLocked)
              }}
              title={achievements[badge.id] && achievements[badge.id].date
                ? `Achieved: ${formatDate(achievements[badge.id].date)}`
                : 'Not yet achieved'}
            >
              <div style={styles.badgeIcon}>{badge.icon}</div>
              <div style={styles.badgeLabel}>{badge.label}</div>
              {achievements[badge.id] && achievements[badge.id].achieved && (
                <div style={styles.badgeCheck}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Growth Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 Account Growth Over Time</h2>
        {chartData.length > 0 && chartData[0].date !== 'No Data' ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF88" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
              <XAxis
                dataKey="date"
                stroke="#B0B0B0"
              />
              <YAxis
                stroke="#B0B0B0"
              />
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{ background: '#262626', border: '1px solid #00FF88' }}
                labelStyle={{ fill: '#00FF88' }}
                itemStyle={{ fill: '#00FF88' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={() => 'Account Value ($)'}
                labelStyle={{ fill: '#B0B0B0' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00FF88"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#B0B0B0', padding: '40px 20px' }}>
            <p>No trades yet. Start trading to see your growth chart!</p>
          </div>
        )}
      </div>

      {/* Key Statistics Cards */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 Key Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={{ color: '#00FF88', margin: '0 0 10px 0', fontSize: '1rem' }}>Best Month</h3>
            <div style={styles.statValue}>{keyStats.bestMonth.month}</div>
            <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginTop: '5px' }}>
              ${keyStats.bestMonth.profit.toFixed(0)}
            </div>
          </div>

          <div style={styles.statCard}>
            <h3 style={{ color: '#00FF88', margin: '0 0 10px 0', fontSize: '1rem' }}>Best Day</h3>
            <div style={styles.statValue}>{keyStats.bestDay.date}</div>
            <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginTop: '5px' }}>
              ${keyStats.bestDay.profit.toFixed(0)}
            </div>
          </div>

          <div style={styles.statCard}>
            <h3 style={{ color: '#00FF88', margin: '0 0 10px 0', fontSize: '1rem' }}>Longest Win Streak</h3>
            <div style={styles.statValue}>{keyStats.longestWinStreak.number}</div>
            <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginTop: '5px' }}>
              {keyStats.longestWinStreak.dates}
            </div>
          </div>

          <div style={styles.statCard}>
            <h3 style={{ color: '#00FF88', margin: '0 0 10px 0', fontSize: '1rem' }}>Total Trades</h3>
            <div style={styles.statValue}>{keyStats.totalTrades.count}</div>
            <div style={{ color: '#B0B0B0', fontSize: '0.9rem', marginTop: '5px' }}>
              ${keyStats.totalTrades.profit.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Targets */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎯 Goals & Targets</h2>
        <div style={styles.goalsGrid}>
          {Object.keys(goalsProgress).map(goalKey => {
            const goal = goalsProgress[goalKey];
            const percentage = Math.min((goal.current / goal.goal) * 100, 100);
            const isAboveTarget = goal.current >= goal.goal;
            const isNearTarget = percentage >= 80 && percentage < 100;
            const barColor = isAboveTarget
              ? '#00FF88'
              : isNearTarget
                ? '#FFAA00'
                : '#FF4444';

            return (
              <div key={goalKey} style={styles.goalCard}>
                <h3 style={{ color: '#00FF88', margin: '0 0 15px 0', fontSize: '1rem' }}>
                  {goal.label}
                </h3>
                <div style={styles.goalProgressContainer}>
                  <div
                    style={{
                      ...styles.goalProgressBar,
                      width: `${percentage}%`,
                      backgroundColor: barColor
                    }}
                  />
                </div>
                <div style={styles.goalProgressText}>
                  {goalKey === 'monthlyProfit'
                    ? `$${goal.current.toFixed(0)} / $${goal.goal.toFixed(0)}`
                    : goalKey === 'winRate'
                      ? `${goal.current.toFixed(1)}% / ${goal.goal.toFixed(0)}%`
                      : `${goal.current.toFixed(1)} / ${goal.goal.toFixed(0)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline placeholder */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 Timeline (Coming Soon)</h2>
        <p style={styles.timelinePlaceholder}>
          Interactive timeline showing major milestones chronologically will be added in a future update.
        </p>
      </div>
    </div>
  );
};

// Badge definitions
const BADGES = [
  { id: 'first-trade', label: 'First Trade Ever', icon: '🏁' },
  { id: 'first-profit', label: 'First Profitable Trade', icon: '💰' },
  { id: 'first-loss', label: 'First Loss (Learning)', icon: '📉' },
  { id: 'win-streak-5', label: 'Win Streak (5)', icon: '🔥' },
  { id: 'win-streak-10', label: 'Win Streak (10)', icon: '🔥' },
  { id: 'win-streak-20', label: 'Win Streak (20)', icon: '🔥' },
  { id: 'profit-100', label: 'Profit Milestone ($100)', icon: '💵' },
  { id: 'profit-500', label: 'Profit Milestone ($500)', icon: '💵' },
  { id: 'profit-1k', label: 'Profit Milestone ($1K)', icon: '💵' },
  { id: 'profit-5k', label: 'Profit Milestone ($5K)', icon: '💵' },
  { id: 'days-streak-7', label: 'Trading Days Streak (7)', icon: '📅' },
  { id: 'days-streak-30', label: 'Trading Days Streak (30)', icon: '📅' },
  { id: 'days-streak-100', label: 'Trading Days Streak (100)', icon: '📅' },
  { id: 'monthly-goal', label: 'Monthly Goal Reached', icon: '🎯' },
  { id: 'risk-reward-1-2', label: 'Risk/Reward Achievement (1:2)', icon: '⚖️' },
  { id: 'risk-reward-1-3', label: 'Risk/Reward Achievement (1:3)', icon: '⚖️' },
  { id: 'risk-reward-1-5', label: 'Risk/Reward Achievement (1:5)', icon: '⚖️' },
  { id: 'consistency-50', label: 'Consistency Score (50%)', icon: '📊' },
  { id: 'consistency-60', label: 'Consistency Score (60%)', icon: '📊' },
  { id: 'consistency-70', label: 'Consistency Score (70%)', icon: '📊' }
];

// Styles object
const styles = {
  page: {
    backgroundColor: '#0F0F0F',
    color: 'white',
    minHeight: '100vh',
    padding: '24px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  pageHeader: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  section: {
    backgroundColor: '#262626',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
    border: '1px solid #3A3A3A'
  },
  sectionTitle: {
    color: '#00FF88',
    marginTop: '0',
    marginBottom: '20px',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '15px'
  },
  badgeContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: '10px',
    padding: '15px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    border: '1px solid #3A3A3A',
    cursor: 'default',
    position: 'relative'
  },
  badgeAchieved: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: '#00FF88',
    boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)',
    transform: 'scale(1.05)'
  },
  badgeLocked: {
    opacity: '0.6',
    filter: 'grayscale(0.4)'
  },
  badgeIcon: {
    fontSize: '2rem',
    marginBottom: '10px',
    display: 'block'
  },
  badgeLabel: {
    color: '#B0B0B0',
    fontSize: '0.9rem',
    marginBottom: '10px',
    minHeight: '36px'
  },
  badgeCheck: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#00FF88',
    color: '#0F0F0F',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '15px'
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: '10px',
    padding: '15px',
    textAlign: 'center',
    border: '1px solid #3A3A3A',
    transition: 'all 0.3s ease'
  },
  statValue: {
    color: '#00FF88',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    margin: '10px 0'
  },
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px'
  },
  goalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: '10px',
    padding: '15px',
    textAlign: 'center',
    border: '1px solid #3A3A3A'
  },
  goalProgressContainer: {
    width: '100%',
    height: '10px',
    backgroundColor: '#3A3A3A',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  goalProgressBar: {
    height: '100%',
    transition: 'width 0.5s ease'
  },
  goalProgressText: {
    color: '#B0B0B0',
    fontSize: '0.9rem'
  },
  timelinePlaceholder: {
    color: '#B0B0B0',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '40px 20px'
  }
};

// Helper functions
const calculateAchievements = (trades) => {
  const achievements = {};

  // Initialize ALL badges as not achieved
  BADGES.forEach(badge => {
    achievements[badge.id] = { achieved: false, date: null };
  });

  if (trades.length === 0) {
    return achievements;
  }

  // First trade ever
  achievements['first-trade'] = {
    achieved: true,
    date: new Date(trades[0].entryTime).toISOString().slice(0, 10)
  };

  // First profitable trade
  const firstProfitable = trades.find(t => t.profitLoss > 0);
  achievements['first-profit'] = {
    achieved: !!firstProfitable,
    date: firstProfitable
      ? new Date(firstProfitable.entryTime).toISOString().slice(0, 10)
      : null
  };

  // First loss
  const firstLoss = trades.find(t => t.profitLoss < 0);
  achievements['first-loss'] = {
    achieved: !!firstLoss,
    date: firstLoss
      ? new Date(firstLoss.entryTime).toISOString().slice(0, 10)
      : null
  };

  // Win streaks (5, 10, 20)
  const winStreaks = calculateWinStreaks(trades);
  achievements['win-streak-5'] = {
    achieved: winStreaks.maxStreak >= 5,
    date: winStreaks.dates[5] || null
  };
  achievements['win-streak-10'] = {
    achieved: winStreaks.maxStreak >= 10,
    date: winStreaks.dates[10] || null
  };
  achievements['win-streak-20'] = {
    achieved: winStreaks.maxStreak >= 20,
    date: winStreaks.dates[20] || null
  };

  // Profit milestones
  const profitMilestones = calculateProfitMilestones(trades);
  achievements['profit-100'] = {
    achieved: profitMilestones.achieved[100] || false,
    date: profitMilestones.dates[100] || null
  };
  achievements['profit-500'] = {
    achieved: profitMilestones.achieved[500] || false,
    date: profitMilestones.dates[500] || null
  };
  achievements['profit-1k'] = {
    achieved: profitMilestones.achieved[1000] || false,
    date: profitMilestones.dates[1000] || null
  };
  achievements['profit-5k'] = {
    achieved: profitMilestones.achieved[5000] || false,
    date: profitMilestones.dates[5000] || null
  };

  // Trading days streaks
  const daysStreaks = calculateTradingDaysStreak(trades);
  achievements['days-streak-7'] = {
    achieved: daysStreaks.maxStreak >= 7,
    date: daysStreaks.dates[7] || null
  };
  achievements['days-streak-30'] = {
    achieved: daysStreaks.maxStreak >= 30,
    date: daysStreaks.dates[30] || null
  };
  achievements['days-streak-100'] = {
    achieved: daysStreaks.maxStreak >= 100,
    date: daysStreaks.dates[100] || null
  };

  // Placeholders for badges we can't calculate with current data
  achievements['monthly-goal'] = { achieved: false, date: null };
  achievements['risk-reward-1-2'] = { achieved: false, date: null };
  achievements['risk-reward-1-3'] = { achieved: false, date: null };
  achievements['risk-reward-1-5'] = { achieved: false, date: null };
  achievements['consistency-50'] = { achieved: false, date: null };
  achievements['consistency-60'] = { achieved: false, date: null };
  achievements['consistency-70'] = { achieved: false, date: null };

  return achievements;
};

const calculateWinStreaks = (trades) => {
  let maxStreak = 0;
  let currentStreak = 0;
  const dates = {};

  trades.forEach((trade) => {
    if (trade.profitLoss > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        [5, 10, 20].forEach(milestone => {
          if (currentStreak === milestone && !dates[milestone]) {
            dates[milestone] = new Date(trade.entryTime).toISOString().slice(0, 10);
          }
        });
      }
    } else {
      currentStreak = 0;
    }
  });

  return { maxStreak, dates };
};

const calculateProfitMilestones = (trades) => {
  const milestones = [100, 500, 1000, 5000];
  const achieved = {};
  const dates = {};
  let cumulative = 0;

  // Initialize all milestones as false
  milestones.forEach(m => { achieved[m] = false; });

  trades.forEach(trade => {
    cumulative += trade.profitLoss;
    milestones.forEach(milestone => {
      if (cumulative >= milestone && !achieved[milestone]) {
        achieved[milestone] = true;
        dates[milestone] = new Date(trade.entryTime).toISOString().slice(0, 10);
      }
    });
  });

  return { achieved, dates };
};

const calculateTradingDaysStreak = (trades) => {
  const daysMap = {};
  trades.forEach(trade => {
    const day = new Date(trade.entryTime).toISOString().slice(0, 10);
    if (!daysMap[day]) {
      daysMap[day] = [];
    }
    daysMap[day].push(trade);
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

const calculateKeyStatistics = (trades) => {
  if (trades.length === 0) {
    return {
      bestMonth: { month: 'N/A', profit: 0, date: 'N/A' },
      bestDay: { date: 'N/A', profit: 0 },
      longestWinStreak: { number: 0, dates: 'N/A' },
      totalTrades: { count: 0, profit: 0 }
    };
  }

  const monthsMap = {};
  trades.forEach(trade => {
    const month = new Date(trade.entryTime).toISOString().slice(0, 7);
    if (!monthsMap[month]) {
      monthsMap[month] = 0;
    }
    monthsMap[month] += trade.profitLoss;
  });

  let bestMonth = { month: 'N/A', profit: 0, date: 'N/A' };
  Object.keys(monthsMap).forEach(month => {
    if (monthsMap[month] > bestMonth.profit) {
      bestMonth = {
        month: new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
        profit: monthsMap[month],
        date: month
      };
    }
  });

  const daysMap = {};
  trades.forEach(trade => {
    const day = new Date(trade.entryTime).toISOString().slice(0, 10);
    if (!daysMap[day]) {
      daysMap[day] = 0;
    }
    daysMap[day] += trade.profitLoss;
  });

  let bestDay = { date: 'N/A', profit: 0 };
  Object.keys(daysMap).forEach(day => {
    if (daysMap[day] > bestDay.profit) {
      bestDay = { date: day, profit: daysMap[day] };
    }
  });

  const winStreakInfo = calculateWinStreaks(trades);
  let longestStreakDates = 'N/A';
  if (winStreakInfo.maxStreak > 0) {
    longestStreakDates = `${winStreakInfo.maxStreak} consecutive wins`;
  }

  const totalProfit = trades.reduce((sum, t) => sum + t.profitLoss, 0);

  return {
    bestMonth,
    bestDay,
    longestWinStreak: {
      number: winStreakInfo.maxStreak,
      dates: longestStreakDates
    },
    totalTrades: {
      count: trades.length,
      profit: totalProfit
    }
  };
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default MilestonesPage;