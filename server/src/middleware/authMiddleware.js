const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Real authentication + admin role middleware.
 * 1. Extracts and verifies the JWT from the Authorization header.
 * 2. Fetches the user row from the database to confirm they exist and have role = 'admin'.
 * 3. Attaches the full DB user object to req.user and calls next().
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

  // --- Database role check ---
  try {
    const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
    }

    const user = result.rows[0];

    // Check if user has admin role (role must be set in database, not hardcoded)
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: admin role required.' });
    }

    req.user = user;
    next();
  } catch (dbErr) {
    console.error('Auth middleware DB error:', dbErr);
    return res.status(500).json({ success: false, message: 'Server error during authorization.' });
  }
};
