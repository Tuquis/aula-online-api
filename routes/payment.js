const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.use(authenticateToken);
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Rota para webhook do Mercado Pago (não requer autenticação)
router.post('/webhook', paymentController.handleMercadoPagoWebhook);

// Rota para verificar status do pagamento
router.get('/status/:paymentId', paymentController.checkPaymentStatus);

module.exports = router;