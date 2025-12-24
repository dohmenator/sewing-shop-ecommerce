const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // This is the database connection we set up earlier

// GET: Fetch all products with their category names
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.name, p.description, p.base_price, c.name AS category, p.metadata
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY p.id ASC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Server error while fetching products' });
    }
});

module.exports = router;