const db = require('../config/db');
const { sendOrderEmail } = require('../utils/sendEmail');

const ALLOWED_ORDER_STATUSES = ['pending', 'pending_payment', 'manual_payment', 'cash_on_delivery', 'payment_error', 'paid', 'shipped', 'delivered', 'cancelled'];

async function updateProductStock(client, items) {
  const colResult = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name IN ('stock','in_stock')");
  const hasStock = colResult.rows.some(r => r.column_name === 'stock');
  const hasInStock = colResult.rows.some(r => r.column_name === 'in_stock');

  for (const item of items) {
    const fields = [];
    if (hasStock) fields.push('stock');
    if (hasInStock) fields.push('in_stock');
    if (fields.length === 0) continue;

    const queryText = `SELECT ${fields.join(', ')} FROM products WHERE id = $1 FOR UPDATE`;
    const productRow = await client.query(queryText, [item.product_id]);
    if (!productRow.rows.length) continue;

    const product = productRow.rows[0];

    if (hasStock) {
      const currentStock = Number(product.stock || 0);
      const quantity = Number(item.quantity || 1);
      const newStock = Math.max(currentStock - quantity, 0);
      const newInStock = hasInStock ? newStock > 0 : true;
      if (hasInStock) {
        await client.query('UPDATE products SET stock = $1, in_stock = $2 WHERE id = $3', [newStock, newInStock, item.product_id]);
      } else {
        await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, item.product_id]);
      }
    } else if (hasInStock) {
      if (product.in_stock !== false) {
        await client.query('UPDATE products SET in_stock = false WHERE id = $1', [item.product_id]);
      }
    }
  }
}

const kapitalBankService = require('../services/kapitalBankService');

