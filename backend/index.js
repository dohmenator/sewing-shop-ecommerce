require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Initialize stripe with the key from your .env
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const productRoutes = require('./routes/productRoutes');
const db = require('./config/db');

const app = express();

// 1. Middleware (Must come before routes)
app.use(express.json());
app.use(cors());

// 2. Import and Use Routes
const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe', stripeRoutes);
app.use('/api/products', productRoutes);

// 3. Basic Health Check Route
app.get('/', (req, res) => {
    res.send('Sewing Shop Backend is running!');
});

// 4. Test Route to verify .env loading
app.get('/test-setup', (req, res) => {
    const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;
    const port = process.env.PORT || 5000;
    
    res.json({
        status: "Server Active",
        port: port,
        stripe_ready: isStripeConfigured,
        message: isStripeConfigured 
            ? "Stripe Key detected successfully." 
            : "Stripe Key missing in .env file!"
    });
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    ✅ Server is live on http://localhost:${PORT}
    🚀 Test your setup at: http://localhost:${PORT}/test-setup
    `);
});