const { Pool } = require('pg');
require('dotenv').config();

// The pool uses the URL from your .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection immediately
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('🐘 PostgreSQL connected successfully at:', res.rows[0].now);
  }
});

module.exports = pool;