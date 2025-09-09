const express = require('express');
const webhookController = require('../controllers/webhookController'); // ← Importa o objeto

const router = express.Router();

// Se tiver webhooks, também corrige aqui
// router.post('/calendly', webhookController.handleCalendlyWebhook);

module.exports = router;