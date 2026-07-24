import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- LOGIC BLOCK UNCHANGED ---
const BADGES = [
  { id: 'first-trade', label: 'First Trade', icon: '🏁' }, { id: 'first-profit', label: 'First Profit', icon: '💰' },
  { id: 'win-streak-5', label: 'Streak (5)', icon: '🔥' }, { id: 'win-streak-10', label: 'Streak (10)', icon: '🔥' },
  { id: 'profit-100', label: 'Profit ($100)', icon: '💵' }, { id: 'profit-1k', label: 'Profit ($1K)', icon: '💵' },
  { id: 'days-streak-7', label: '7 Days Act.', icon: '📅' }, { id: 'consistency-60', label: 'Consistent', icon: '📊' }
];

const MilestonesPage = ({ trades = [] }) => {
  const sortedTrades = useMemo(() => [...trades].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime)), [trades]);
  
  const achievements = useMemo(() => {
    const ach = {}; BADGES.forEach(b => ach[b.id] = { achieved: false });
    if(trades.length === 0) return ach;
    ach['first-trade'] = { achieved: true };
    ach['first-profit'] = { achieved: !!trades.find(t => t.profitLoss > 0) };
    let streak = 0, maxS = 0; let prof = 0;
    trades.forEach(t => { 
      if(t.profitLoss>0){ streak++; if(streak>maxS) maxS=streak; } else streak=0;
      prof+=t.profitLoss; 
      if(prof>=100) ach['profit-100'].achieved=true; 
      if(prof>=1000) ach['profit-1k'].achieved=true;
    });
    if(maxS>=5) ach['win-streak-5'].achieved=true;
    if(maxS>=10) ach['win-streak-10'].achieved=true;
    return ach;
  }, [trades]);

  const chartData = useMemo(() => {
    let cum = 0; return sortedTrades.map(t => { cum += t.profitLoss; return { date: new Date(t.entryTime).toISOString().slice(0,10), value: cum };});
  }, [sortedTrades]);

  const goalsProgress = useMemo(() => {
    const totalProfit = sortedTrades.reduce((s, t) => s + t.profitLoss, 0);
    const winRate = sortedTrades.length ? (sortedTrades.filter(t => t.profitLoss > 0).length / sortedTrades.length) * 100 : 0;
    return {
      monthlyProfit: { goal: 1000, current: totalProfit, label: 'Profit Goal ($1K)' },
      winRate: { goal: 60, current: winRate, label: 'Win Rate Target (60%)' }
    };
  }, [sortedTrades]);
  // --- END LOGIC ---

  return (
    <div className="bento-grid">
      
      {/* GOALS */}
      <div className="bento-card col-span-12">
        <div className="card-label" style={{ marginBottom: '16px' }}>Current Targets</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {Object.entries(goalsProgress).map(([k, goal]) => {
            const perc = Math.min((goal.current / goal.goal) * 100, 100);
            return (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#FFF', fontWeight: 600 }}>{goal.label}</span>
                  <span style={{ color: '#8A8F98' }}>{perc.toFixed(0)}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${perc}%`, background: perc >= 100 ? '#00FF88' : 'linear-gradient(90deg, #FF9900, #00FF88)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BADGES */}
      <div className="bento-card col-span-12">
        <div className="card-label" style={{ marginBottom: '16px' }}>Achievement Badges</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {BADGES.map(b => {
            const achieved = achievements[b.id]?.achieved;
            return (
              <div key={b.id} style={{ background: achieved ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${achieved ? 'rgba(0,255,136,0.2)' : 'transparent'}`, borderRadius: '16px', padding: '20px', textAlign: 'center', filter: achieved ? 'none' : 'grayscale(1)', opacity: achieved ? 1 : 0.4 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{b.icon}</div>
                <div style={{ color: achieved ? '#00FF88' : '#8A8F98', fontSize: '0.85rem', fontWeight: 600 }}>{b.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* GROWTH CHART */}
      <div className="bento-card col-span-12">
        <div className="card-label" style={{ marginBottom: '16px' }}>Journey Timeline</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/><stop offset="95%" stopColor="#00FF88" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#8A8F98" axisLine={false} tickLine={false} />
            <YAxis stroke="#8A8F98" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="value" stroke="#00FF88" strokeWidth={3} fill="url(#colorV)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
export default MilestonesPage;