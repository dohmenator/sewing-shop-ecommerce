const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Check if the user exists
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];

        // 2. Use bcrypt to compare the plain text password with the hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 3. Password is correct! Create a JWT "VIP Pass"
        // We embed her ID and username so the frontend knows who she is
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '4h' } // Bonnie stays logged in for 4 hours
        );

        console.log(`🔑 Login successful for: ${username}`);
        res.json({ token });

    } catch (err) {
        console.error('❌ Login Error:', err.message);
        res.status(500).json({ error: "Server error during login" });
    }
});

module.exports = router;