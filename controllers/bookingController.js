const supabase = require('../config/supabase');

const bookingController = {
  // Agendar aula
  async createBooking(req, res) {
    try {
      const { teacherId, scheduledDate, bookingPlatform } = req.body;
      const userId = req.user.id;

      // Verificar saldo
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_lessons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (user.available_lessons < 1) {
        return res.status(400).json({ error: 'Saldo de aulas insuficiente' });
      }

      // Debitar aula
      const newBalance = user.available_lessons - 1;

      const { error: updateError } = await supabase
        .from('users')
        .update({ available_lessons: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Criar agendamento
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          user_id: userId,
          teacher_id: teacherId,
          scheduled_date: scheduledDate,
          booking_platform: bookingPlatform,
          status: 'scheduled'
        }])
        .select(`
          *,
          teacher:users!bookings_teacher_id_fkey(name, email)
        `)
        .single();

      if (bookingError) throw bookingError;

      res.status(201).json({
        message: 'Aula agendada com sucesso',
        booking,
        new_balance: newBalance
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao agendar aula' });
    }
  },

  // Listar agendamentos do usuário
  async getUserBookings(req, res) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          status,
          booking_platform,
          teacher:users!bookings_teacher_id_fkey(name, email)
        `)
        .eq('user_id', req.user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
  }
};

module.exports = bookingController;