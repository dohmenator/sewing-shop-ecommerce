const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');

// --- 1. POST: Create a checkout session ---
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;

        // Map frontend items to Stripe format
        const line_items = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    description: item.description,
                },
                unit_amount: Math.round(parseFloat(item.base_price) * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            // Pass metadata so the Webhook knows which Database IDs were purchased
            metadata: {
                cartItems: JSON.stringify(items.map(i => ({ 
                    id: i.id, 
                    quantity: i.quantity, 
                    price: i.base_price 
                })))
            },
            success_url: 'http://127.0.0.1:5500/frontend/success.html',
            cancel_url: 'http://127.0.0.1:5500/frontend/cancel.html',
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe Session Error:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// --- 2. POST: Stripe Webhook ---
// Note: index.js middleware handles the raw body parsing for this route
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        // We use req.rawBody which was attached in index.js
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Extract data for our database
        const customerEmail = session.customer_details.email;
        const totalAmount = session.amount_total / 100;
        const paymentIntentId = session.payment_intent;
        const cartItems = JSON.parse(session.metadata.cartItems);

        // Database Transaction: Ensure both tables update or neither does
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert Order
            const orderSql = `
                INSERT INTO orders (customer_email, total_amount, stripe_payment_intent_id, status)
                VALUES ($1, $2, $3, 'paid') 
                RETURNING id;
            `;
            const orderRes = await client.query(orderSql, [customerEmail, totalAmount, paymentIntentId]);
            const orderId = orderRes.rows[0].id;

            // Insert Order Items
            const itemSql = `
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                VALUES ($1, $2, $3, $4);
            `;
            
            for (const item of cartItems) {
                await client.query(itemSql, [orderId, item.id, item.quantity, item.price]);
            }

            await client.query('COMMIT');
            console.log(`✨ Success: Order ${orderId} recorded for ${customerEmail}`);
            
        } catch (dbErr) {
            await client.query('ROLLBACK');
            console.error('❌ Database Transaction Error:', dbErr);
        } finally {
            client.release();
        }
    }

    // Acknowledge receipt of the event
    res.json({ received: true });
});

module.exports = router;