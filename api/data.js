// api/data.js
// Consolida: notifications, config (sectors/job_titles) e reels
//
// GET    /api/data?resource=notifications
// POST   /api/data?resource=notifications&action=read|read-all|create
// GET    /api/data?resource=sectors
// GET    /api/data?resource=job_titles
// POST   /api/data?resource=sectors|job_titles          (admin)
// PUT    /api/data?resource=sectors|job_titles&id=uuid  (admin)
// DELETE /api/data?resource=sectors|job_titles&id=uuid  (admin)
// GET    /api/data?resource=reels
// POST   /api/data?resource=reels
// DELETE /api/data?resource=reels&id=uuid

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { resource, action, id } = req.query;
  const auth = authenticate(req);

  try {
    // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
    if (resource === 'notifications') {
      if (!auth) return send(res, 401, { error: 'Não autorizado' });

      if (req.method === 'GET') {
        const { rows } = await pool.query(
          `SELECT id, title, description, type, read, link, created_at
           FROM notifications WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 30`,
          [auth.sub]
        );
        const unread = rows.filter(n => !n.read).length;
        return send(res, 200, { notifications: rows, unread });
      }

      if (req.method === 'POST') {
        if (action === 'read' && id) {
          await pool.query(
            'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
            [id, auth.sub]
          );
          return send(res, 200, { ok: true });
        }
        if (action === 'read-all') {
          await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [auth.sub]);
          return send(res, 200, { ok: true });
        }
        if (action === 'create') {
          if (auth.role !== 'admin') return send(res, 403, { error: 'Sem permissão' });
          const { user_id, title, description, type = 'info', link, roles } = req.body ?? {};
          if (!title) return send(res, 400, { error: 'Título obrigatório' });
          if (user_id) {
            await pool.query(
              'INSERT INTO notifications (user_id, title, description, type, link) VALUES ($1,$2,$3,$4,$5)',
              [user_id, title, description, type, link || null]
            );
          } else if (roles && roles.length > 0) {
            await pool.query(
              `INSERT INTO notifications (user_id, title, description, type, link)
               SELECT id,$1,$2,$3,$4 FROM users
               WHERE active=true AND status='approved' AND role=ANY($5::text[])`,
              [title, description, type, link || null, roles]
            );
          } else {
            await pool.query(
              `INSERT INTO notifications (user_id, title, description, type, link)
               SELECT id,$1,$2,$3,$4 FROM users WHERE active=true AND status='approved'`,
              [title, description, type, link || null]
            );
          }
          return send(res, 201, { ok: true });
        }
      }
    }

    // ── CONFIG (sectors / job_titles) ──────────────────────────────────────────
    if (resource === 'sectors' || resource === 'job_titles') {
      const table = resource === 'sectors' ? 'sectors' : 'job_titles';

      if (req.method === 'GET') {
        const { rows } = await pool.query(
          `SELECT id, name, active FROM ${table} WHERE active=true ORDER BY name ASC`
        );
        return send(res, 200, rows);
      }

      if (!auth) return send(res, 401, { error: 'Não autorizado' });
      if (auth.role !== 'admin') return send(res, 403, { error: 'Apenas admins' });

      if (req.method === 'POST') {
        const { name } = req.body ?? {};
        if (!name?.trim()) return send(res, 400, { error: 'name obrigatório' });
        const { rows } = await pool.query(
          `INSERT INTO ${table} (name) VALUES ($1) RETURNING *`, [name.trim()]
        );
        return send(res, 201, rows[0]);
      }
      if (req.method === 'PUT') {
        if (!id) return send(res, 400, { error: 'id obrigatório' });
        const { name, active } = req.body ?? {};
        const { rows } = await pool.query(
          `UPDATE ${table} SET name=COALESCE($1,name), active=COALESCE($2,active) WHERE id=$3 RETURNING *`,
          [name?.trim() || null, active ?? null, id]
        );
        return send(res, 200, rows[0]);
      }
      if (req.method === 'DELETE') {
        if (!id) return send(res, 400, { error: 'id obrigatório' });
        await pool.query(`UPDATE ${table} SET active=false WHERE id=$1`, [id]);
        return send(res, 200, { ok: true });
      }
    }

    // ── REELS ──────────────────────────────────────────────────────────────────
    if (resource === 'reels') {
      if (!auth) return send(res, 401, { error: 'Não autorizado' });

      if (req.method === 'GET') {
        const { rows } = await pool.query(
          `SELECT r.id, r.caption, r.tag, r.thumbnail_url, r.vimeo_id,
                  r.views, r.created_at, r.instructor_id,
                  u.name as instructor, u.avatar_url as avatar
           FROM reels r
           LEFT JOIN users u ON u.id = r.instructor_id
           WHERE r.active=true ORDER BY r.created_at DESC`
        );
        return send(res, 200, rows.map(r => ({
          ...r,
          thumbnail: r.thumbnail_url,
          image: r.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400',
          time: new Date(r.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }),
        })));
      }

      if (req.method === 'POST') {
        if (!['professor','admin'].includes(auth.role))
          return send(res, 403, { error: 'Apenas professores e admins' });
        const { caption, tag='Dica', thumbnail_url, vimeo_id } = req.body ?? {};
        if (!caption?.trim()) return send(res, 400, { error: 'caption obrigatório' });
        const { rows } = await pool.query(
          `INSERT INTO reels (instructor_id, caption, tag, thumbnail_url, vimeo_id)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [auth.sub, caption.trim(), tag, thumbnail_url || null, vimeo_id || null]
        );
        const { rows: user } = await pool.query(
          'SELECT name, avatar_url FROM users WHERE id=$1', [auth.sub]
        );
        return send(res, 201, {
          ...rows[0],
          thumbnail: rows[0].thumbnail_url,
          image: rows[0].thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400',
          instructor: user[0]?.name || '',
          avatar: user[0]?.avatar_url || '',
          time: 'agora',
          views: 0,
        });
      }

      if (req.method === 'DELETE') {
        if (!id) return send(res, 400, { error: 'id obrigatório' });
        const where = auth.role === 'admin' ? 'WHERE id=$1' : 'WHERE id=$1 AND instructor_id=$2';
        const params = auth.role === 'admin' ? [id] : [id, auth.sub];
        await pool.query(`UPDATE reels SET active=false ${where}`, params);
        return send(res, 200, { ok: true });
      }
    }

    return send(res, 400, { error: 'resource inválido' });
  } catch (err) {
    console.error('[data]', err);
    return send(res, 500, { error: err.message });
  }
}

// ── Helper interno para criar notificações ────────────────────────────────────
export async function createNotification({ user_id, title, description, type='info', link, roles }) {
  try {
    if (user_id) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, description, type, link) VALUES ($1,$2,$3,$4,$5)',
        [user_id, title, description, type, link || null]
      );
    } else if (roles && roles.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, description, type, link)
         SELECT id,$1,$2,$3,$4 FROM users
         WHERE active=true AND status='approved' AND role=ANY($5::text[])`,
        [title, description, type, link || null, roles]
      );
    } else {
      await pool.query(
        `INSERT INTO notifications (user_id, title, description, type, link)
         SELECT id,$1,$2,$3,$4 FROM users WHERE active=true AND status='approved'`,
        [title, description, type, link || null]
      );
    }
  } catch (e) { console.error('[createNotification]', e); }
}
