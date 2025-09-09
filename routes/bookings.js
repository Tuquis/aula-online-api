const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController'); // ← Importa o objeto

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// CORRETO: Passa as funções do controller
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getUserBookings);

module.exports = router;