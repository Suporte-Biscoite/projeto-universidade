// api/auth.js
// POST /api/auth?action=login|register|refresh|logout

import pool from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET     = process.env.JWT_SECRET;
const ACCESS_TTL     = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ADMIN_EMAIL    = 'bi@biscoite.com.br';
const FRONTEND_URL   = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.FRONTEND_URL || 'http://localhost:3000');

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

async function sendEmail(to, subject, html) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'noreply@biscolab.tech',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error('[sendEmail]', e);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });

  const action = req.query.action;
  try {
    if (action === 'login')    return await login(req, res);
    if (action === 'register') return await register(req, res);
    if (action === 'refresh')  return await refresh(req, res);
    if (action === 'logout')   return await logout(req, res);
    return send(res, 404, { error: 'Ação não encontrada' });
  } catch (err) {
    console.error('[auth]', err);
    return send(res, 500, { error: 'Erro interno do servidor' });
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return send(res, 400, { error: 'Email e senha são obrigatórios' });

  const { rows } = await pool.query(
    `SELECT id, name, email, role, password_hash, active, status,
            unit, store_id, store_name, store_type, instructor_id,
            avatar_url, banner_url, pronoun, position, company_time, bio, contacts
     FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  const user = rows[0];
  if (!user) return send(res, 401, { error: 'Email ou senha incorretos' });

  // Conta desativada pelo admin
  if (!user.active) return send(res, 403, { error: 'Conta desativada. Fale com o administrador.' });

  // Cadastro pendente de aprovação
  if (user.status === 'pending')
    return send(res, 403, {
      error: 'Seu cadastro está em análise. Você receberá um email quando for aprovado.',
      code: 'PENDING_APPROVAL',
    });

  // Cadastro rejeitado
  if (user.status === 'rejected')
    return send(res, 403, {
      error: 'Seu cadastro foi recusado. Entre em contato com o administrador.',
      code: 'REJECTED',
    });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return send(res, 401, { error: 'Email ou senha incorretos' });

  const accessToken  = signAccess(user);
  const refreshToken = randomBytes(40).toString('hex');
  const expiresAt    = new Date(Date.now() + REFRESH_TTL_MS);

  await pool.query(
    'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1,$2,$3)',
    [user.id, refreshToken, expiresAt]
  );

  const destinations = {
    admin:     '/',
    professor: '/professor',
    gestor:    '/gestor',
    aluno:     '/',
  };

  const { password_hash: _, ...safeUser } = user;
  return send(res, 200, {
    accessToken,
    refreshToken,
    redirect: destinations[user.role] || '/',
    user: safeUser,
  });
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
async function register(req, res) {
  const {
    name, email, password,
    role = 'aluno',
    unit, store_name, store_type,
  } = req.body ?? {};

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

  // Admins não precisam de aprovação
  const status = role === 'admin' ? 'approved' : 'pending';

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, unit, store_name, store_type, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, name, email, role, status`,
    [name.trim(), email.toLowerCase().trim(), hash, role, unit || null, store_name || null, store_type || null, status]
  );

  const user = rows[0];

  // ── Email para o admin notificando novo cadastro ──
  await sendEmail(
    ADMIN_EMAIL,
    `Novo cadastro pendente — ${name}`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <img src="https://projeto-universidade-chi.vercel.app/logo-biscoite.svg"
           alt="Biscoitê" style="height: 48px; margin-bottom: 24px;" />
      <h2 style="color: #001A26;">Novo cadastro aguardando aprovação</h2>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#666; font-size:13px;"><strong>Nome:</strong></td><td style="font-size:13px;">${name}</td></tr>
        <tr><td style="padding:6px 0; color:#666; font-size:13px;"><strong>Email:</strong></td><td style="font-size:13px;">${email}</td></tr>
        <tr><td style="padding:6px 0; color:#666; font-size:13px;"><strong>Perfil:</strong></td><td style="font-size:13px;">${role}</td></tr>
        <tr><td style="padding:6px 0; color:#666; font-size:13px;"><strong>Loja:</strong></td><td style="font-size:13px;">${store_name || '—'}</td></tr>
        <tr><td style="padding:6px 0; color:#666; font-size:13px;"><strong>Tipo:</strong></td><td style="font-size:13px;">${store_type || '—'}</td></tr>
        <tr><td style="padding:6px 0; color:#666; font-size:13px;"><strong>Unidade:</strong></td><td style="font-size:13px;">${unit || '—'}</td></tr>
      </table>
      <a href="${FRONTEND_URL}/admin"
         style="display:inline-block; background:#4A72B2; color:white; padding:12px 24px;
                border-radius:20px; text-decoration:none; font-weight:bold; font-size:14px;">
        Aprovar no painel Admin
      </a>
      <p style="color:#aaa; font-size:12px; margin-top:24px;">
        Universidade Biscoitê · Sistema de Gestão de Aprendizado
      </p>
    </div>
    `
  );

  // ── Email para o usuário confirmando recebimento ──
  await sendEmail(
    email,
    'Cadastro recebido — Universidade Biscoitê',
    `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <img src="https://projeto-universidade-chi.vercel.app/logo-biscoite.svg"
           alt="Biscoitê" style="height: 48px; margin-bottom: 24px;" />
      <h2 style="color: #001A26;">Olá, ${name}!</h2>
      <p style="color:#444; line-height:1.6;">
        Seu cadastro na <strong>Universidade Biscoitê</strong> foi recebido com sucesso
        e está sendo analisado pela nossa equipe.
      </p>
      <div style="background:#f0f6ff; border-radius:12px; padding:16px; margin:20px 0;">
        <p style="color:#4A72B2; font-weight:bold; margin:0; font-size:14px;">
          ⏳ Aguardando aprovação
        </p>
        <p style="color:#666; font-size:13px; margin:8px 0 0;">
          Você receberá um email assim que seu cadastro for aprovado.
          Geralmente isso acontece em até 1 dia útil.
        </p>
      </div>
      <p style="color:#888; font-size:13px;">
        Em caso de dúvidas, entre em contato com seu gestor ou administrador.
      </p>
      <p style="color:#aaa; font-size:12px; margin-top:24px;">
        Universidade Biscoitê · Plataforma de Treinamento
      </p>
    </div>
    `
  );

  return send(res, 201, {
    ok: true,
    status: 'pending',
    message: 'Cadastro realizado! Aguarde a aprovação do administrador.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

// ─── REFRESH ──────────────────────────────────────────────────────────────────
async function refresh(req, res) {
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

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
async function logout(req, res) {
  const { refreshToken } = req.body ?? {};
  if (refreshToken)
    await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
  return send(res, 200, { ok: true });
}
