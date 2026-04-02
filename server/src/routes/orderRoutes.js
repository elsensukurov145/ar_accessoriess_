const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const generalAuthMiddleware = require('../middleware/generalAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', generalAuthMiddleware, orderController.createOrder);
router.post('/verify', generalAuthMiddleware, orderController.verifyOrder);

// Kapital Bank payment callbacks
router.post('/kapital/callback', orderController.kapitalCallback);
router.get('/kapital/return', orderController.kapitalReturn);

// Protected Admin Routes
router.get('/', authMiddleware, orderController.getOrders);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
