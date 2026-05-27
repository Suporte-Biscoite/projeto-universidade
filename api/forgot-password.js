// api/forgot-password.js
// POST /api/forgot-password?action=request  — envia email de reset
// POST /api/forgot-password?action=reset    — redefine senha com token

import pool from './db.js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

function send(res, status, body) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });

  const action = req.query.action;
  try {
    if (action === 'request') return await requestReset(req, res);
    if (action === 'reset')   return await resetPassword(req, res);
    return send(res, 404, { error: 'Ação não encontrada' });
  } catch (err) {
    console.error('[forgot-password]', err);
    return send(res, 500, { error: err.message });
  }
}

async function requestReset(req, res) {
  const { email } = req.body ?? {};
  if (!email) return send(res, 400, { error: 'Email obrigatório' });

  const { rows } = await pool.query(
    'SELECT id, name FROM users WHERE email = $1 AND active = true',
    [email.toLowerCase().trim()]
  );

  // Sempre retorna sucesso para não revelar se o email existe
  if (!rows.length)
    return send(res, 200, { ok: true, message: 'Se o email existir, você receberá um link em breve.' });

  const user      = rows[0];
  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  // Salva o token
  await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, `reset_${token}`, expiresAt]
  );

  const frontendUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.FRONTEND_URL || 'http://localhost:3000');

  const resetLink = `${frontendUrl}/redefinir-senha?token=${token}`;

  // Envia email via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to:   [email.toLowerCase().trim()],
      subject: 'Recuperação de senha — Universidade Biscoitê',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <img src="https://projeto-universidade-chi.vercel.app/logo-biscoite.svg"
               alt="Biscoitê" style="height: 48px; margin-bottom: 24px;" />

          <h2 style="color: #001A26; margin-bottom: 8px;">Olá, ${user.name}!</h2>
          <p style="color: #444; line-height: 1.6; margin-bottom: 24px;">
            Recebemos uma solicitação para redefinir a senha da sua conta na
            <strong>Universidade Biscoitê</strong>. Clique no botão abaixo para criar uma nova senha.
          </p>

          <a href="${resetLink}"
             style="display: inline-block; background: #4A72B2; color: white;
                    padding: 14px 28px; border-radius: 24px; text-decoration: none;
                    font-weight: bold; font-size: 15px; margin-bottom: 24px;">
            Redefinir minha senha
          </a>

          <p style="color: #888; font-size: 13px; line-height: 1.6;">
            Este link expira em <strong>1 hora</strong>.<br/>
            Se você não solicitou a redefinição, pode ignorar este email com segurança.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">
            Universidade Biscoitê · Plataforma de Treinamento
          </p>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}));
    console.error('[forgot-password] Resend error:', err);
    return send(res, 500, { error: 'Erro ao enviar email. Tente novamente.' });
  }

  return send(res, 200, {
    ok: true,
    message: 'Se o email existir, você receberá um link em breve.',
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};
  if (!token || !password)
    return send(res, 400, { error: 'Token e nova senha são obrigatórios' });
  if (password.length < 8)
    return send(res, 400, { error: 'Senha deve ter no mínimo 8 caracteres' });

  const { rows } = await pool.query(
    'SELECT user_id, expires_at FROM sessions WHERE refresh_token = $1',
    [`reset_${token}`]
  );

  if (!rows.length)
    return send(res, 400, { error: 'Link inválido ou já utilizado.' });
  if (new Date(rows[0].expires_at) < new Date())
    return send(res, 400, { error: 'Link expirado. Solicite um novo.' });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
    [hash, rows[0].user_id]
  );

  // Remove o token usado
  await pool.query(
    'DELETE FROM sessions WHERE refresh_token = $1',
    [`reset_${token}`]
  );

  return send(res, 200, { ok: true, message: 'Senha redefinida com sucesso.' });
}