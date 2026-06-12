// api/courses.js
// GET    /api/courses              — lista cursos publicados
// GET    /api/courses?id=uuid      — curso com módulos e aulas
// POST   /api/courses              — criar curso (professor/admin)
// PUT    /api/courses?id=uuid      — atualizar curso
// DELETE /api/courses?id=uuid      — deletar curso

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
  const { id } = req.query;
  try {
    if (req.method === 'GET')    return await getCourses(req, res, id);
    if (req.method === 'POST')   return await createCourse(req, res, authenticate(req));
    if (req.method === 'PUT')    return await updateCourse(req, res, authenticate(req), id);
    if (req.method === 'DELETE') return await deleteCourse(req, res, authenticate(req), id);
    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[courses]', err);
    return send(res, 500, { error: err.message });
  }
}

async function getCourses(req, res, id) {
  // Curso específico com módulos e aulas
  if (id) {
    const { rows: courses } = await pool.query(
      `SELECT c.*, u.name as instructor_name, u.avatar_url as instructor_avatar
       FROM courses c
       LEFT JOIN users u ON u.id::text = c.instructor_id OR u.instructor_id = c.instructor_id
       WHERE c.id = $1`, [id]
    );
    if (!courses.length) return send(res, 404, { error: 'Curso não encontrado' });

    const { rows: modules } = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY "order"', [id]
    );
    for (const mod of modules) {
      const { rows: lessons } = await pool.query(
        'SELECT * FROM lessons WHERE module_id = $1 ORDER BY "order"', [mod.id]
      );
      mod.lessons = lessons;
    }
    return send(res, 200, { ...courses[0], modules });
  }

  // Lista todos publicados
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.description, c.category, c.level, c.format,
            c.duration, c.thumbnail_url, c.vimeo_id, c.instructor_id, c.published,
            u.name as instructor_name,
            COUNT(DISTINCT m.id) as module_count,
            COUNT(DISTINCT l.id) as lesson_count
     FROM courses c
     LEFT JOIN users u ON u.instructor_id = c.instructor_id
     LEFT JOIN modules m ON m.course_id = c.id
     LEFT JOIN lessons l ON l.module_id = m.id
     WHERE c.published = true
     GROUP BY c.id, u.name
     ORDER BY c.created_at DESC`
  );
  return send(res, 200, rows);
}

async function createCourse(req, res, auth) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!['professor', 'admin'].includes(auth.role))
    return send(res, 403, { error: 'Sem permissão' });

  const { title, description, category, level, format, duration, thumbnail_url, vimeo_id, published, visibility } = req.body ?? {};
  if (!title) return send(res, 400, { error: 'Título obrigatório' });

  const { rows } = await pool.query(
    `INSERT INTO courses (title, description, category, level, format, duration, thumbnail_url, vimeo_id, instructor_id, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [title, description, category, level, format, duration, thumbnail_url, vimeo_id, auth.sub, Boolean(published)]
  );
  return send(res, 201, rows[0]);
}

async function updateCourse(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });

  // Professor só edita os próprios cursos
  const where = auth.role === 'admin' ? 'WHERE id = $1' : 'WHERE id = $1 AND instructor_id = $2';
  const check = auth.role === 'admin' ? [id] : [id, auth.sub];
  const { rows: existing } = await pool.query(`SELECT id FROM courses ${where}`, check);
  if (!existing.length) return send(res, 403, { error: 'Sem permissão ou curso não encontrado' });

  const { title, description, category, level, format, duration, thumbnail_url, vimeo_id, published } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE courses SET
       title         = COALESCE($1, title),
       description   = COALESCE($2, description),
       category      = COALESCE($3, category),
       level         = COALESCE($4, level),
       format        = COALESCE($5, format),
       duration      = COALESCE($6, duration),
       thumbnail_url = COALESCE($7, thumbnail_url),
       vimeo_id      = COALESCE($8, vimeo_id),
       published     = COALESCE($9, published),
       visibility    = COALESCE($10, visibility),
       updated_at    = now()
     WHERE id = $11 RETURNING *`,
    [title, description, category, level, format, duration, thumbnail_url, vimeo_id, published, visibility || null, id]
  );
  return send(res, 200, rows[0]);
}

async function deleteCourse(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });

  const where = auth.role === 'admin' ? 'WHERE id = $1' : 'WHERE id = $1 AND instructor_id = $2';
  const params = auth.role === 'admin' ? [id] : [id, auth.sub];
  await pool.query(`DELETE FROM courses ${where}`, params);
  return send(res, 200, { ok: true });
}
