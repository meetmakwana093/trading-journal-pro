import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getToken } from '../auth/authService';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DataImport = ({ onBulkTradesImported }) => {
    const [parsedTrades, setParsedTrades] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Formats DD-MM-YYYY to YYYY-MM-DD for the database
    const formatBrokerDate = (dateStr) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        if (dateStr.match(/^\d{2}[-/]\d{2}[-/]\d{4}/)) {
            const parts = dateStr.split(/[-/]/);
            return `${parts[2]}-${parts[1]}-${parts[0]}`; 
        }
        return dateStr;
    };

    // 🟢 NEW: Bulletproof CSV row parser (Handles spaces & commas inside quotes perfectly)
    const parseCsvRow = (row) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^"|"$/g, '').trim());
    };

    const handleFileUpload = (e) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            setStatusMessage({ type: 'error', text: '❌ Invalid file format. Please open your Excel file, click "Save As -> CSV", and upload the CSV file.' });
            return;
        }

        setFileName(file.name);
        setIsProcessing(true);
        setStatusMessage(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error('File is empty or invalid.');

                // 1. SMART SCAN for headers
                let headerIdx = -1;
                for (let i = 0; i < Math.min(lines.length, 20); i++) {
                    const lowerLine = lines[i].toLowerCase();
                    if (
                        lowerLine.includes('symbol') || lowerLine.includes('instrument') || 
                        lowerLine.includes('ticker') || lowerLine.includes('scrip') || 
                        lowerLine.includes('stock') || lowerLine.includes('security') || 
                        lowerLine.includes('company')
                    ) {
                        headerIdx = i;
                        break;
                    }
                }

                if (headerIdx === -1) {
                    throw new Error('Could not detect column headers. Make sure your CSV contains a "Stock name" or "Symbol" column.');
                }

                // 2. EXTRACT COLUMNS safely
                const headers = parseCsvRow(lines[headerIdx]).map(h => h.toLowerCase());
                
                const symbolIdx = headers.findIndex(h => h.includes('symbol') || h.includes('stock') || h.includes('instrument') || h.includes('scrip'));
                const pnlIdx = headers.findIndex(h => h.includes('p&l') || h.includes('realised') || h.includes('realized') || h.includes('profit') || h.includes('net'));
                const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('entry'));
                const directionIdx = headers.findIndex(h => h.includes('direction') || h.includes('side') || h.includes('type'));
                const entryPriceIdx = headers.findIndex(h => (h.includes('buy') || h.includes('entry') || h.includes('avg')) && (h.includes('price') || h.includes('cost')));
                const exitPriceIdx = headers.findIndex(h => (h.includes('sell') || h.includes('exit') || h.includes('avg')) && (h.includes('price')));

                const rows = [];
                
                // 3. PARSE ROWS
                for (let i = headerIdx + 1; i < lines.length; i++) {
                    const cols = parseCsvRow(lines[i]);
                    
                    if (cols.length < Math.max(1, headers.length - 2)) continue; 

                    let pnlVal = 0;
                    if (pnlIdx !== -1 && cols[pnlIdx]) {
                        pnlVal = parseFloat(cols[pnlIdx].replace(/[^0-9.-]+/g, '')) || 0;
                    }

                    let entryVal = 0;
                    if (entryPriceIdx !== -1 && cols[entryPriceIdx]) {
                        entryVal = parseFloat(cols[entryPriceIdx].replace(/[^0-9.-]+/g, '')) || 0;
                    }

                    let exitVal = 0;
                    if (exitPriceIdx !== -1 && cols[exitPriceIdx]) {
                        exitVal = parseFloat(cols[exitPriceIdx].replace(/[^0-9.-]+/g, '')) || 0;
                    }

                    const symbolVal = symbolIdx !== -1 && cols[symbolIdx] ? cols[symbolIdx] : '';
                    const rawDate = dateIdx !== -1 && cols[dateIdx] ? formatBrokerDate(cols[dateIdx]) : new Date().toISOString().split('T')[0];
                    
                    let directionVal = 'LONG';
                    if (directionIdx !== -1 && cols[directionIdx]) {
                        const d = cols[directionIdx].toUpperCase();
                        if (d.includes('SELL') || d.includes('SHORT')) directionVal = 'SHORT';
                    } else {
                        directionVal = pnlVal >= 0 ? 'LONG' : 'SHORT'; 
                    }
                    
                    if (symbolVal && symbolVal.toUpperCase() !== 'UNKNOWN') {
                        rows.push({
                            id: i,
                            symbol: symbolVal.toUpperCase(),
                            profitLoss: pnlVal,
                            date: rawDate,
                            entryPrice: entryVal,
                            exitPrice: exitVal,
                            direction: directionVal,
                            session: 'Asian',
                            model: 'CSV Import',
                            followedPlan: true
                        });
                    }
                }

                if (rows.length === 0) {
                    throw new Error("Found the headers, but couldn't read any valid trade data below them.");
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
            .then(res => {
                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                return res.json();
            })
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

            <div style={{
                background: 'rgba(38,38,38,0.4)',
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                marginBottom: '24px',
                position: 'relative',
                transition: 'all 0.2s',
            }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 10 }}
                />
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>
                    {fileName ? `Selected: ${fileName}` : 'Drag & Drop your broker CSV file here'}
                </h3>
                <p style={{ color: '#9B9A97', fontSize: '0.8rem', margin: 0 }}>Auto-detects Stock Name, Date, Direction, and P&L columns</p>
            </div>

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
                                            {t.profitLoss >= 0 ? '+' : ''}${t.profitLoss}
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