// api/auth.js
// POST /api/auth?action=login|register|refresh|logout

import { createPool } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET     = process.env.JWT_SECRET;
const ACCESS_TTL     = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function send(res, status, body) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });

  const pool = createPool();
  const action = req.query.action;

  try {
    if (action === 'login')    return await login(req, res, pool);
    if (action === 'register') return await register(req, res, pool);
    if (action === 'refresh')  return await refresh(req, res, pool);
    if (action === 'logout')   return await logout(req, res, pool);
    return send(res, 404, { error: 'Ação não encontrada' });
  } catch (err) {
    console.error('[auth]', err);
    return send(res, 500, { error: err.message });
  }
}

async function login(req, res, pool) {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return send(res, 400, { error: 'Email e senha são obrigatórios' });

  const { rows } = await pool.query(
    `SELECT id, name, email, role, password_hash, active, unit, store_id, instructor_id
     FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  const user = rows[0];
  if (!user)        return send(res, 401, { error: 'Email ou senha incorretos' });
  if (!user.active) return send(res, 403, { error: 'Conta desativada. Fale com o administrador.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)       return send(res, 401, { error: 'Email ou senha incorretos' });

  const accessToken  = signAccess(user);
  const refreshToken = randomBytes(40).toString('hex');
  const expiresAt    = new Date(Date.now() + REFRESH_TTL_MS);

  await pool.query(
    'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1,$2,$3)',
    [user.id, refreshToken, expiresAt]
  );

  const destinations = {
    admin: '/admin', professor: '/professor',
    gestor: '/gestor', franqueado: '/franqueado',
    loja: '/loja', aluno: '/',
  };

  const { password_hash: _, ...safeUser } = user;
  return send(res, 200, {
    accessToken,
    refreshToken,
    redirect: destinations[user.role] || '/',
    user: safeUser,
  });
}

async function register(req, res, pool) {
  const { name, email, password, role = 'aluno' } = req.body ?? {};
  if (!name || !email || !password)
    return send(res, 400, { error: 'Nome, email e senha são obrigatórios' });
  if (password.length < 8)
    return send(res, 400, { error: 'Senha deve ter no mínimo 8 caracteres' });

  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (existing.length) return send(res, 409, { error: 'Email já cadastrado' });

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role`,
    [name.trim(), email.toLowerCase().trim(), hash, role]
  );

  const user = rows[0];
  const accessToken  = signAccess(user);
  const refreshToken = randomBytes(40).toString('hex');
  const expiresAt    = new Date(Date.now() + REFRESH_TTL_MS);

  await pool.query(
    'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1,$2,$3)',
    [user.id, refreshToken, expiresAt]
  );

  return send(res, 201, { accessToken, refreshToken, user });
}

async function refresh(req, res, pool) {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return send(res, 400, { error: 'Token ausente' });

  const { rows } = await pool.query(
    `SELECT s.expires_at, u.id, u.name, u.email, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.refresh_token = $1`,
    [refreshToken]
  );

  const session = rows[0];
  if (!session) return send(res, 401, { error: 'Token inválido' });
  if (new Date(session.expires_at) < new Date()) {
    await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    return send(res, 401, { error: 'Token expirado — faça login novamente' });
  }

  const newAccess  = signAccess(session);
  const newRefresh = randomBytes(40).toString('hex');
  const expiresAt  = new Date(Date.now() + REFRESH_TTL_MS);

  await pool.query(
    'UPDATE sessions SET refresh_token=$1, expires_at=$2 WHERE refresh_token=$3',
    [newRefresh, expiresAt, refreshToken]
  );

  return send(res, 200, { accessToken: newAccess, refreshToken: newRefresh });
}

async function logout(req, res, pool) {
  const { refreshToken } = req.body ?? {};
  if (refreshToken)
    await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
  return send(res, 200, { ok: true });
}