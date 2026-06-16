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

// CREATE TABLES IF NOT EXIST
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
`).then(() => console.log('✅ user_id column ready'))
  .catch(() => console.log('ℹ️ user_id column already exists'));

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
  profitLoss: parseFloat(row.profit_loss) || 0,
  entryTime: row.entry_time,
  session: row.session || '',
  direction: row.direction || '',
  followedPlan: !!row.followed_plan,
  rating: row.rating || 5,
  mistakes: row.mistakes || '',
  wentRight: row.went_right || '',
  entryWindow: row.entry_window || '',
  model: row.model || '',
  positiveTags: row.positive_tags ? row.positive_tags.split(',').filter(t => t) : [],
  negativeTags: row.negative_tags ? row.negative_tags.split(',').filter(t => t) : [],
  account: row.account || '',
  be: !!row.be,
  win: (parseFloat(row.profit_loss) || 0) > 0
});

// ==========================================
// AUTH ROUTES
// ==========================================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: result.insertId, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// TRADES ROUTES (ALL PROTECTED)
// ==========================================

// GET ALL TRADES
app.get('/api/trades', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM trades WHERE user_id = ? ORDER BY entry_time DESC',
      [req.user.id]
    );
    res.json(rows.map(mapDBToReact));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST NEW TRADE
app.post('/api/trades', verifyToken, async (req, res) => {
  const {
    symbol, entryPrice, exitPrice, profitLoss,
    entryTime, session, direction, followedPlan,
    rating, mistakes, wentRight,
    entryWindow, model, positiveTags, negativeTags, account, be
  } = req.body;

  const posTagsStr = Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || '');
  const negTagsStr = Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || '');

  let mysqlEntryTime;
  try {
    mysqlEntryTime = new Date(entryTime).toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO trades
      (symbol, entry_price, exit_price, profit_loss, entry_time, session,
       direction, followed_plan, rating, mistakes, went_right,
       entry_window, model, positive_tags, negative_tags, account, be, user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        symbol || 'UNKNOWN',
        entryPrice || 0,
        exitPrice || 0,
        profitLoss || 0,
        mysqlEntryTime,
        session || '',
        direction || '',
        followedPlan ? 1 : 0,
        rating || 5,
        mistakes || '',
        wentRight || '',
        entryWindow || '',
        model || '',
        posTagsStr,
        negTagsStr,
        account || '',
        be ? 1 : 0,
        req.user.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [result.insertId]);
    res.json(mapDBToReact(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE TRADE
app.delete('/api/trades/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM trades WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json({ message: 'Trade deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE TRADE
app.put('/api/trades/:id', verifyToken, async (req, res) => {
  const {
    symbol, entryPrice, exitPrice, profitLoss,
    entryTime, session, direction, followedPlan,
    rating, mistakes, wentRight,
    entryWindow, model, positiveTags, negativeTags, account, be
  } = req.body;

  let mysqlEntryTime;
  try {
    mysqlEntryTime = new Date(entryTime).toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    mysqlEntryTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  try {
    await pool.query(
      `UPDATE trades SET
        symbol=?, entry_price=?, exit_price=?, profit_loss=?,
        entry_time=?, session=?, direction=?, followed_plan=?,
        rating=?, mistakes=?, went_right=?,
        entry_window=?, model=?, positive_tags=?,
        negative_tags=?, account=?, be=?
      WHERE id=? AND user_id=?`,
      [
        symbol, entryPrice || 0, exitPrice || 0, profitLoss || 0,
        mysqlEntryTime, session || '', direction || '',
        followedPlan ? 1 : 0, rating || 5,
        mistakes || '', wentRight || '',
        entryWindow || '', model || '',
        Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || ''),
        Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || ''),
        account || '', be ? 1 : 0,
        req.params.id, req.user.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Trade not found' });
    res.json(mapDBToReact(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
});