import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const AICoach = ({ trades = [], playbooks = [] }) => {
  const [activePrompt, setActivePrompt] = useState('edge');

  const analysis = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss < 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const winRate = ((wins.length / trades.length) * 100).toFixed(1);
    
    // Psychology breakdown
    const brokenPlanTrades = trades.filter(t => !t.followedPlan);
    const brokenPlanLosses = brokenPlanTrades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + Math.abs(t.profitLoss), 0);

    // Best and Worst Models
    const modelStats = {};
    trades.forEach(t => {
      const name = t.model || 'Manual';
      if (!modelStats[name]) modelStats[name] = { pnl: 0, count: 0, wins: 0 };
      modelStats[name].pnl += t.profitLoss;
      modelStats[name].count += 1;
      if (t.profitLoss > 0) modelStats[name].wins += 1;
    });

    let bestModel = { name: 'None', pnl: -Infinity };
    let worstModel = { name: 'None', pnl: Infinity };
    Object.keys(modelStats).forEach(name => {
      if (modelStats[name].pnl > bestModel.pnl) bestModel = { name, ...modelStats[name] };
      if (modelStats[name].pnl < worstModel.pnl) worstModel = { name, ...modelStats[name] };
    });

    return {
      totalTrades: trades.length,
      winRate,
      totalPnL: totalPnL.toFixed(2),
      brokenPlanCount: brokenPlanTrades.length,
      brokenPlanLosses: brokenPlanLosses.toFixed(2),
      bestModel,
      worstModel,
      avgWin: wins.length ? (wins.reduce((sum, t) => sum + t.profitLoss, 0) / wins.length).toFixed(2) : 0,
      avgLoss: losses.length ? (losses.reduce((sum, t) => sum + Math.abs(t.profitLoss), 0) / losses.length).toFixed(2) : 0
    };
  }, [trades]);

  const promptConfigs = {
    edge: {
      title: '🎯 Strategy Edge & Playbook Audit',
      render: () => (
        <div style={{ lineHeight: '1.7', color: '#D1D5DB' }}>
          <p>Analyzing your execution across <strong>{analysis?.totalTrades} recorded trades</strong>:</p>
          <div style={{ background: 'rgba(0, 255, 136, 0.05)', borderLeft: '4px solid #00FF88', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
            <strong style={{ color: '#00FF88' }}>Top Performing Model: {analysis?.bestModel.name}</strong>
            <div>Total Yield: +${analysis?.bestModel.pnl.toFixed(2)} across {analysis?.bestModel.count} executions ({((analysis?.bestModel.wins / (analysis?.bestModel.count || 1)) * 100).toFixed(0)}% Win Rate).</div>
          </div>
          <p>
            Your current mathematical edge has generated <strong>${analysis?.totalPnL}</strong> with an overall strike rate of <strong>{analysis?.winRate}%</strong>. 
            {analysis?.worstModel.pnl < 0 && (
              <span> You are currently leaking capital on <strong>{analysis?.worstModel.name}</strong> (-${Math.abs(analysis?.worstModel.pnl).toFixed(2)}). Consider pausing this setup to review its timeframe alignment.</span>
            )}
          </p>
        </div>
      )
    },
    psychology: {
      title: '🧠 Behavioral Discipline & Tilt Diagnosis',
      render: () => (
        <div style={{ lineHeight: '1.7', color: '#D1D5DB' }}>
          <div style={{ background: 'rgba(255, 51, 51, 0.05)', borderLeft: '4px solid #FF3333', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
            <strong style={{ color: '#FF3333' }}>Rule Deviation Cost: -${analysis?.brokenPlanLosses}</strong>
            <div>You logged {analysis?.brokenPlanCount} trades where your execution deviated from your plan rules.</div>
          </div>
          <p>
            When you follow your defined playbook criteria, your expectancy improves substantially. 
            Eliminating trades triggered by impatience or premature entries would immediately retain <strong>${analysis?.brokenPlanLosses}</strong> in your account balance.
          </p>
        </div>
      )
    },
    risk: {
      title: '⚖️ Asymmetric Risk & Payoff Analysis',
      render: () => (
        <div style={{ lineHeight: '1.7', color: '#D1D5DB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9B9A97' }}>AVERAGE WIN</div>
              <div style={{ color: '#00FF88', fontSize: '1.4rem', fontWeight: 800 }}>${analysis?.avgWin}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9B9A97' }}>AVERAGE LOSS</div>
              <div style={{ color: '#FF3333', fontSize: '1.4rem', fontWeight: 800 }}>${analysis?.avgLoss}</div>
            </div>
          </div>
          <p>
            Your current payoff ratio is <strong>{analysis?.avgLoss > 0 ? (analysis?.avgWin / analysis?.avgLoss).toFixed(2) : 'N/A'}:1</strong>. 
            Consistently enforcing strict Stop Loss invalidation levels ensures single trade outliers do not erase multi-day profit streaks.
          </p>
        </div>
      )
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '1000px' }}>
      
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>🤖 AI PERFORMANCE COACH</h1>
        <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Real-time statistical evaluation of your execution, risk, and behavioral discipline.</p>
      </div>

      {/* QUICK AUDIT PROMPTS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[
          { key: 'edge', label: '🎯 Audit Edge & Playbook' },
          { key: 'psychology', label: '🧠 Behavioral Leak Report' },
          { key: 'risk', label: '⚖️ Risk/Reward Diagnosis' }
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setActivePrompt(p.key)}
            style={{
              padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
              background: activePrompt === p.key ? '#00FF88' : 'rgba(38,38,38,0.5)',
              color: activePrompt === p.key ? '#080B14' : '#9CA3AF',
              border: activePrompt === p.key ? 'none' : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* COACHING RESPONSE CARD */}
      <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
        {!analysis ? (
          <div style={{ color: '#9B9A97', textAlign: 'center', padding: '40px' }}>
            No trade data available to audit. Log trades in your Trades DB to activate the AI Coach.
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#FFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {promptConfigs[activePrompt].title}
            </h2>
            {promptConfigs[activePrompt].render()}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default AICoach;