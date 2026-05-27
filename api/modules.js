// api/modules.js
// GET    /api/modules?courseId=uuid  — módulos de um curso
// POST   /api/modules                — criar módulo
// PUT    /api/modules?id=uuid        — atualizar módulo
// DELETE /api/modules?id=uuid        — deletar módulo

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
  const auth = authenticate(req);
  const { id, courseId } = req.query;

  try {
    if (req.method === 'GET')    return await getModules(res, courseId);
    if (req.method === 'POST')   return await createModule(req, res, auth);
    if (req.method === 'PUT')    return await updateModule(req, res, auth, id);
    if (req.method === 'DELETE') return await deleteModule(req, res, auth, id);
    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[modules]', err);
    return send(res, 500, { error: err.message });
  }
}

async function getModules(res, courseId) {
  if (!courseId) return send(res, 400, { error: 'courseId obrigatório' });
  const { rows } = await pool.query(
    `SELECT m.*, json_agg(l.* ORDER BY l."order") FILTER (WHERE l.id IS NOT NULL) as lessons
     FROM modules m
     LEFT JOIN lessons l ON l.module_id = m.id
     WHERE m.course_id = $1
     GROUP BY m.id
     ORDER BY m."order"`, [courseId]
  );
  return send(res, 200, rows);
}

async function createModule(req, res, auth) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  const { courseId, title } = req.body ?? {};
  if (!courseId || !title) return send(res, 400, { error: 'courseId e title obrigatórios' });

  const { rows: counts } = await pool.query(
    'SELECT COUNT(*) as count FROM modules WHERE course_id = $1', [courseId]
  );
  const order = Number(counts[0].count) + 1;

  const { rows } = await pool.query(
    'INSERT INTO modules (course_id, title, "order") VALUES ($1,$2,$3) RETURNING *',
    [courseId, title.trim(), order]
  );
  return send(res, 201, { ...rows[0], lessons: [] });
}

async function updateModule(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });
  const { title } = req.body ?? {};
  const { rows } = await pool.query(
    'UPDATE modules SET title = $1 WHERE id = $2 RETURNING *', [title, id]
  );
  return send(res, 200, rows[0]);
}

async function deleteModule(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });
  await pool.query('DELETE FROM modules WHERE id = $1', [id]);
  return send(res, 200, { ok: true });
}
