const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // This is the database connection we set up earlier

// GET: Fetch all products with their category names
// Inside backend/routes/productRoutes.js
router.get('/', async (req, res) => {
    try {
        // Change this line if it lists specific columns
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC'); 
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching products" });
    }
});

module.exports = router;