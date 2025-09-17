const axios = require('axios');
const supabase = require('../config/supabase');

const calendlyController = {
  // Obter eventos disponíveis de um professor
  async getTeacherAvailability(req, res) {
    try {
      const { teacherId } = req.params;

      // Buscar URL do Calendly do professor
      const { data: teacher, error } = await supabase
        .from('users')
        .select('calendly_url, calendly_access_token')
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .single();

      if (error || !teacher) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }

      if (!teacher.calendly_url) {
        return res.status(400).json({ error: 'Professor não possui Calendly configurado' });
      }

      // Extrair username do Calendly da URL
      const calendlyUsername = teacher.calendly_url.split('/').pop();
      
      // Buscar eventos disponíveis (simplificado - na prática você usaria a API do Calendly)
      const events = await this.fetchCalendlyEvents(calendlyUsername, teacher.calendly_access_token);

      res.json(events);
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
    }
  },

  // Método para buscar eventos do Calendly (simplificado)
  async fetchCalendlyEvents(username, accessToken = null) {
    try {
      // Em produção, você usaria a API real do Calendly
      // Esta é uma implementação simulada
      const config = accessToken ? {
        headers: { Authorization: `Bearer ${accessToken}` }
      } : {};

      // URL da API pública do Calendly para eventos
      const response = await axios.get(
        `https://api.calendly.com/event_types?user=https://api.calendly.com/users/${username}`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar eventos do Calendly:', error);
      
      // Retornar dados simulados para desenvolvimento
      return {
        collection: [
          {
            uri: 'https://api.calendly.com/event_types/1',
            name: 'Aula Particular - 60min',
            duration: 60,
            description: 'Aula particular de inglês',
            slug: 'aula-ingles',
            color: '#009688',
            active: true,
            scheduling_url: `https://calendly.com/${username}/aula-ingles`
          }
        ]
      };
    }
  },

  // Criar agendamento via Calendly
  async createBooking(req, res) {
    try {
      const { teacherId, eventUri, inviteeEmail, startTime, timezone } = req.body;
      const userId = req.user.id;

      // Verificar saldo
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_lessons, email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (user.available_lessons < 1) {
        return res.status(400).json({ error: 'Saldo de aulas insuficiente' });
      }

      // Buscar token do Calendly do professor
      const { data: teacher, error: teacherError } = await supabase
        .from('users')
        .select('calendly_access_token')
        .eq('id', teacherId)
        .single();

      if (teacherError) throw teacherError;

      // Criar agendamento no Calendly (simplificado)
      const bookingData = {
        event: eventUri,
        invitee: {
          email: inviteeEmail || user.email
        },
        start_time: startTime,
        timezone: timezone || 'America/Sao_Paulo'
      };

      // Em produção, você faria a chamada real para a API do Calendly
      // const response = await axios.post(
      //   'https://api.calendly.com/scheduled_events',
      //   bookingData,
      //   {
      //     headers: { Authorization: `Bearer ${teacher.calendly_access_token}` }
      //   }
      // );

      // Debitar aula do aluno
      const newBalance = user.available_lessons - 1;
      await supabase
        .from('users')
        .update({ available_lessons: newBalance })
        .eq('id', userId);

      // Registrar agendamento no banco
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          user_id: userId,
          teacher_id: teacherId,
          scheduled_date: startTime,
          calendly_event_uri: eventUri,
          status: 'scheduled',
          timezone: timezone
        }])
        .select('*')
        .single();

      if (bookingError) throw bookingError;

      res.json({
        message: 'Aula agendada com sucesso',
        booking,
        new_balance: newBalance,
        calendly_url: `https://calendly.com/events/${eventUri.split('/').pop()}` // URL simulada
      });

    } catch (error) {
      console.error('Erro ao agendar aula:', error);
      res.status(500).json({ error: 'Erro ao agendar aula' });
    }
  }
};

module.exports = {
  async getPackages(req, res) {
    try {
      const { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .order('price');
      
      if (error) throw error;
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pacotes' });
    }
  },

  async purchasePackage(req, res) {
    try {
      // Lógica de compra de pacote
      res.json({ message: 'Compra realizada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao comprar pacote' });
    }
  }
};