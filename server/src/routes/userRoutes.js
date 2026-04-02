const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const generalAuthMiddleware = require('../middleware/generalAuthMiddleware');

// Protected routes - require authentication
router.get('/profile', generalAuthMiddleware, userController.getUserProfile);
router.get('/orders', generalAuthMiddleware, userController.getUserOrders);

module.exports = router;
