// api/approvals.js
// GET  /api/approvals          — lista cadastros pendentes (admin)
// POST /api/approvals?action=approve&id=uuid — aprova usuário
// POST /api/approvals?action=reject&id=uuid  — rejeita usuário

import pool from './db.js';
import jwt from 'jsonwebtoken';

const FRONTEND_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.FRONTEND_URL || 'http://localhost:3000');

function authenticate(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET); }
  catch { return null; }
}

function send(res, status, body) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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
        to: [to],
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

  const auth = authenticate(req);
  if (!auth || auth.role !== 'admin')
    return send(res, 403, { error: 'Apenas admins podem gerenciar aprovações' });

  const { action, id } = req.query;

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT id, name, email, role, unit, store_name, store_type, created_at
         FROM users WHERE status = 'pending'
         ORDER BY created_at DESC`
      );
      return send(res, 200, rows);
    }

    if (req.method === 'POST' && action === 'approve') {
      const { rows } = await pool.query(
        `UPDATE users SET status = 'approved', active = true
         WHERE id = $1
         RETURNING id, name, email, role`,
        [id]
      );
      if (!rows.length) return send(res, 404, { error: 'Usuário não encontrado' });

      // Email para o usuário aprovado
      await sendEmail(
        rows[0].email,
        'Cadastro aprovado — Universidade Biscoitê ✅',
        `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <img src="https://projeto-universidade-chi.vercel.app/logo-biscoite.svg"
               alt="Biscoitê" style="height: 48px; margin-bottom: 24px;" />
          <h2 style="color: #001A26;">Olá, ${rows[0].name}!</h2>
          <p style="color:#444; line-height:1.6;">
            Seu cadastro na <strong>Universidade Biscoitê</strong> foi <strong style="color:#1D9E75;">aprovado</strong>!
            Agora você já pode acessar a plataforma.
          </p>
          <a href="${FRONTEND_URL}/login"
             style="display:inline-block; background:#4A72B2; color:white; padding:14px 28px;
                    border-radius:24px; text-decoration:none; font-weight:bold; font-size:15px; margin:16px 0;">
            Acessar a plataforma
          </a>
          <p style="color:#aaa; font-size:12px; margin-top:24px;">
            Universidade Biscoitê · Plataforma de Treinamento
          </p>
        </div>
        `
      );

      return send(res, 200, { ok: true, user: rows[0] });
    }

    if (req.method === 'POST' && action === 'reject') {
      const { reason = 'Cadastro não autorizado.' } = req.body ?? {};
      const { rows } = await pool.query(
        `UPDATE users SET status = 'rejected', active = false, rejected_reason = $2
         WHERE id = $1
         RETURNING id, name, email`,
        [id, reason]
      );
      if (!rows.length) return send(res, 404, { error: 'Usuário não encontrado' });

      // Email para o usuário rejeitado
      await sendEmail(
        rows[0].email,
        'Cadastro não aprovado — Universidade Biscoitê',
        `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <img src="https://projeto-universidade-chi.vercel.app/logo-biscoite.svg"
               alt="Biscoitê" style="height: 48px; margin-bottom: 24px;" />
          <h2 style="color: #001A26;">Olá, ${rows[0].name}!</h2>
          <p style="color:#444; line-height:1.6;">
            Infelizmente seu cadastro na <strong>Universidade Biscoitê</strong>
            não foi aprovado no momento.
          </p>
          <div style="background:#fff5f5; border-radius:12px; padding:16px; margin:20px 0; border-left: 3px solid #E24B4A;">
            <p style="color:#E24B4A; font-size:13px; margin:0;"><strong>Motivo:</strong> ${reason}</p>
          </div>
          <p style="color:#666; font-size:13px;">
            Em caso de dúvidas, entre em contato com seu gestor ou administrador da loja.
          </p>
          <p style="color:#aaa; font-size:12px; margin-top:24px;">
            Universidade Biscoitê · Plataforma de Treinamento
          </p>
        </div>
        `
      );

      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'Ação inválida' });
  } catch (err) {
    console.error('[approvals]', err);
    return send(res, 500, { error: err.message });
  }
}
