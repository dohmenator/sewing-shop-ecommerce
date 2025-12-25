const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');
// const { sendOrderConfirmation } = require('../utils/email');
const { sendOrderConfirmation, sendShippingConfirmation } = require('../utils/email');

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

            // 1. Insert Order
            const orderSql = `
                INSERT INTO orders (customer_email, total_amount, stripe_payment_intent_id, status)
                VALUES ($1, $2, $3, 'paid') 
                RETURNING id;
            `;
            const orderRes = await client.query(orderSql, [customerEmail, totalAmount, paymentIntentId]);
            const orderId = orderRes.rows[0].id; // We use orderId now, not newOrder.id

            // 2. Insert Order Items
            const itemSql = `
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                VALUES ($1, $2, $3, $4);
            `;
            
            for (const item of cartItems) {
                await client.query(itemSql, [orderId, item.id, item.quantity, item.price]);
            }

            await client.query('COMMIT');
            
            // This is your primary success log!
            console.log(`✨ Success: Order ${orderId} recorded for ${customerEmail}`);

            // 3. Trigger the email 
            await sendOrderConfirmation(customerEmail, totalAmount);
            
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

// --- 3. GET: Fetch all orders for the Admin Dashboard ---
router.get('/orders', async (req, res) => {
    try {
        // This query gets the order details and aggregates the items into a list
        const result = await pool.query(`
            SELECT 
                o.id, 
                o.customer_email, 
                o.total_amount, 
                o.status, 
                o.created_at,
                json_agg(json_build_object(
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'price', oi.price_at_purchase
                )) AS items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY o.created_at DESC;
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// --- 4. PATCH: Update order status (Mark as Shipped) ---
router.patch('/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        // --- NEW: If the status changed to 'shipped', trigger the mock email ---
        if (status === 'shipped') {
            const customerEmail = result.rows[0].customer_email;
            await sendShippingConfirmation(customerEmail, id);
            console.log(`📦 Shipping notification triggered for Order #${id}`);
        }

        res.json({ 
            message: "Status updated successfully", 
            order: result.rows[0] 
        });
        
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;