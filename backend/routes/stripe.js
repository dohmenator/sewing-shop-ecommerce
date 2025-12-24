const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');

// POST: Create a checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body; // This is the 'cart' array from your frontend

        // Map the cart items into the format Stripe requires
        const line_items = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    description: item.description,
                    // Note: Stripe prefers images as absolute URLs. 
                    // Since we are on localhost, we'll skip images here 
                    // or use a placeholder for now.
                },
                unit_amount: Math.round(parseFloat(item.base_price) * 100), // Stripe uses cents
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: line_items,
          mode: 'payment',
          // Update these to match your actual frontend URL
          success_url: 'http://127.0.0.1:5500/frontend/success.html', 
          cancel_url: 'http://127.0.0.1:5500/frontend/cancel.html',
      });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;