const sgMail = require('@sendgrid/mail');
// We will set the API key later when SendGrid behaves
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOrderConfirmation = async (customerEmail, totalAmount) => {   
    const msg = {
        to: customerEmail,
        from: 'orders@bonnieshop.com', 
        subject: "Thank you for your order from Bonnie's Sewing Shop!",
        // 2. We use 'totalAmount' here (REMOVE orderDetails.total)
        text: `Hi! We received your order for $${totalAmount}. We will notify you when it ships!`,
        html: `<strong>Hi!</strong><p>We received your order for <strong>$${totalAmount}</strong>. Bonnie is getting her sewing machine ready!</p>`,
    };

    // ... (rest of your mock/send logic)
    // MOCK LOGIC: If no API key, just log it
    if (!process.env.SENDGRID_API_KEY) {
        console.log("--- MOCK EMAIL SENT ---");
        console.log("To:", msg.to);
        console.log("Subject:", msg.subject);
        console.log("Body:", msg.text);
        console.log("-----------------------");
        return;
    }

    try {
        await sgMail.send(msg);
        console.log('Real email sent via SendGrid');
    } catch (error) {
        console.error('Email failed to send:', error);
    }
};

// Add this new function below your sendOrderConfirmation function
const sendShippingConfirmation = async (customerEmail, orderId) => {
    const msg = {
        to: customerEmail,
        from: 'orders@bonnieshop.com',
        subject: `Your order #${orderId} has shipped!`,
        text: `Great news! Bonnie has finished your handmade items and they are on their way.`,
    };

    console.log("\n--- 📦 MOCK SHIPPING EMAIL SENT ---");
    console.log("To:", msg.to);
    console.log("Subject:", msg.subject);
    console.log("Body:", msg.text);
    console.log("----------------------------------\n");
};

// IMPORTANT: Update your exports at the very bottom to include BOTH
module.exports = { sendOrderConfirmation, sendShippingConfirmation };
