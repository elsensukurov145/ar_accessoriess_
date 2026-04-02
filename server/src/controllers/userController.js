const db = require('../config/db');

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, surname, email, phone, address, items, total, status, payment_method, payment_status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    const orders = result.rows.map((order) => ({
      ...order,
      items: Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]'),
      total: Number(order.total) || 0,
    }));

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
