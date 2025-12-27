const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

// --- 1. Multer Configuration (For Image Uploads) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // This creates an absolute path regardless of where you start the node command
        const uploadPath = path.join(__dirname, '../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- 2. GET: Fetch all products with Category Dimensions ---
router.get('/', async (req, res) => {
    try {
        // We select everything from products (p.*) 
        // and specifically the name and description from categories (c)
        const query = `
            SELECT 
                p.*, 
                c.name AS category_name, 
                c.description AS category_dimensions
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY p.id ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching products with categories:", err.message);
        res.status(500).json({ error: "Server error fetching products" });
    }
});

// GET: Fetch all categories for the dropdown
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error fetching categories" });
    }
});

// --- 3. POST: Add a new product (Admin Only) ---
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, category_id } = req.body;
        if (!req.file) return res.status(400).json({ error: "No image uploaded." });

        const imageUrl = `/uploads/${req.file.filename}`;
        let finalCategoryId;

        // 1. Handle Category
        if (isNaN(category_id)) {
            const newCatResult = await pool.query(
                'INSERT INTO categories (name) VALUES ($1) RETURNING id',
                [category_id]
            );
            finalCategoryId = newCatResult.rows[0].id;
        } else {
            finalCategoryId = parseInt(category_id);
        }

        console.log("🟢 Attempting Product Insert with:", { name, price, finalCategoryId });

        // 2. The Insert with Type Casting
        // We use parseFloat(price) to ensure the DB receives a number, not a string
        const result = await pool.query(
            'INSERT INTO products (name, description, price, category_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, parseFloat(price), finalCategoryId, imageUrl]
        );

        console.log("✨ Product Saved to DB!");

        return res.status(201).json({
            message: "✨ Product added successfully!",
            product: result.rows[0]
        });

    } catch (err) {
        // THIS LOG IS CRITICAL - Look at your terminal window!
        console.error("🔴 DATABASE ERROR:", err.message);
        console.error("🔴 ERROR DETAIL:", err.detail); // Shows which constraint failed

        return res.status(500).json({
            error: "Database failure",
            message: err.message
        });
    }
});

module.exports = router;