const supabase = require('../config/supabase');

const packageController = {
  // Listar todos os pacotes
  async getPackages(req, res) {
    try {
      const { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('price');

      if (error) throw error;

      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pacotes' });
    }
  },

  // Comprar pacote (simulação)
  async purchasePackage(req, res) {
    try {
      const { packageId } = req.body;
      const userId = req.user.id;

      // Buscar informações do pacote
      const { data: package, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (packageError) throw packageError;

      // Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_lessons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Atualizar saldo
      const newBalance = user.available_lessons + package.lesson_count;

      const { error: updateError } = await supabase
        .from('users')
        .update({ available_lessons: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Registrar transação
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          package_id: packageId,
          amount: package.price,
          lesson_count: package.lesson_count,
          status: 'completed'
        }]);

      if (transactionError) throw transactionError;

      res.json({
        message: 'Pacote adquirido com sucesso',
        new_balance: newBalance
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }
};

module.exports = packageController;