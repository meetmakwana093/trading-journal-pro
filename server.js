import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONNECT TO POSTGRESQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'trade_journal',
  password: 'meet@5207', // <-- Put your DB password here
  port: 5432,
});
// Test the connection
pool.connect()
  .then(() => console.log('✅ Successfully connected to PostgreSQL database!'))
  .catch(err => console.error('❌ Database connection error', err.stack));

// 2. GET ALL TRADES (Send data to React)
app.get('/api/trades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY entry_time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST A NEW TRADE (Receive data from React)
app.post('/api/trades', async (req, res) => {
  const { symbol, entryPrice, exitPrice, profitLoss, entryTime, session, direction, followedPlan, rating, mistakes, wentRight } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO trades
      (symbol, entry_price, exit_price, profit_loss, entry_time, session, direction, followed_plan, rating, mistakes, went_right)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [symbol, entryPrice, exitPrice, profitLoss, entryTime, session, direction, followedPlan, rating, mistakes, wentRight]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE A TRADE
app.delete('/api/trades/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trades WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. UPDATE A TRADE
app.put('/api/trades/:id', async (req, res) => {
  const { symbol, entryPrice, exitPrice, profitLoss, entryTime, session, direction, followedPlan, rating, mistakes, wentRight } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trades
      SET symbol = $1, entry_price = $2, exit_price = $3, profit_loss = $4, entry_time = $5, session = $6, direction = $7, followed_plan = $8, rating = $9, mistakes = $10, went_right = $11
      WHERE id = $12
      RETURNING *`,
      [symbol, entryPrice, exitPrice, profitLoss, entryTime, session, direction, followedPlan, rating, mistakes, wentRight, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});