const rateLimit = require('express-rate-limit');

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    error: 'Muitas requisições, tente novamente em 15 minutos'
  }
});

// Rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: {
    error: 'Muitas tentativas de login, tente novamente em 15 minutos'
  }
});

// Rate limiting para endpoints sensíveis
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 requisições por IP
  message: {
    error: 'Muitas requisições, tente novamente em 1 hora'
  }
});

module.exports = { generalLimiter, authLimiter, sensitiveLimiter };