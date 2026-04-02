const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function formatItems(items) {
  if (!items) return '';
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;
  if (!Array.isArray(parsed)) return '';

  return parsed
    .map((item) => {
      const title = item.title || item.name || item.product_name || 'Item';
      const quantity = item.quantity || item.qty || 1;
      return `<li>${title} x ${quantity}</li>`;
    })
    .join('');
}

async function sendOrderEmail(order) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured; skipping sendOrderEmail');
    return;
  }

  // Send confirmation email to customer
  const customerMailOptions = {
    from: process.env.EMAIL_USER,
    to: order.email || 'noreply@araccessories.com',
    subject: `Order Confirmation (#${order.id})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order! Here are your order details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Name:</strong> ${order.name} ${order.surname}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Delivery Address:</strong> ${order.address}</p>
        <p><strong>Total:</strong> ${order.total} AZN</p>
        <h3>Products:</h3>
        <ul>${formatItems(order.items)}</ul>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          We will send you a notification when your order ships. Thank you for your purchase!
        </p>
      </div>
    `,
  };

  // Send admin notification
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to the configured admin email
    subject: `New Order Received (#${order.id})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2>New order received:</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Name:</strong> ${order.name} ${order.surname}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Email:</strong> ${order.email || 'n/a'}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Total:</strong> ${order.total} AZN</p>
        <h3>Products:</h3>
        <ul>${formatItems(order.items)}</ul>
      </div>
    `,
  };

  try {
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);
  } catch (error) {
    console.error('Error sending order emails:', error);
    // Don't throw - email is not critical to order creation
  }
}

module.exports = { sendOrderEmail };
