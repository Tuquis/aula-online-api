require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MIDDLEWARE PARA WEBHOOK DO MERCADO PAGO
app.post("/api/payment/webhook", 
  express.json(),
  require("./controllers/paymentController").handleMercadoPagoWebhook
);
// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "API funcionando!" });
});

// ==================== ROTAS DE REDIRECIONAMENTO ====================
// Rota para sucesso de pagamento
app.get("/payment-success", (req, res) => {
  const { payment_id } = req.query;
  console.log("✅ Pagamento bem-sucedido. Payment ID:", payment_id);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pagamento Bem-sucedido - Aula Online</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center; 
          padding: 50px; 
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 500px;
        }
        .success { 
          color: #28a745; 
          font-size: 28px;
          margin-bottom: 20px;
        }
        .info { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 10px; 
          margin: 20px 0;
          text-align: left;
        }
        .btn {
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin-top: 20px;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="success">✅ Pagamento Realizado com Sucesso!</h1>
        <div class="info">
          <p><strong>Status:</strong> Pagamento aprovado</p>
          <p><strong>ID do Pagamento:</strong> ${payment_id || 'N/A'}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <p>Seu saldo de aulas será atualizado automaticamente.</p>
        <a href="${process.env.FRONTEND_URL}" class="btn">Voltar para o Site</a>
      </div>

      <script>
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

// Rota para pagamento cancelado
app.get("/payment-cancel", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pagamento Cancelado - Aula Online</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center; 
          padding: 50px; 
          background: linear-gradient(135deg, #dc3545, #bd2130);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 500px;
        }
        .error { 
          color: #dc3545; 
          font-size: 28px;
          margin-bottom: 20px;
        }
        .btn {
          background: #dc3545;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin-top: 20px;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #bd2130;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">❌ Pagamento Cancelado</h1>
        <p>Seu pagamento foi cancelado. Você não foi cobrado.</p>
        <a href="${process.env.FRONTEND_URL}" class="btn">Voltar para o Site</a>
      </div>
    </body>
    </html>
  `);
});

// Rota para pagamento pendente
app.get("/payment-pending", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pagamento Pendente - Aula Online</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center; 
          padding: 50px; 
          background: linear-gradient(135deg, #ffc107, #fd7e14);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 500px;
        }
        .warning { 
          color: #ffc107; 
          font-size: 28px;
          margin-bottom: 20px;
        }
        .btn {
          background: #ffc107;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin-top: 20px;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #fd7e14;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="warning">⏳ Pagamento Pendente</h1>
        <p>Seu pagamento está sendo processado. Você receberá uma confirmação por email quando for aprovado.</p>
        <a href="${process.env.FRONTEND_URL}" class="btn">Voltar para o Site</a>
      </div>
    </body>
    </html>
  `);
});

// ==================== ROTAS DA API ====================
// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const packageRoutes = require('./routes/packages');
const bookingRoutes = require('./routes/bookings');
const calendlyRoutes = require('./routes/calendly');
const paymentRoutes = require('./routes/payment');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/calendly', calendlyRoutes);
app.use('/api/payment', paymentRoutes);

// Rota de debug simplificada
app.get("/api/debug/routes", (req, res) => {
  const routes = [
    { path: "/api/health", methods: ["GET"] },
    { path: "/api/auth/login", methods: ["POST"] },
    { path: "/api/auth/register", methods: ["POST"] },
    { path: "/api/auth/verify-email", methods: ["GET"] },
    { path: "/api/auth/refresh-token", methods: ["POST"] },
    { path: "/api/auth/logout", methods: ["POST"] },
    { path: "/api/auth/forgot-password", methods: ["POST"] },
    { path: "/api/auth/reset-password", methods: ["POST"] },
    { path: "/api/users/profile", methods: ["GET"] },
    { path: "/api/users/balance", methods: ["GET"] },
    { path: "/api/users/teachers", methods: ["GET"] },
    { path: "/api/packages", methods: ["GET"] },
    { path: "/api/packages/purchase", methods: ["POST"] },
    { path: "/api/payment/create-checkout-session", methods: ["POST"] },
    { path: "/api/payment/webhook", methods: ["POST"] },
    { path: "/api/bookings", methods: ["GET", "POST"] },
    { path: "/api/calendly/availability/:teacherId", methods: ["GET"] },
    { path: "/api/calendly/book", methods: ["POST"] },
    { path: "/payment-success", methods: ["GET"] },
    { path: "/payment-cancel", methods: ["GET"] },
    { path: "/payment-pending", methods: ["GET"] },
    { path: "/api/debug/routes", methods: ["GET"] }
  ];

  res.json({
    success: true,
    count: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// Rota alternativa simples para teste
app.get("/api/test-payment", (req, res) => {
  res.json({ 
    message: "Rota de teste de pagamento funcionando!",
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback para erro 404
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Rota não encontrada",
    path: req.originalUrl,
    availableRoutes: [
      "/api/health",
      "/api/auth/login",
      "/api/auth/register",
      "/api/users/profile",
      "/api/packages",
      "/api/payment/create-checkout-session",
      "/api/debug/routes",
      "/payment-success",
      "/payment-cancel",
      "/payment-pending"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Success page: http://localhost:${PORT}/payment-success`);
  console.log(`❌ Cancel page: http://localhost:${PORT}/payment-cancel`);
  console.log(`⏳ Pending page: http://localhost:${PORT}/payment-pending`);
  console.log(`🤖 Webhook: http://localhost:${PORT}/api/payment/webhook`);
  console.log(`🌐 Ngrok URL: ${process.env.APP_URL}`);
  console.log(`📧 Webhook Mercado Pago: ${process.env.APP_URL}/api/payment/webhook`);
});
