const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendOrderConfirmation = async (customerEmail, totalAmount) => {
    const msg = {
        to: customerEmail,
        // IMPORTANT: This must be the email you verified in SendGrid
        from: 'dohmenj@gmail.com', 
        subject: "Thank you for your order from Bonnie's Sewing Shop!",
        text: `Hi! We received your order for $${totalAmount}. We will notify you when it ships!`,
        html: `<strong>Hi!</strong><p>We received your order for <strong>$${totalAmount}</strong>. Bonnie is getting her sewing machine ready!</p>`,
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Real email sent to ${customerEmail}`);
    } catch (error) {
        console.error('❌ SendGrid Error:', error.response ? error.response.body : error.message);
    }
};

const sendShippingConfirmation = async (customerEmail, orderId) => {
    const msg = {
        to: customerEmail,
        from: 'dohmenj@gmail.com', // Match your verified sender
        subject: `Your Bonnie's Sewing Shop Order (#${orderId}) has shipped!`,
        text: `Great news! Your handmade items are on the way.`,
        html: `<p>Great news! Your handmade items for order <strong>#${orderId}</strong> are on the way.</p>`,
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Shipping email sent to ${customerEmail}`);
    } catch (error) {
        console.error('❌ SendGrid Shipping Error:', error.response ? error.response.body : error.message);
    }
};

module.exports = { sendOrderConfirmation, sendShippingConfirmation };