import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'TRADING_JWT_SECRET_2024';

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

// Auto-create database tables
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(() => {});

pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id INT`).catch(() => {});

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
`).catch(() => {});

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
`).catch(() => {});

pool.query(`
  CREATE TABLE IF NOT EXISTS chart_gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    setup_name VARCHAR(100) DEFAULT '',
    date DATETIME NOT NULL,
    image_url LONGTEXT NOT NULL, 
    pnl DECIMAL(15,4) DEFAULT 0,
    mistakes TEXT,
    lessons TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  pool.query(`ALTER TABLE chart_gallery MODIFY COLUMN image_url LONGTEXT NOT NULL`).catch(() => {});
}).catch(() => {});

// 🟢 Pre-Market Prep Table
pool.query(`
  CREATE TABLE IF NOT EXISTS premarket_prep (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    bias VARCHAR(20) DEFAULT 'NEUTRAL',
    readiness_score INT DEFAULT 8,
    checklist TEXT,
    key_levels TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date)
  )
`).then(() => console.log('✅ Pre-Market Prep table ready')).catch(() => {});

async function updateTradesTable() {
  const queries = [
    "ALTER TABLE trades ADD COLUMN stop_loss DECIMAL(15,4) DEFAULT 0",
    "ALTER TABLE trades ADD COLUMN risk_reward DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE trades ADD COLUMN playbook_id INT DEFAULT NULL"
  ];
  for (let query of queries) {
    try { await pool.query(query); } catch (e) {}
  }
}
updateTradesTable();

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
  positiveTags: row.positive_tags ? row.positive_tags.split(',').filter(t => t) : [],
  negativeTags: row.negative_tags ? row.negative_tags.split(',').filter(t => t) : [],
  account: row.account || '',
  be: !!row.be,
  win: (parseFloat(row.profit_loss) || 0) > 0
});

const mapChartDBToReact = (row) => ({
  id: row.id, symbol: row.symbol, setupName: row.setup_name || '', date: row.date,
  imageUrl: row.image_url, pnl: parseFloat(row.pnl) || 0, mistakes: row.mistakes || '', lessons: row.lessons || ''
});

// AUTH
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

// PLAYBOOKS
app.get('/api/playbooks', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM playbooks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/playbooks', verifyToken, async (req, res) => {
  const { name, timeframe, description, rules } = req.body;
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
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// TRADES
app.get('/api/trades', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trades WHERE user_id = ? ORDER BY entry_time DESC', [req.user.id]);
    res.json(rows.map(mapDBToReact));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trades', verifyToken, async (req, res) => {
  const { symbol, entryPrice, exitPrice, stopLoss, profitLoss, riskReward, playbookId, entryTime, session, direction, followedPlan, rating, mistakes, wentRight, entryWindow, model, positiveTags, negativeTags, account, be } = req.body;
  let mysqlEntryTime;
  try { mysqlEntryTime = new Date(entryTime).toISOString().slice(0, 19).replace('T', ' '); } 
  catch (e) { mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' '); }

  try {
    const [result] = await pool.query(
      `INSERT INTO trades (symbol, entry_price, exit_price, stop_loss, profit_loss, risk_reward, playbook_id, entry_time, session, direction, followed_plan, rating, mistakes, went_right, entry_window, model, positive_tags, negative_tags, account, be, user_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [symbol || 'UNKNOWN', entryPrice || 0, exitPrice || 0, stopLoss || 0, profitLoss || 0, riskReward || 0, playbookId || null, mysqlEntryTime, session || '', direction || '', followedPlan ? 1 : 0, rating || 5, mistakes || '', wentRight || '', entryWindow || '', model || '', Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || ''), Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || ''), account || '', be ? 1 : 0, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [result.insertId]);
    res.json(mapDBToReact(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/trades/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM trades WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/trades/:id', verifyToken, async (req, res) => {
  const { symbol, entryPrice, exitPrice, stopLoss, profitLoss, riskReward, playbookId, entryTime, session, direction, followedPlan, rating, mistakes, wentRight, entryWindow, model, positiveTags, negativeTags, account, be } = req.body;
  let mysqlEntryTime;
  try { mysqlEntryTime = new Date(entryTime).toISOString().slice(0, 19).replace('T', ' '); } catch (e) { mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' '); }
  try {
    await pool.query(
      `UPDATE trades SET symbol=?, entry_price=?, exit_price=?, stop_loss=?, profit_loss=?, risk_reward=?, playbook_id=?, entry_time=?, session=?, direction=?, followed_plan=?, rating=?, mistakes=?, went_right=?, entry_window=?, model=?, positive_tags=?, negative_tags=?, account=?, be=? WHERE id=? AND user_id=?`,
      [symbol, entryPrice || 0, exitPrice || 0, stopLoss || 0, profitLoss || 0, riskReward || 0, playbookId || null, mysqlEntryTime, session || '', direction || '', followedPlan ? 1 : 0, rating || 5, mistakes || '', wentRight || '', entryWindow || '', model || '', Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || ''), Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || ''), account || '', be ? 1 : 0, req.params.id, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    res.json(mapDBToReact(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CHARTS
app.get('/api/charts', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM chart_gallery WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    res.json(rows.map(mapChartDBToReact));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/charts', verifyToken, async (req, res) => {
  const { symbol, setupName, date, imageUrl, pnl, mistakes, lessons } = req.body;
  let mysqlDate;
  try { mysqlDate = new Date(date).toISOString().slice(0, 19).replace('T', ' '); } catch (e) { mysqlDate = new Date().toISOString().slice(0, 19).replace('T', ' '); }
  try {
    const [result] = await pool.query(
      `INSERT INTO chart_gallery (user_id, symbol, setup_name, date, image_url, pnl, mistakes, lessons) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, symbol || 'UNKNOWN', setupName || '', mysqlDate, imageUrl, pnl || 0, mistakes || '', lessons || '']
    );
    const [newRow] = await pool.query('SELECT * FROM chart_gallery WHERE id = ?', [result.insertId]);
    res.json(mapChartDBToReact(newRow[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/charts/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM chart_gallery WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🟢 PRE-MARKET PREP ROUTES
app.get('/api/prep/:date', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM premarket_prep WHERE user_id = ? AND date = ?', [req.user.id, req.params.date]);
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/prep', verifyToken, async (req, res) => {
  const { date, bias, readiness_score, checklist, key_levels, notes } = req.body;
  try {
    await pool.query(
      `INSERT INTO premarket_prep (user_id, date, bias, readiness_score, checklist, key_levels, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE bias=?, readiness_score=?, checklist=?, key_levels=?, notes=?`,
      [
        req.user.id, date, bias, readiness_score, JSON.stringify(checklist), key_levels, notes,
        bias, readiness_score, JSON.stringify(checklist), key_levels, notes
      ]
    );
    res.json({ success: true, message: 'Saved successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
});