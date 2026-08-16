import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const EconomicCalendar = () => {
  const containerRef = useRef(null);
  const [macroNotes, setMacroNotes] = useState(() => localStorage.getItem('macro_notes') || '');

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: true,
      width: '100%',
      height: '600',
      locale: 'en',
      importanceFilter: '0,1',
      currencyFilter: 'USD,INR,EUR,GBP'
    });

    containerRef.current.appendChild(script);
  }, []);

  const handleNotesChange = (e) => {
    setMacroNotes(e.target.value);
    localStorage.setItem('macro_notes', e.target.value);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>📅 ECONOMIC CALENDAR & MACRO DRIVERS</h1>
          <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Track high-impact rate decisions, CPI releases, and central bank commentary.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* LIVE TRADINGVIEW EMBED */}
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', minHeight: '620px' }}>
          <div ref={containerRef} className="tradingview-widget-container" />
        </div>

        {/* HIGH VOLATILITY PROTOCOL & NOTES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,51,51,0.2)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#FF3333', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⚠️ High Impact News Protocol
            </h3>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#9B9A97', fontSize: '0.85rem', lineHeight: '1.6' }}>
              <li>Avoid placing limit orders within 5 minutes of high-impact releases.</li>
              <li>Wait for the initial spike liquidity sweep before confirming continuation.</li>
              <li>Widen stop-loss calculations or reduce lot size during major central bank announcements.</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#2D9CDB', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Custom News Alerts & Notes
            </h3>
            <textarea 
              value={macroNotes}
              onChange={handleNotesChange}
              placeholder="e.g. RBI MPC Meeting commentary at 10:00 AM. Expect high spread volatility."
              style={{ flex: 1, minHeight: '200px', background: '#191919', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', padding: '12px', borderRadius: '8px', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
            />
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default EconomicCalendar;