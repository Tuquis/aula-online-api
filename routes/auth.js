const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ ROTAS SIMPLIFICADAS - sem middlewares por enquanto
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/resend-verification', authController.resendVerification);

module.exports = router;