// api/lessons.js
// POST   /api/lessons              — criar aula
// PUT    /api/lessons?id=uuid      — atualizar aula (incluindo vimeoId)
// DELETE /api/lessons?id=uuid      — deletar aula

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
  res.setHeader('Access-Control-Allow-Methods', 'POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const auth = authenticate(req);
  if (!auth) return send(res, 401, { error: 'Não autorizado' });

  const { id } = req.query;
  try {
    if (req.method === 'POST')   return await createLesson(req, res);
    if (req.method === 'PUT')    return await updateLesson(req, res, id);
    if (req.method === 'DELETE') return await deleteLesson(req, res, id);
    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[lessons]', err);
    return send(res, 500, { error: err.message });
  }
}

async function createLesson(req, res) {
  const { moduleId, title, duration, vimeo_id, type = 'video' } = req.body ?? {};
  if (!moduleId || !title) return send(res, 400, { error: 'moduleId e title obrigatórios' });

  const { rows: counts } = await pool.query(
    'SELECT COUNT(*) as count FROM lessons WHERE module_id = $1', [moduleId]
  );
  const order = Number(counts[0].count) + 1;
  // Primeira aula desbloqueada, demais bloqueadas
  const locked = order > 1;

  const { rows } = await pool.query(
    `INSERT INTO lessons (module_id, title, duration, vimeo_id, "order", locked)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [moduleId, title.trim(), duration || null, vimeo_id || null, order, locked]
  );
  return send(res, 201, rows[0]);
}

async function updateLesson(req, res, id) {
  if (!id) return send(res, 400, { error: 'ID obrigatório' });
  const { title, duration, vimeo_id, locked } = req.body ?? {};

  const { rows } = await pool.query(
    `UPDATE lessons SET
       title    = COALESCE($1, title),
       duration = COALESCE($2, duration),
       vimeo_id = COALESCE($3, vimeo_id),
       locked   = COALESCE($4, locked)
     WHERE id = $5 RETURNING *`,
    [title, duration, vimeo_id, locked, id]
  );
  return send(res, 200, rows[0]);
}

async function deleteLesson(req, res, id) {
  if (!id) return send(res, 400, { error: 'ID obrigatório' });
  await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
  return send(res, 200, { ok: true });
}
