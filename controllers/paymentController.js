const { Preference, Payment, mercadopagoConfig } = require("../config/mercadopago");
const supabase = require("../config/supabase");

const paymentController = {
  // Criar preferência de pagamento no Mercado Pago
  async createCheckoutSession(req, res) {
    try {
      const { packageId } = req.body;
      const userId = req.user.id;

      // Buscar informações do pacote
      const { data: package, error: packageError } = await supabase
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .single();

      if (packageError) throw packageError;

      // Buscar informações do usuário
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // Criar preferência de pagamento no Mercado Pago
      const client = new Preference(mercadopagoConfig);
      
      const preference = {
        items: [
          {
            title: `Pacote de ${package.lesson_count} aulas`,
            description: package.description,
            quantity: 1,
            currency_id: "BRL",
            unit_price: package.price
          }
        ],
        payer: {
          email: user.email,
          name: user.name
        },
        back_urls: {
          success: `${process.env.APP_URL}/payment-success`,
          failure: `${process.env.APP_URL}/payment-cancel`, 
          pending: `${process.env.APP_URL}/payment-pending`
        },
        auto_return: "approved",
        notification_url: `${process.env.APP_URL}/api/payment/webhook`,
        metadata: {
          userId: userId,
          packageId: packageId,
          lessonCount: package.lesson_count.toString()
        }
      };

      const response = await client.create({ body: preference });
      
      res.json({ 
        sessionId: response.id, 
        url: response.sandbox_init_point || response.init_point 
      });
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      res.status(500).json({ error: "Erro ao processar pagamento" });
    }
  },

  // Webhook do Mercado Pago
  async handleMercadoPagoWebhook(req, res) {
    try {
      const { type, data } = req.body;

      if (type === "payment") {
        const paymentId = data.id;
        
        // Buscar detalhes do pagamento
        const client = new Payment(mercadopagoConfig);
        const paymentData = await client.get({ id: paymentId });
        
        if (paymentData.status === "approved") {
          const { userId, packageId, lessonCount } = paymentData.metadata;
          
          console.log("✅ Pagamento aprovado:", paymentId);
          console.log("📦 Metadata:", paymentData.metadata);
          
          // ... resto do código permanece igual
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("❌ Erro no processamento do webhook:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  },

  // Verificar status do pagamento
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      const client = new Payment(mercadopagoConfig);
      const paymentData = await client.get({ id: paymentId });

      if (!paymentData) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      res.json({ status: paymentData.status, detail: paymentData.status_detail });
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      res.status(500).json({ error: "Erro ao verificar status do pagamento" });
    }
  }
};

module.exports = paymentController;
