const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');

// POST: Create a checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { productId } = req.body;

    // 1. Look up the product in your PostgreSQL database
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = productResult.rows[0];

    // Safety check: What if the ID doesn't exist?
    if (!product) {
      return res.status(404).json({ error: "Product not found in database" });
    }

    // 2. Create the Stripe session using data from the database
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: product.name,           // Real name from DB
              description: product.description 
            },
            // Stripe wants cents (integers). 
            // Number() ensures base_price isn't treated as a string.
            unit_amount: Math.round(Number(product.base_price) * 100), 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success.html`,
      cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;