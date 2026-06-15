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
  password: 'meet@5207',
  port: 5432,
});
 
pool.connect()
  .then(() => console.log('✅ Successfully connected to PostgreSQL database!'))
  .catch(err => console.error('❌ Database connection error', err.stack));
 
// 2. GET ALL TRADES
app.get('/api/trades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY entry_time DESC');
    res.json(result.rows);
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
    const result = await pool.query(
      `INSERT INTO trades
      (symbol, entry_price, exit_price, profit_loss, entry_time, session,
       direction, followed_plan, rating, mistakes, went_right,
       entry_window, model, positive_tags, negative_tags, account, be)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
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
  const {
    symbol, entryPrice, exitPrice, profitLoss,
    entryTime, session, direction, followedPlan,
    rating, mistakes, wentRight,
    entryWindow, model, positiveTags, negativeTags, account, be
  } = req.body;
 
  try {
    const result = await pool.query(
      `UPDATE trades SET
        symbol=$1, entry_price=$2, exit_price=$3, profit_loss=$4,
        entry_time=$5, session=$6, direction=$7, followed_plan=$8,
        rating=$9, mistakes=$10, went_right=$11,
        entry_window=$12, model=$13, positive_tags=$14,
        negative_tags=$15, account=$16, be=$17
      WHERE id=$18 RETURNING *`,
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