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


//get all products from products table that are active (active as bonnie wants these rendered)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*, 
                c.name AS category_name, 
                c.description AS category_dimensions
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
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

// DELETE a product (well just making it inactive so it does not render)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Instead of deleting, we set is_active to false
        const result = await pool.query(
            'UPDATE products SET is_active = false WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ message: "Product archived successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// --- PUT: Update an existing product ---
router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, description, category_id } = req.body;

    try {
        // 1. If no new file, we need the existing image URL so we don't overwrite it with null
        let imageUrl;

        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        } else {
            // Fetch existing product to get current image_url
            const currentProduct = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
            imageUrl = currentProduct.rows[0].image_url;
        }

        const query = `
            UPDATE products 
            SET name = $1, price = $2, description = $3, category_id = $4, image_url = $5
            WHERE id = $6
            RETURNING *;
        `;

        const result = await pool.query(query, [name, price, description, category_id, imageUrl, id]);
        res.json({ message: "Updated!", product: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});


module.exports = router;