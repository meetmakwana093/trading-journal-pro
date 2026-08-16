import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getToken } from '../auth/authService';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DataImport = ({ onBulkTradesImported }) => {
  const [parsedTrades, setParsedTrades] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Custom Fast Client-Side CSV Parser
  const handleFileUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error('File contains no data rows.');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
        
        const symbolIdx = headers.findIndex(h => h.includes('symbol') || h.includes('ticker') || h.includes('instrument') || h.includes('pair'));
        const pnlIdx = headers.findIndex(h => h.includes('pnl') || h.includes('profit') || h.includes('net') || h.includes('p/l') || h.includes('amount'));
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('entry'));
        const directionIdx = headers.findIndex(h => h.includes('direction') || h.includes('side') || h.includes('type'));
        const entryPriceIdx = headers.findIndex(h => h.includes('entry') && h.includes('price') || h.includes('buy price'));
        const exitPriceIdx = headers.findIndex(h => h.includes('exit') && h.includes('price') || h.includes('sell price'));

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/['"]+/g, ''));
          if (cols.length < headers.length) continue;

          const pnlVal = parseFloat(cols[pnlIdx]) || 0;
          const symbolVal = symbolIdx !== -1 ? cols[symbolIdx] : 'UNKNOWN';
          const rawDate = dateIdx !== -1 ? cols[dateIdx] : new Date().toISOString().split('T')[0];
          const directionVal = directionIdx !== -1 ? cols[directionIdx].toUpperCase() : (pnlVal >= 0 ? 'LONG' : 'SHORT');
          
          rows.push({
            id: i,
            symbol: symbolVal.toUpperCase(),
            profitLoss: pnlVal,
            date: rawDate,
            entryPrice: entryPriceIdx !== -1 ? parseFloat(cols[entryPriceIdx]) || 0 : 0,
            exitPrice: exitPriceIdx !== -1 ? parseFloat(cols[exitPriceIdx]) || 0 : 0,
            direction: directionVal.includes('BUY') || directionVal.includes('LONG') ? 'LONG' : 'SHORT',
            session: 'New York',
            model: 'CSV Import',
            followedPlan: true
          });
        }

        setParsedTrades(rows);
        setIsProcessing(false);
      } catch (err) {
        setIsProcessing(false);
        setStatusMessage({ type: 'error', text: `Failed to parse CSV: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleCommit = () => {
    if (parsedTrades.length === 0) return;
    setIsProcessing(true);

    fetch(`${API}/trades/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ trades: parsedTrades })
    })
      .then(res => res.json())
      .then(data => {
        setIsProcessing(false);
        if (data.trades && onBulkTradesImported) {
          onBulkTradesImported(data.trades);
        }
        setStatusMessage({ type: 'success', text: `✅ Successfully imported ${parsedTrades.length} trades into your database!` });
        setParsedTrades([]);
        setFileName('');
      })
      .catch(err => {
        setIsProcessing(false);
        setStatusMessage({ type: 'error', text: `Upload failed: ${err.message}` });
      });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#FFF', fontFamily: 'Inter, sans-serif', maxWidth: '1200px' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>☁️ BROKER CSV DATA IMPORT</h1>
        <p style={{ color: '#9B9A97', margin: 0, fontSize: '0.85rem' }}>Upload trade exports from Groww, Zerodha, or custom trade logs in seconds.</p>
      </div>

      {/* DROPZONE */}
      <div style={{
        background: 'rgba(38,38,38,0.4)',
        border: '2px dashed rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '40px 20px',
        textAlign: 'center',
        marginBottom: '24px',
        position: 'relative'
      }}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} 
        />
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>
          {fileName ? `Selected: ${fileName}` : 'Drag & Drop your broker CSV file here'}
        </h3>
        <p style={{ color: '#9B9A97', fontSize: '0.8rem', margin: 0 }}>Auto-detects Symbol, Date, Direction, and P&L columns</p>
      </div>

      {/* STATUS MESSAGE */}
      {statusMessage && (
        <div style={{
          background: statusMessage.type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,51,0.1)',
          border: `1px solid ${statusMessage.type === 'success' ? '#00FF88' : '#FF3333'}`,
          color: statusMessage.type === 'success' ? '#00FF88' : '#FF3333',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* PREVIEW TABLE */}
      {parsedTrades.length > 0 && (
        <div style={{ background: 'rgba(38,38,38,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Staged Trades Preview ({parsedTrades.length} records)</span>
            <button
              onClick={handleCommit}
              disabled={isProcessing}
              style={{
                background: '#00FF88', color: '#080B14', border: 'none',
                padding: '10px 24px', borderRadius: '8px', fontWeight: 800,
                cursor: 'pointer', opacity: isProcessing ? 0.7 : 1
              }}
            >
              {isProcessing ? 'Importing...' : 'Confirm & Save All to Database'}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#9B9A97', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Symbol</th>
                  <th style={{ padding: '10px' }}>Side</th>
                  <th style={{ padding: '10px' }}>Entry</th>
                  <th style={{ padding: '10px' }}>Exit</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>P&L ($)</th>
                </tr>
              </thead>
              <tbody>
                {parsedTrades.slice(0, 10).map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px' }}>{t.date}</td>
                    <td style={{ padding: '10px', fontWeight: 700 }}>{t.symbol}</td>
                    <td style={{ padding: '10px', color: t.direction === 'LONG' ? '#00FF88' : '#FF3333' }}>{t.direction}</td>
                    <td style={{ padding: '10px' }}>{t.entryPrice || '-'}</td>
                    <td style={{ padding: '10px' }}>{t.exitPrice || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: t.profitLoss >= 0 ? '#00FF88' : '#FF3333' }}>
                      ${t.profitLoss}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedTrades.length > 10 && (
              <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.75rem', padding: '12px 0' }}>
                ...and {parsedTrades.length - 10} more rows ready to be saved
              </div>
            )}
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default DataImport;