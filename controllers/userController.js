const supabase = require('../config/supabase');

const userController = {
  // Obter perfil do usuário
  async getProfile(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, available_lessons, created_at, email_verified')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;

      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
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

      res.json({ 
        available_lessons: user.available_lessons,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      res.status(500).json({ error: 'Erro ao buscar saldo' });
    }
  },

  // Listar professores
  async getTeachers(req, res) {
    try {
      const { data: teachers, error } = await supabase
        .from('users')
        .select('id, name, email, calendly_url, youcanbookme_url, bio, specialties, rating, total_reviews')
        .eq('role', 'teacher')
        .eq('active', true)
        .eq('email_verified', true)
        .order('name');

      if (error) throw error;

      res.json(teachers);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      res.status(500).json({ error: 'Erro ao buscar professores' });
    }
  },

  // Atualizar perfil do usuário
  async updateProfile(req, res) {
    try {
      const { name, bio, specialties } = req.body;
      const userId = req.user.id;

      const updates = {};
      if (name) updates.name = name;
      if (bio !== undefined) updates.bio = bio;
      if (specialties !== undefined) updates.specialties = specialties;

      const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, email, name, role, available_lessons, created_at, bio, specialties')
        .single();

      if (error) throw error;

      res.json({
        message: 'Perfil atualizado com sucesso',
        user
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  // Forçar atualização do saldo (para polling do frontend)
  async forceUpdateBalance(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('available_lessons')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;

      res.json({ 
        available_lessons: user.available_lessons,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao forçar atualização de saldo:', error);
      res.status(500).json({ error: 'Erro ao buscar saldo' });
    }
  },

  // Verificar status de verificação de email
  async getVerificationStatus(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('email_verified, email_verify_expires')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;

      res.json({
        email_verified: user.email_verified,
        verification_expires: user.email_verify_expires,
        needs_verification: !user.email_verified
      });
    } catch (error) {
      console.error('Erro ao verificar status de email:', error);
      res.status(500).json({ error: 'Erro ao verificar email' });
    }
  },

  // Obter histórico de transações
  async getTransactionHistory(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data: transactions, error, count } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          lesson_count,
          status,
          stripe_session_id,
          created_at,
          package:packages (name, description)
        `, { count: 'exact' })
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      res.json({
        transactions,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de transações:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  },

  // Obter agendamentos do usuário
  async getUserBookings(req, res) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          status,
          booking_platform,
          timezone,
          created_at,
          teacher:users!bookings_teacher_id_fkey (name, email)
        `)
        .eq('user_id', req.user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      res.json(bookings);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
  },

  // Estatísticas do usuário
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      // Buscar saldo atual
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_lessons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Contar agendamentos por status
      const { data: bookingStats, error: bookingError } = await supabase
        .from('bookings')
        .select('status, count(*)')
        .eq('user_id', userId)
        .group('status');

      if (bookingError) throw bookingError;

      // Total de transações
      const { count: totalTransactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (transactionError) throw transactionError;

      res.json({
        available_lessons: user.available_lessons,
        booking_stats: bookingStats,
        total_transactions: totalTransactions,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
};

module.exports = userController;