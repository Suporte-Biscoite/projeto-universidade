// api/forgot-password.js
// POST /api/forgot-password?action=request  — envia link de reset
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
    'SELECT id FROM users WHERE email = $1 AND active = true',
    [email.toLowerCase().trim()]
  );

  // Sempre retorna sucesso para não revelar se o email existe
  if (!rows.length) return send(res, 200, { ok: true, message: 'Se o email existir, você receberá um link em breve.' });

  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  // Salva o token na tabela sessions com tipo especial
  await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [rows[0].id, `reset_${token}`, expiresAt]
  );

  // Em produção: enviar email com link contendo o token
  // Por enquanto retorna o token direto (apenas para desenvolvimento)
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/redefinir-senha?token=${token}`;
  console.log(`[Reset link para ${email}]: ${resetLink}`);

  return send(res, 200, {
    ok: true,
    message: 'Se o email existir, você receberá um link em breve.',
    // Remover em produção:
    dev_token: process.env.NODE_ENV === 'development' ? token : undefined,
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};
  if (!token || !password)
    return send(res, 400, { error: 'Token e nova senha são obrigatórios' });
  if (password.length < 8)
    return send(res, 400, { error: 'Senha deve ter no mínimo 8 caracteres' });

  const { rows } = await pool.query(
    `SELECT user_id, expires_at FROM sessions WHERE refresh_token = $1`,
    [`reset_${token}`]
  );

  if (!rows.length) return send(res, 400, { error: 'Token inválido ou expirado' });
  if (new Date(rows[0].expires_at) < new Date())
    return send(res, 400, { error: 'Token expirado. Solicite um novo link.' });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
    [hash, rows[0].user_id]
  );

  // Remove o token usado
  await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [`reset_${token}`]);

  return send(res, 200, { ok: true, message: 'Senha redefinida com sucesso.' });
}
