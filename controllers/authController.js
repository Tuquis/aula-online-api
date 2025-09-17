const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

// Gerar tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Exporta diretamente as funções
module.exports = {
  // Cadastro de usuário (COM VERIFICAÇÃO HABILITADA)
  async register(req, res) {
    try {
      const { email, password, name, role = 'student' } = req.body;

      // Verificar se usuário já existe
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Gerar token de verificação
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');
      const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Criar usuário NÃO VERIFICADO (com verificação ativa)
      const { data: user, error: createError } = await supabase
        .from('users')
        .insert([{
          email,
          password: hashedPassword,
          name,
          role,
          available_lessons: 0,
          email_verified: false,
          email_verify_token: emailVerifyToken,
          email_verify_expires: emailVerifyExpires.toISOString()
        }])
        .select('id, email, name, role, available_lessons, created_at')
        .single();

      if (createError) throw createError;

      // Gerar tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Salvar refresh token no banco
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          refresh_token: refreshToken,
          refresh_token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // ENVIO DE EMAIL HABILITADO
      try {
        await sendVerificationEmail(user.email, emailVerifyToken);
      } catch (emailError) {
        console.error('Erro ao enviar email de verificação:', emailError);
        // Não falhar o registro se o email falhar
      }

      res.status(201).json({
        message: 'Usuário criado com sucesso. Verifique seu email para ativar sua conta.',
        accessToken,
        refreshToken,
        user
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  },

  // Login de usuário (COM VERIFICAÇÃO HABILITADA)
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

      // VERIFICAÇÃO DE EMAIL HABILITADA
      if (!user.email_verified) {
        return res.status(401).json({ 
          error: 'Email não verificado. Verifique sua caixa de entrada.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Salvar refresh token no banco
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          refresh_token: refreshToken,
          refresh_token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Retornar dados sem a senha
      const { password: _, refresh_token, refresh_token_expires, email_verify_token, email_verify_expires, password_reset_token, password_reset_expires, ...userWithoutPassword } = user;

      res.json({
        message: 'Login realizado com sucesso',
        accessToken,
        refreshToken,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token é obrigatório' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, refresh_token, refresh_token_expires')
        .eq('refresh_token', refreshToken)
        .single();

      if (error || !user) {
        return res.status(403).json({ error: 'Refresh token inválido' });
      }

      if (new Date() > new Date(user.refresh_token_expires)) {
        return res.status(403).json({ error: 'Refresh token expirado' });
      }

      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (jwtError) {
        return res.status(403).json({ error: 'Refresh token inválido' });
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          refresh_token: newRefreshToken,
          refresh_token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(500).json({ error: 'Erro ao renovar token' });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      const userId = req.user.id;

      const { error } = await supabase
        .from('users')
        .update({ 
          refresh_token: null,
          refresh_token_expires: null
        })
        .eq('id', userId);

      if (error) throw error;

      res.json({ message: 'Logout realizado com sucesso' });

    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  },

  // Verificar email
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Token de verificação é obrigatório' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email_verify_token, email_verify_expires')
        .eq('email_verify_token', token)
        .single();

      if (error || !user) {
        return res.status(400).json({ error: 'Token de verificação inválido' });
      }

      if (new Date() > new Date(user.email_verify_expires)) {
        return res.status(400).json({ error: 'Token de verificação expirado' });
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          email_verify_token: null,
          email_verify_expires: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      res.json({ message: 'Email verificado com sucesso' });

    } catch (error) {
      console.error('Erro na verificação de email:', error);
      res.status(500).json({ error: 'Erro ao verificar email' });
    }
  },

  // Esqueci a senha
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.json({ message: 'Se o email existir em nosso sistema, você receberá instruções de recuperação.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_reset_token: resetToken,
          password_reset_expires: resetExpires.toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        console.error('Erro ao enviar email de reset:', emailError);
        return res.status(500).json({ error: 'Erro ao enviar email de recuperação' });
      }

      res.json({ message: 'Se o email existir em nosso sistema, você receberá instruções de recuperação.' });

    } catch (error) {
      console.error('Erro no forgot password:', error);
      res.status(500).json({ error: 'Erro ao processar recuperação de senha' });
    }
  },

  // Resetar senha
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, password_reset_token, password_reset_expires')
        .eq('password_reset_token', token)
        .single();

      if (error || !user) {
        return res.status(400).json({ error: 'Token de reset inválido' });
      }

      if (new Date() > new Date(user.password_reset_expires)) {
        return res.status(400).json({ error: 'Token de reset expirado' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
          refresh_token: null,
          refresh_token_expires: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      res.json({ message: 'Senha alterada com sucesso' });

    } catch (error) {
      console.error('Erro no reset password:', error);
      res.status(500).json({ error: 'Erro ao resetar senha' });
    }
  },

  // Reenviar email de verificação
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, email_verified, email_verify_expires')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(400).json({ error: 'Email não encontrado' });
      }

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email já verificado' });
      }

      if (user.email_verify_expires && new Date() < new Date(user.email_verify_expires)) {
        return res.status(400).json({ error: 'Email de verificação já enviado. Verifique sua caixa de entrada.' });
      }

      const emailVerifyToken = crypto.randomBytes(32).toString('hex');
      const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email_verify_token: emailVerifyToken,
          email_verify_expires: emailVerifyExpires.toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      try {
        await sendVerificationEmail(user.email, emailVerifyToken);
      } catch (emailError) {
        console.error('Erro ao enviar email de verificação:', emailError);
        return res.status(500).json({ error: 'Erro ao reenviar email de verificação' });
      }

      res.json({ message: 'Email de verificação reenviado com sucesso' });

    } catch (error) {
      console.error('Erro no resend verification:', error);
      res.status(500).json({ error: 'Erro ao reenviar email de verificação' });
    }
  }
};