const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authController = {
  // Cadastro de usuário
  async register(req, res) {
    try {
      const { email, password, name, role = 'student' } = req.body;

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const { data: user, error } = await supabase
        .from('users')
        .insert([{
          email,
          password: hashedPassword,
          name,
          role,
          available_lessons: 0
        }])
        .select('id, email, name, role, available_lessons')
        .single();

      if (error) throw error;

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        token,
        user
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  },

  // Login de usuário
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuário
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Retornar dados sem a senha
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
};

module.exports = authController;