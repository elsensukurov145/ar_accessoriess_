const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const generalAuthMiddleware = require('../middleware/generalAuthMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', generalAuthMiddleware, authController.verify);

module.exports = router;
