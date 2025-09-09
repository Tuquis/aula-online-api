const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const packageController = require('../controllers/packageController'); // ← Importa o objeto

const router = express.Router();

// GET /api/packages (público) - CORRETO: passa a função
router.get('/', packageController.getPackages);

// Rotas autenticadas
router.use(authenticateToken);

// CORRETO: Passa a função do controller
router.post('/purchase', packageController.purchasePackage);

module.exports = router;