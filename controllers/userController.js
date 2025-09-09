const supabase = require('../config/supabase');

const userController = {
  // Obter perfil do usuário
  async getProfile(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, available_lessons, created_at')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  // Obter saldo de aulas
  async getBalance(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('available_lessons')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;

      res.json({ available_lessons: user.available_lessons });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar saldo' });
    }
  },

  // Listar professores
  async getTeachers(req, res) {
    try {
      const { data: teachers, error } = await supabase
        .from('users')
        .select('id, name, email, calendly_url, youcanbookme_url')
        .eq('role', 'teacher')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar professores' });
    }
  }
};

module.exports = userController;