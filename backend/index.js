require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Routes
const stripeRoutes = require('./routes/stripe');
const productRoutes = require('./routes/productRoutes');

const app = express();

// 1. Middleware
app.use(cors());

// Special Middleware for Stripe: Grab the RAW body only for the webhook route
app.use(
    express.json({
        verify: (req, res, buf) => {
            if (req.originalUrl.startsWith('/api/stripe/webhook')) {
                req.rawBody = buf; // We save the raw buffer here
            }
        },
    })
);

// 2. Use Routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/products', productRoutes);

// 3. Health Check Routes
app.get('/', (req, res) => {
    res.send('Sewing Shop Backend is running!');
});

app.get('/test-setup', (req, res) => {
    res.json({
        status: "Server Active",
        port: process.env.PORT || 5000,
        stripe_ready: !!process.env.STRIPE_SECRET_KEY,
        db_url_detected: !!process.env.DATABASE_URL
    });
});

// 4. Global Error Handler (Best Practice)
// This catches any errors that happen in your routes so the server doesn't crash
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on our end!');
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    ✅ Server is live on http://localhost:${PORT}
    🚀 Test your setup at: http://localhost:${PORT}/test-setup
    `);
});