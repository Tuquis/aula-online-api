const nodemailer = require('nodemailer');

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email de verificação
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Aula Online" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifique seu email - Aula Online',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bem-vindo à Aula Online!</h2>
        <p>Clique no botão abaixo para verificar seu email:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Verificar Email
        </a>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
        <p>Este link expira em 24 horas.</p>
        <p>Se você não criou uma conta, ignore este email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Email de reset de senha
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Aula Online" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperação de Senha - Aula Online',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperação de Senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Redefinir Senha
        </a>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };