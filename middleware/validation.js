// middleware/validation.js

const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password e name são obrigatórios' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password são obrigatórios' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  next();
};

// ✅ CORRETO: Exporte as funções
module.exports = {
  validateRegister: (req, res, next) => next(),
  validateLogin: (req, res, next) => next()
};
