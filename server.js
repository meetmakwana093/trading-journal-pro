import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'TRADING_JWT_SECRET_2024';

// 1. CONNECT TO MYSQL
const pool = mysql.createPool({
  host: '103.212.121.69',
  user: 'trade_journal_user',
  password: 'MySql@122333',
  database: 'trade_journal',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(() => console.log('✅ Successfully connected to MySQL database!'))
  .catch(err => console.error('❌ Database connection error', err.stack));

// ==========================================
// AUTOMATIC DATABASE SETUP (RUNS ON STARTUP)
// ==========================================
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('✅ Users table ready'))
  .catch(err => console.error('❌ Users table error:', err.message));

pool.query(`
  ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id INT
`).then(() => console.log('✅ user_id column ready in trades'))
  .catch(() => console.log('ℹ️ user_id column already exists in trades'));

pool.query(`
  CREATE TABLE IF NOT EXISTS missed_trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    missed_entry_price DECIMAL(15,4) DEFAULT 0,
    missed_exit_price DECIMAL(15,4) DEFAULT 0,
    predicted_pnl DECIMAL(15,4) NOT NULL,
    entry_time DATETIME NOT NULL,
    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`).then(() => console.log('✅ Missed Trades table ready'))
  .catch(err => console.error('❌ Missed Trades table error:', err.message));

// 🟢 NEW: Playbooks Table
pool.query(`
  CREATE TABLE IF NOT EXISTS playbooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    timeframe VARCHAR(20) DEFAULT '15m',
    description TEXT,
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('✅ Playbooks table ready'))
  .catch(err => console.error('❌ Playbooks table error:', err.message));

// 🟢 NEW: Add Advanced Metrics Columns
async function updateTradesTable() {
  try {
    await pool.query("ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(15,4) DEFAULT 0");
    await pool.query("ALTER TABLE trades ADD COLUMN IF NOT EXISTS risk_reward DECIMAL(10,2) DEFAULT 0");
    await pool.query("ALTER TABLE trades ADD COLUMN IF NOT EXISTS playbook_id INT DEFAULT NULL");
    await pool.query("ALTER TABLE trades ADD COLUMN IF NOT EXISTS chart_link VARCHAR(500) DEFAULT ''");
    console.log('✅ Trades table advanced columns ready');
  } catch (e) {
    console.log('ℹ️ Trades table columns check complete');
  }
}
updateTradesTable();


// JWT MIDDLEWARE
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// MAP DB ROW TO REACT FORMAT
const mapDBToReact = (row) => ({
  id: row.id,
  symbol: row.symbol,
  entryPrice: parseFloat(row.entry_price) || 0,
  exitPrice: parseFloat(row.exit_price) || 0,
  stopLoss: parseFloat(row.stop_loss) || 0,
  profitLoss: parseFloat(row.profit_loss) || 0,
  riskReward: parseFloat(row.risk_reward) || 0,
  entryTime: row.entry_time,
  session: row.session || '',
  direction: row.direction || '',
  followedPlan: !!row.followed_plan,
  rating: row.rating || 5,
  mistakes: row.mistakes || '',
  wentRight: row.went_right || '',
  entryWindow: row.entry_window || '',
  model: row.model || '',
  playbookId: row.playbook_id || null,
  chartLink: row.chart_link || '',
  positiveTags: row.positive_tags ? row.positive_tags.split(',').filter(t => t) : [],
  negativeTags: row.negative_tags ? row.negative_tags.split(',').filter(t => t) : [],
  account: row.account || '',
  be: !!row.be,
  win: (parseFloat(row.profit_loss) || 0) > 0
});

// MAP MISSED TRADES DB ROW TO REACT FORMAT
const mapMissedDBToReact = (row) => ({
  id: row.id,
  symbol: row.symbol,
  missedEntryPrice: parseFloat(row.missed_entry_price) || 0,
  missedExitPrice: parseFloat(row.missed_exit_price) || 0,
  predictedPnl: parseFloat(row.predicted_pnl) || 0,
  date: row.entry_time, 
  reason: row.reason || ''
});

// ==========================================
// AUTH ROUTES
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: result.insertId, email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PLAYBOOK ROUTES
// ==========================================
app.get('/api/playbooks', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM playbooks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/playbooks', verifyToken, async (req, res) => {
  const { name, timeframe, description, rules } = req.body;
  if (!name) return res.status(400).json({ error: 'Playbook name required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO playbooks (user_id, name, timeframe, description, rules) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, timeframe || '15m', description || '', rules || '']
    );
    const [rows] = await pool.query('SELECT * FROM playbooks WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/playbooks/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM playbooks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Playbook deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// TRADES ROUTES
// ==========================================
app.get('/api/trades', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trades WHERE user_id = ? ORDER BY entry_time DESC', [req.user.id]);
    res.json(rows.map(mapDBToReact));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trades', verifyToken, async (req, res) => {
  const {
    symbol, entryPrice, exitPrice, stopLoss, profitLoss, riskReward,
    entryTime, session, direction, followedPlan, rating, mistakes, wentRight,
    entryWindow, model, playbookId, chartLink, positiveTags, negativeTags, account, be
  } = req.body;

  const posTagsStr = Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || '');
  const negTagsStr = Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || '');

  let mysqlEntryTime;
  try { mysqlEntryTime = new Date(entryTime).toISOString().slice(0, 19).replace('T', ' '); } 
  catch (e) { mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' '); }

  try {
    const [result] = await pool.query(
      `INSERT INTO trades
      (symbol, entry_price, exit_price, stop_loss, profit_loss, risk_reward, entry_time, session,
       direction, followed_plan, rating, mistakes, went_right, entry_window, model, playbook_id, chart_link, 
       positive_tags, negative_tags, account, be, user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        symbol || 'UNKNOWN', entryPrice || 0, exitPrice || 0, stopLoss || 0, profitLoss || 0, riskReward || 0,
        mysqlEntryTime, session || '', direction || '', followedPlan ? 1 : 0, rating || 5, mistakes || '', wentRight || '',
        entryWindow || '', model || '', playbookId || null, chartLink || '', posTagsStr, negTagsStr, account || '', be ? 1 : 0, req.user.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [result.insertId]);
    res.json(mapDBToReact(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/trades/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM trades WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Trade not found' });
    res.json({ message: 'Trade deleted', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/trades/:id', verifyToken, async (req, res) => {
  const { symbol, entryPrice, exitPrice, stopLoss, profitLoss, riskReward, entryTime, session, direction, followedPlan, rating, mistakes, wentRight, entryWindow, model, playbookId, chartLink, positiveTags, negativeTags, account, be } = req.body;
  let mysqlEntryTime;
  try { mysqlEntryTime = new Date(entryTime).toISOString().slice(0, 19).replace('T', ' '); } catch (e) { mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' '); }
  try {
    await pool.query(
      `UPDATE trades SET symbol=?, entry_price=?, exit_price=?, stop_loss=?, profit_loss=?, risk_reward=?, entry_time=?, session=?, direction=?, followed_plan=?, rating=?, mistakes=?, went_right=?, entry_window=?, model=?, playbook_id=?, chart_link=?, positive_tags=?, negative_tags=?, account=?, be=? WHERE id=? AND user_id=?`,
      [symbol, entryPrice || 0, exitPrice || 0, stopLoss || 0, profitLoss || 0, riskReward || 0, mysqlEntryTime, session || '', direction || '', followedPlan ? 1 : 0, rating || 5, mistakes || '', wentRight || '', entryWindow || '', model || '', playbookId || null, chartLink || '', Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || ''), Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || ''), account || '', be ? 1 : 0, req.params.id, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Trade not found' });
    res.json(mapDBToReact(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MISSED TRADES ROUTES
// ==========================================
app.get('/api/missed-trades', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM missed_trades WHERE user_id = ? ORDER BY entry_time DESC', [req.user.id]);
    res.json(rows.map(mapMissedDBToReact));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/missed-trades', verifyToken, async (req, res) => {
  const { symbol, date, missedEntryPrice, missedExitPrice, predictedPnl, reason } = req.body;
  let mysqlEntryTime;
  try { mysqlEntryTime = new Date(date).toISOString().slice(0, 19).replace('T', ' '); } catch (e) { mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' '); }
  try {
    const [result] = await pool.query(
      `INSERT INTO missed_trades (symbol, missed_entry_price, missed_exit_price, predicted_pnl, entry_time, reason, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [symbol || 'UNKNOWN', missedEntryPrice || 0, missedExitPrice || 0, predictedPnl || 0, mysqlEntryTime, reason || 'Unknown', req.user.id]
    );
    const [newRow] = await pool.query('SELECT * FROM missed_trades WHERE id = ?', [result.insertId]);
    res.json(mapMissedDBToReact(newRow[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/missed-trades/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM missed_trades WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Missed trade not found' });
    res.json({ message: 'Missed trade deleted', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
});