const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// 📧 1. Refactored Order Confirmation with Item List
const sendOrderConfirmation = async (customerEmail, totalAmount, orderId, items) => {
    console.log(`DEBUG: Preparing email for Order #${orderId}. Items count: ${items ? items.length : 0}`);

    // 1. Build the Item List HTML
    let itemsHtml = '';
    if (items && Array.isArray(items)) {
        itemsHtml = items.map(item => {
            // 🔍 Handle the "undefined" by checking both possible name properties
            const productName = item.name || item.product_name || 'Handmade Item';

            return `
                <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                    ${item.quantity}x <strong>${productName}</strong> 
                    <span style="color: #666; font-size: 0.9em;">($${(item.price * item.quantity).toFixed(2)})</span>
                </li>
            `;
        }).join('');
    } else {
        itemsHtml = '<li>Item details currently processing...</li>';
    }

    const msg = {
        to: customerEmail,
        from: 'dohmenj@gmail.com',
        subject: `Order Confirmation #${orderId} - Bonnie's Sewing Shop`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #443; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #d81b60; text-align: center;">Thank you for your order!</h2>
                <p>Hi there,</p>
                <p>We've received your order <strong>#${orderId}</strong> and Bonnie is already getting her sewing machine ready!</p>
                
                <div style="background: #fdfaf7; padding: 20px; border: 1px dashed #d81b60; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #443;">Order Summary:</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${itemsHtml}
                    </ul>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
                    <p style="font-size: 1.2em; margin: 0;"><strong>Total Paid: $${parseFloat(totalAmount).toFixed(2)}</strong></p>
                </div>

                <p>Bonnie will send you another email as soon as your order has been completed and shipped via USPS.</p>
                <p>Warmly,<br>Bonnie's Sewing Shop</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                <p style="font-size: 0.8rem; color: #999; text-align: center;"><em>Handmade with love. Thank you for supporting small business!</em></p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Detailed email successfully sent to ${customerEmail}`);
    } catch (error) {
        console.error('❌ SendGrid Error:', error.message);
    }
};

// 📧 2. Refactored Shipping Confirmation (Reiterating items)
const sendShippingConfirmation = async (customerEmail, orderId, items = []) => {
    // 1. Build the Item List HTML
    const itemsListHtml = items.length > 0
        ? `
        <div style="background: #fdfaf7; padding: 15px; border: 1px dashed #2e7d32; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0; font-weight: bold; color: #2e7d32;">Your package includes:</p>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${items.map(i => `
                    <li style="padding: 5px 0; border-bottom: 1px solid #eee;">
                        ${i.quantity}x <strong>${i.product_name || i.name || 'Handmade Item'}</strong>
                    </li>
                `).join('')}
            </ul>
        </div>`
        : '';

    const msg = {
        to: customerEmail,
        from: 'dohmenj@gmail.com',
        subject: `Your order from Bonnie's Sewing Shop has shipped! (#${orderId})`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #443; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2e7d32; text-align: center;">Your order is on the way!</h2>
                <p>Great news!</p>
                <p>Bonnie has finished sewing the items for order <strong>#${orderId}</strong>, and your package is officially headed your way via USPS.</p>
                
                ${itemsListHtml}

                <p>We hope these handmade treasures bring a little extra joy to your home! Thank you so much for supporting Bonnie's craft.</p>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="http://127.0.0.1:5500/index.html" style="display: inline-block; background-color: #d81b60; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit the Shop</a>
                </div>

                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                <p style="font-size: 0.8rem; color: #999; text-align: center;"><em>Bonnie's Sewing Shop | Handmade with Love</em></p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Detailed shipping email sent to ${customerEmail}`);
    } catch (error) {
        console.error('❌ SendGrid Shipping Error:', error.message);
    }
};

module.exports = { sendOrderConfirmation, sendShippingConfirmation };