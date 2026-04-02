const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * General authentication middleware.
 * Verifies JWT and fetches user from database.
 * Attaches user to req.user regardless of role.
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key_replace_me_in_production');
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  // Fetch user from database
  try {
    const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
    }

    const user = result.rows[0];
    req.user = user;
    next();
  } catch (dbErr) {
    console.error('Auth middleware DB error:', dbErr);
    return res.status(500).json({ success: false, message: 'Server error during authorization.' });
  }
};