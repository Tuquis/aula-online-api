const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  next();
};

module.exports = { validateRegister };