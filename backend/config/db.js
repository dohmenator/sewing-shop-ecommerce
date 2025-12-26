const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 1. One-time Startup Test (Keep this!)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('🐘 PostgreSQL connected successfully at:', res.rows[0].now);
  }
});

// 2. Background Error Listener (Add this for long-term stability)
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  // Optional: process.exit(-1); 
});

module.exports = pool;