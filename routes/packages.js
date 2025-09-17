// routes/packages.js
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken } = require('../middleware/auth');

// DEBUG: Verifique o packageController
console.log('=== DEBUG PACKAGE CONTROLLER ===');
console.log('Tipo do packageController:', typeof packageController);
console.log('getPackages function:', typeof packageController?.getPackages);
console.log('purchasePackage function:', typeof packageController?.purchasePackage);
console.log('Todas as chaves:', Object.keys(packageController || {}));
console.log('===============================');

// Se alguma função for undefined, pare a execução
if (typeof packageController.getPackages !== 'function') {
  console.error('❌ ERRO: packageController.getPackages não é uma função');
  process.exit(1);
}

// Rotas públicas
router.get('/', packageController.getPackages);

// Rotas autenticadas
router.use(authenticateToken);
router.post('/purchase', packageController.purchasePackage);

module.exports = router;