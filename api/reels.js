// api/reels.js
// GET    /api/reels           — lista reels ativos (todos autenticados)
// POST   /api/reels           — cria reel (professor/admin)
// DELETE /api/reels?id=uuid   — remove reel (próprio ou admin)

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = authenticate(req);
  if (!auth) return send(res, 401, { error: 'Não autorizado' });

  const { id } = req.query;

  try {
    // GET — lista todos os reels ativos com dados do instrutor
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT r.id, r.caption, r.tag, r.thumbnail_url, r.vimeo_id,
                r.views, r.created_at, r.instructor_id,
                u.name as instructor, u.avatar_url as avatar
         FROM reels r
         LEFT JOIN users u ON u.id = r.instructor_id
         WHERE r.active = true
         ORDER BY r.created_at DESC`
      );
      // Normaliza para o formato esperado pelo frontend
      const normalized = rows.map(r => ({
        ...r,
        thumbnail: r.thumbnail_url,
        image:     r.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400',
        time:      new Date(r.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }),
        views:     r.views || 0,
      }));
      return send(res, 200, normalized);
    }

    // POST — cria reel
    if (req.method === 'POST') {
      if (!['professor', 'admin'].includes(auth.role))
        return send(res, 403, { error: 'Apenas professores e admins podem criar reels' });

      const { caption, tag = 'Dica', thumbnail_url, vimeo_id } = req.body ?? {};
      if (!caption?.trim()) return send(res, 400, { error: 'caption obrigatório' });

      const { rows } = await pool.query(
        `INSERT INTO reels (instructor_id, caption, tag, thumbnail_url, vimeo_id)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [auth.sub, caption.trim(), tag, thumbnail_url || null, vimeo_id || null]
      );

      // Busca dados do instrutor para retornar completo
      const { rows: user } = await pool.query(
        'SELECT name, avatar_url FROM users WHERE id = $1', [auth.sub]
      );

      return send(res, 201, {
        ...rows[0],
        thumbnail: rows[0].thumbnail_url,
        image:     rows[0].thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400',
        instructor: user[0]?.name || '',
        avatar:    user[0]?.avatar_url || '',
        time:      'agora',
        views:     0,
      });
    }

    // DELETE — remove reel (soft delete)
    if (req.method === 'DELETE') {
      if (!id) return send(res, 400, { error: 'id obrigatório' });
      const where = auth.role === 'admin'
        ? 'WHERE id = $1'
        : 'WHERE id = $1 AND instructor_id = $2';
      const params = auth.role === 'admin' ? [id] : [id, auth.sub];
      await pool.query(`UPDATE reels SET active = false ${where}`, params);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[reels]', err);
    return send(res, 500, { error: err.message });
  }
}
