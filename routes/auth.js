const express = require('express');
const { validateRegister } = require('../middleware/validation');
const authController = require('../controllers/authController'); // ← Importa o objeto

const router = express.Router();

// CORRETO: Passa a função do controller
router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);

module.exports = router;