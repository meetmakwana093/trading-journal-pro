import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONNECT TO MYSQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'meet@5207',
  database: 'trade_journal',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(() => console.log('✅ Successfully connected to MySQL database!'))
  .catch(err => console.error('❌ Database connection error', err.stack));

// 2. GET ALL TRADES
app.get('/api/trades', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trades ORDER BY entry_time DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST A NEW TRADE
app.post('/api/trades', async (req, res) => {
  const {
    symbol, entryPrice, exitPrice, profitLoss,
    entryTime, session, direction, followedPlan,
    rating, mistakes, wentRight,
    entryWindow, model, positiveTags, negativeTags, account, be
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO trades
      (symbol, entry_price, exit_price, profit_loss, entry_time, session,
       direction, followed_plan, rating, mistakes, went_right,
       entry_window, model, positive_tags, negative_tags, account, be)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        symbol, entryPrice, exitPrice, profitLoss,
        entryTime, session, direction, followedPlan,
        rating, mistakes, wentRight,
        entryWindow, model,
        Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || ''),
        Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || ''),
        account, be
      ]
    );
    const insertId = result.insertId;
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [insertId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE A TRADE
app.delete('/api/trades/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM trades WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    // For delete, we could return the deleted object, but we don't have it.
    // We'll fetch before delete if needed; for simplicity return success.
    res.json({ message: 'Trade deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. UPDATE A TRADE
app.put('/api/trades/:id', async (req, res) => {
  const {
    symbol, entryPrice, exitPrice, profitLoss,
    entryTime, session, direction, followedPlan,
    rating, mistakes, wentRight,
    entryWindow, model, positiveTags, negativeTags, account, be
  } = req.body;

  try {
    await pool.query(
      `UPDATE trades SET
        symbol=?, entry_price=?, exit_price=?, profit_loss=?,
        entry_time=?, session=?, direction=?, followed_plan=?,
        rating=?, mistakes=?, went_right=?,
        entry_window=?, model=?, positive_tags=?,
        negative_tags=?, account=?, be=?
      WHERE id=?`,
      [
        symbol, entryPrice, exitPrice, profitLoss,
        entryTime, session, direction, followedPlan,
        rating, mistakes, wentRight,
        entryWindow, model,
        Array.isArray(positiveTags) ? positiveTags.join(',') : (positiveTags || ''),
        Array.isArray(negativeTags) ? negativeTags.join(',') : (negativeTags || ''),
        account, be, req.params.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});