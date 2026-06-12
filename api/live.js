// api/live.js
// GET  /api/live          — verifica se tem live ativa (público)
// POST /api/live?action=start  — inicia live (professor/admin)
// POST /api/live?action=stop   — encerra live (professor/admin)

import pool from './db.js';
import { createNotification } from './notifications.js';
import jwt from 'jsonwebtoken';

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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET')  return await getLive(res);
    if (req.method === 'POST') return await controlLive(req, res);
    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[live]', err);
    return send(res, 500, { error: err.message });
  }
}

async function getLive(res) {
  const { rows } = await pool.query(
    `SELECT id, title, is_active, stream_url, started_at
     FROM live_sessions
     ORDER BY created_at DESC LIMIT 1`
  );
  if (!rows.length) return send(res, 200, { is_active: false });
  return send(res, 200, rows[0]);
}

async function controlLive(req, res) {
  const auth = authenticate(req);
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!['professor', 'admin'].includes(auth.role))
    return send(res, 403, { error: 'Sem permissão' });

  const action = req.query.action;
  const { title, stream_url } = req.body ?? {};

  if (action === 'start') {
    const { rows } = await pool.query(
      `UPDATE live_sessions SET
         is_active  = true,
         title      = COALESCE($1, title),
         stream_url = $2,
         started_by = $3,
         started_at = now(),
         ended_at   = null
       WHERE id = (SELECT id FROM live_sessions ORDER BY created_at DESC LIMIT 1)
       RETURNING *`,
      [title || 'Live Biscoitê', stream_url || null, auth.sub]
    );
    // Notifica todos sobre a live
    await createNotification({
      title: `🔴 Live ao vivo agora: ${title || 'Live Biscoitê'}`,
      description: 'Clique para assistir ao vivo',
      type: 'live',
      link: '/live',
    });

    return send(res, 200, { ok: true, live: rows[0] });
  }

  if (action === 'stop') {
    const { rows } = await pool.query(
      `UPDATE live_sessions SET
         is_active = false,
         ended_at  = now()
       WHERE id = (SELECT id FROM live_sessions ORDER BY created_at DESC LIMIT 1)
       RETURNING *`
    );
    return send(res, 200, { ok: true, live: rows[0] });
  }

  return send(res, 400, { error: 'action deve ser start ou stop' });
}