exports.createOrder = async (req, res) => {
  try {
    // ✅ Validate authentication
    if (!req.user || !req.user.id || !req.user.email) {
      console.error('[createOrder] Missing user authentication');
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication failed. Please log in again.' 
      });
    }

    console.log('[createOrder] Starting checkout for user:', req.user.id);
    console.log('[createOrder] payload received:', req.body);

    // ✅ Destructure and validate required fields
    const { name, surname, phone, address, items, total, payment_method } = req.body;

    // Validate required fields
    if (!name || !surname || !phone || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field(s). Please provide name, surname, phone, and address.' 
      });
    }

    // ✅ Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must contain at least one item.' 
      });
    }

    // Validate items have required properties
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id || item.quantity == null) {
        return res.status(400).json({ 
          success: false, 
          message: `Item ${i + 1} missing product_id or quantity.` 
        });
      }
    }

    // ✅ Validate total
    if (total == null || isNaN(Number(total))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid total amount.' 
      });
    }

    // ✅ Validate payment method
    const validPaymentMethods = ['card', 'kapital_card', 'cash_on_delivery', 'manual'];
    if (!payment_method || !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment method. Must be: card, cash_on_delivery, or manual.' 
      });
    }

    const isCardPayment = payment_method === 'card' || payment_method === 'kapital_card';
    const orderType = isCardPayment 
      ? 'pending_payment' 
      : payment_method === 'cash_on_delivery' 
        ? 'cash_on_delivery' 
        : 'manual_payment';
    const paymentStatus = 'pending';

    let client;
    let orderId;

    try {
      // Get database client from pool
      client = await db.getClient();
      console.log('[createOrder] Database client acquired');

      await client.query('BEGIN');


      console.log('[createOrder] Insert parameters:', {
        user_id: req.user.id,
        name, 
        surname, 
        phone, 
        email: req.user.email, 
        address, 
        items_count: items.length,
        total: Number(total),
        payment_method,
        status: orderType,
        payment_status: paymentStatus,
      });

      // ✅ Insert order into database
      const orderInsert = await client.query(
        `INSERT INTO orders (user_id, name, surname, phone, email, address, items, total, status, payment_method, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, items`,
        [
          req.user.id,                    // $1 user_id
          name,                           // $2 name
          surname,                        // $3 surname
          phone,                          // $4 phone
          req.user.email,                 // $5 email
          address,                        // $6 address
          JSON.stringify(items),          // $7 items (JSONB)
          Number(total),                  // $8 total
          orderType,                      // $9 status
          payment_method,                 // $10 payment_method
          paymentStatus,                  // $11 payment_status
        ]
      );

      // ✅ Validate insert result
      if (!orderInsert.rows || orderInsert.rows.length === 0) {
        throw new Error('Order insert failed - no rows returned');
      }

      orderId = orderInsert.rows[0].id;
      console.log('[createOrder] ✅ Order inserted successfully:', { orderId });

      // ✅ Update product stock if not card payment (card payment happens after callback)
      if (!isCardPayment) {
        console.log('[createOrder] Updating product stock for order:', orderId);
        try {
          await updateProductStock(client, items);
          console.log('[createOrder] ✅ Product stock updated');
        } catch (stockErr) {
          console.error('[createOrder] ⚠️ Stock update error (non-blocking):', stockErr.message);
          // Don't fail the order if stock update fails - this is non-critical
        }
      }

      await client.query('COMMIT');
      console.log('[createOrder] ✅ Transaction committed');

    } catch (dbErr) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          console.error('[createOrder] Rollback failed:', rollbackErr.message);
        }
      }

      console.error('[createOrder] ❌ Database error:', {
        code: dbErr.code,
        message: dbErr.message,
        detail: dbErr.detail,
        position: dbErr.position,
      });

      // ✅ Provide specific error messages
      if (dbErr.code === '42703') {
        // UNDEFINED_COLUMN
        return res.status(500).json({ 
          success: false, 
          message: 'Database schema error. Missing column: ' + (dbErr.detail || 'unknown'),
          action: 'Run: node server/src/config/migrate.js' 
        });
      }

      if (dbErr.code === '23502') {
        // NOT_NULL_VIOLATION
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required data: ' + (dbErr.detail || 'unknown field')
        });
      }

      if (dbErr.code === '23505') {
        // UNIQUE_VIOLATION
        return res.status(400).json({ 
          success: false, 
          message: 'Data already exists: ' + (dbErr.detail || 'duplicate entry')
        });
      }

      return res.status(500).json({ 
        success: false, 
        message: `Database error: ${dbErr.code || dbErr.message}`,
        detail: process.env.NODE_ENV === 'development' ? dbErr.detail : undefined,
      });

    } finally {
      if (client) {
        client.release();
        console.log('[createOrder] Database client released');
      }
    }

    // ✅ Send order confirmation email (non-blocking)
    try {
      console.log('[createOrder] Sending confirmation email to:', req.user.email);
      await sendOrderEmail({
        id: orderId,
        name,
        surname,
        phone,
        email: req.user.email,
        address,
        total,
        items,
      });
      console.log('[createOrder] ✅ Email sent');
    } catch (emailErr) {
      console.error('[createOrder] ⚠️ Email sending failed (non-blocking):', emailErr.message);
      // Don't fail the order if email fails
    }

    // ✅ Build response object (order already inserted, so this is just data formatting)
    let createdOrder = {
      id: orderId,
      name,
      surname,
      email: req.user.email,
      phone,
      address,
      items: items,
      total: Number(total) || 0,
      status: orderType,
      payment_method: payment_method,
      payment_status: 'pending',
    };

    console.log('[createOrder] ✅ Order response prepared:', { 
      orderId, 
      status: orderType, 
      total: createdOrder.total 
    });

    // ✅ Handle card payment
    if (isCardPayment) {
      try {
        console.log('[createOrder] Processing card payment for order:', orderId);
        const frontendBase = process.env.CLIENT_URL || 'http://localhost:8081';
        const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/order/kapital/callback`;
        const successUrl = `${frontendBase}/payment-result?status=success&orderId=${orderId}`;
        const failureUrl = `${frontendBase}/payment-result?status=failure&orderId=${orderId}`;

        const result = await kapitalBankService.createPaymentSession({
          orderId,
          amount: Number(total).toFixed(2),
          currency: 'AZN',
          description: `Order #${orderId}`,
          customer: { name, surname, email: req.user.email, phone },
          successUrl,
          failUrl: failureUrl,
          callbackUrl,
        });

        console.log('[createOrder] ✅ Payment session created, redirecting to:', result.redirectUrl ? 'payment gateway' : 'unknown');
        return res.status(200).json({ success: true, order: createdOrder, url: result.redirectUrl });

      } catch (paymentErr) {
        console.error('[createOrder] ❌ Payment initialization failed:', paymentErr.message);
        
        // Mark order as payment error
        try {
          await db.query(
            'UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3', 
            ['payment_error', 'failed', orderId]
          );
        } catch (updateErr) {
          console.error('[createOrder] Failed to update order status to payment_error:', updateErr.message);
        }

        return res.status(502).json({ 
          success: false, 
          message: 'Payment gateway not available. Your order has been created but payment setup failed. Please contact support.' 
        });
      }
    }

    // ✅ Return success for non-card payments
    console.log('[createOrder] ✅ Order created successfully (non-card payment):', orderId);
    return res.status(200).json({ 
      success: true, 
      order: createdOrder, 
      message: 'Order created successfully. We will contact you shortly.' 
    });

  } catch (error) {
    console.error('[createOrder] ❌ Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during order creation. Please try again or contact support.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.kapitalCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    if (!kapitalBankService.verifyCallbackSignature(callbackData)) {
      return res.status(400).json({ success: false, message: 'Invalid callback signature.' });
    }

    const { order_id, transaction_id, amount, currency, status } = callbackData;
    const orderId = Number(order_id);

    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!orderResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    if (status === 'success' || status === 'approved' || status === 'paid') {
      await db.query(
        'UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3',
        ['paid', 'paid', orderId]
      );

      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        // ✅ order.items is already a JavaScript object (JSONB from DB), don't parse it
        const items = Array.isArray(order.items) ? order.items : [];
        if (items.length > 0) {
          await updateProductStock(client, items);
        }
        await client.query('COMMIT');
      } catch (stockErr) {
        await client.query('ROLLBACK');
        console.error('Stock update failed after payment success for order', orderId, stockErr);
      } finally {
        client.release();
      }

      return res.status(200).json({ success: true, message: 'Payment confirmed and order set to paid.' });
    }

    const failedStatus = status === 'cancelled' ? 'cancelled' : 'failed';
    await db.query('UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3', [failedStatus, 'failed', orderId]);
    return res.status(200).json({ success: true, message: `Payment status set to ${failedStatus}.` });
  } catch (error) {
    console.error('Kapital callback error:', error);
    return res.status(500).json({ success: false, message: 'Callback processing failed.' });
  }
};

