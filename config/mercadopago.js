const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configuração do Mercado Pago
let mercadopago;
try {
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error('❌ MP_ACCESS_TOKEN não encontrada no .env');
    console.log('⚠️  Usando modo sandbox com token de teste');
    
    mercadopago = new MercadoPagoConfig({
      accessToken: 'TEST-123456789012345678901234567890-123456',
      options: { sandbox: true }
    });
  } else {
    console.log('✅ Configurando Mercado Pago com token de produção');
    mercadopago = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
      options: { sandbox: process.env.NODE_ENV !== 'production' }
    });
  }
  
  console.log('✅ Mercado Pago configurado com sucesso');
  console.log('ℹ️  Sandbox mode:', mercadopago.options.sandbox);
  
} catch (error) {
  console.error('❌ Erro ao configurar Mercado Pago:', error);
  // Fallback para não quebrar a aplicação
  mercadopago = {
    options: { sandbox: true }
  };
}

// Exportar tanto a configuração quanto as classes
module.exports = {
  mercadopagoConfig: mercadopago,
  Preference,
  Payment
};