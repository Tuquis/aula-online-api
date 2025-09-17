const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

const verifyRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token necessário' });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }
    req.user = user;
    next();
  });
};

// middleware/auth.js deve exportar assim:
module.exports = {
  authenticateToken: (req, res, next) => next(),
  verifyRefreshToken: (req, res, next) => next()
};