exports.kapitalReturn = async (req, res) => {
  try {
    const { order_id, status, signature } = req.query;
    const parsed = { order_id, status, amount: req.query.amount, currency: req.query.currency, signature };

    if (!kapitalBankService.verifyCallbackSignature(parsed)) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8081'}/payment-result?status=invalid_signature`);
    }

    const success = status === 'success' || status === 'paid' || status === 'approved';
    const returnStatus = success ? 'success' : 'failure';
    const a = order_id ? `&orderId=${order_id}` : '';

    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8081'}/payment-result?status=${returnStatus}${a}`);
  } catch (error) {
    console.error('Kapital return URL handling error:', error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8081'}/payment-result?status=error`);
  }
};

exports.verifyOrder = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID required.' });
    }

    const result = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = result.rows[0];

    // Check authorization: user must own the order or be admin
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: you can only view/update your own orders.' });
    }

    if (status && ALLOWED_ORDER_STATUSES.includes(status)) {
      await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
      return res.status(200).json({ success: true, orderId, status });
    }

    return res.status(200).json({ success: true, orderId, status: order.status });
  } catch (error) {
    console.error('Verify order error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const ordersResult = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    const normalizedOrders = ordersResult.rows.map((order) => ({
      ...order,
      items: Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]'),
      total: Number(order.total) || 0,
    }));
    return res.json({ success: true, orders: normalizedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !ALLOWED_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const result = await db.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, message: 'Status updated', order: result.rows[0] });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
