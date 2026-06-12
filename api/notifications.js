// api/notifications.js
// GET  /api/notifications              — lista notificações do usuário logado
// POST /api/notifications?action=read&id=uuid  — marca como lida
// POST /api/notifications?action=read-all      — marca todas como lidas
// POST /api/notifications?action=create        — cria notificação (interno/admin)

import pool from './db.js';
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

  const auth = authenticate(req);
  if (!auth) return send(res, 401, { error: 'Não autorizado' });

  const { action, id } = req.query;

  try {
    // GET — lista notificações do usuário
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT id, title, description, type, read, link, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 30`,
        [auth.sub]
      );
      const unread = rows.filter(n => !n.read).length;
      return send(res, 200, { notifications: rows, unread });
    }

    if (req.method === 'POST') {
      // Marcar uma como lida
      if (action === 'read' && id) {
        await pool.query(
          'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
          [id, auth.sub]
        );
        return send(res, 200, { ok: true });
      }

      // Marcar todas como lidas
      if (action === 'read-all') {
        await pool.query(
          'UPDATE notifications SET read = true WHERE user_id = $1',
          [auth.sub]
        );
        return send(res, 200, { ok: true });
      }

      // Criar notificação — apenas admin
      if (action === 'create') {
        if (auth.role !== 'admin') return send(res, 403, { error: 'Sem permissão' });
        const { user_id, title, description, type = 'info', link } = req.body ?? {};
        if (!title) return send(res, 400, { error: 'Título obrigatório' });

        if (user_id) {
          // Notificação para usuário específico
          await pool.query(
            'INSERT INTO notifications (user_id, title, description, type, link) VALUES ($1,$2,$3,$4,$5)',
            [user_id, title, description, type, link]
          );
        } else {
          // Notificação global — cria para todos os usuários ativos
          await pool.query(
            `INSERT INTO notifications (user_id, title, description, type, link)
             SELECT id, $1, $2, $3, $4 FROM users WHERE active = true AND status = 'approved'`,
            [title, description, type, link]
          );
        }
        return send(res, 201, { ok: true });
      }
    }

    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[notifications]', err);
    return send(res, 500, { error: err.message });
  }
}

// ── Helper exportado para outras APIs usarem internamente ──────────────────────
export async function createNotification({ user_id, title, description, type = 'info', link }) {
  try {
    if (user_id) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, description, type, link) VALUES ($1,$2,$3,$4,$5)',
        [user_id, title, description, type, link || null]
      );
    } else {
      // Global
      await pool.query(
        `INSERT INTO notifications (user_id, title, description, type, link)
         SELECT id, $1, $2, $3, $4 FROM users WHERE active = true AND status = 'approved'`,
        [title, description, type, link || null]
      );
    }
  } catch (e) {
    console.error('[createNotification]', e);
  }
}
