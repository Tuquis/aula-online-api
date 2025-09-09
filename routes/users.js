const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController'); // ← Importa o objeto

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// CORRETO: Passa as funções do controller
router.get('/profile', userController.getProfile);
router.get('/balance', userController.getBalance);
router.get('/teachers', userController.getTeachers);

module.exports = router;