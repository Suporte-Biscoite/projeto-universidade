// api/courses.js
// GET    /api/courses              — lista cursos publicados
// GET    /api/courses?id=uuid      — curso com módulos e aulas
// POST   /api/courses              — criar curso (professor/admin)
// PUT    /api/courses?id=uuid      — atualizar curso
// DELETE /api/courses?id=uuid      — deletar curso

import pool from './db.js';
import { createNotification } from './data.js';
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
  const { id, sub } = req.query;
  try {
    const auth = authenticate(req);

    // Módulos consolidados: /api/courses?sub=modules
    if (sub === 'modules') {
      if (req.method === 'GET')    return await getModules(res, req.query.courseId);
      if (req.method === 'POST')   return await createModule(req, res, auth);
      if (req.method === 'PUT')    return await updateModule(req, res, auth, id);
      if (req.method === 'DELETE') return await deleteModule(req, res, auth, id);
    }

    // Aulas consolidadas: /api/courses?sub=lessons
    if (sub === 'lessons') {
      if (req.method === 'POST')   return await createLesson(req, res, auth);
      if (req.method === 'PUT')    return await updateLesson(req, res, auth, id);
      if (req.method === 'DELETE') return await deleteLesson(req, res, auth, id);
    }

    // Progresso consolidado: /api/courses?sub=progress
    if (sub === 'progress') {
      if (req.method === 'GET')    return await getProgress(req, res, auth);
      if (req.method === 'POST')   return await markProgress(req, res, auth);
    }

    if (req.method === 'GET')    return await getCourses(req, res, id, auth);
    if (req.method === 'POST')   return await createCourse(req, res, auth);
    if (req.method === 'PUT')    return await updateCourse(req, res, auth, id);
    if (req.method === 'DELETE') return await deleteCourse(req, res, auth, id);
    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[courses]', err);
    return send(res, 500, { error: err.message });
  }
}

async function getCourses(req, res, id, auth) {
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

  // Lista todos cursos — professor vê todos seus, aluno vê publicados
  const isInstructor = ['professor', 'admin'].includes(auth?.role);
  // Prioriza instructor_name salvo manualmente; fallback para nome do usuário logado
  const query = isInstructor
    ? `SELECT c.*, COALESCE(c.instructor_name, u.name) as instructor_name
       FROM courses c
       LEFT JOIN users u ON u.id::text = c.instructor_id::text
       ORDER BY c.created_at DESC`
    : `SELECT c.*, COALESCE(c.instructor_name, u.name) as instructor_name
       FROM courses c
       LEFT JOIN users u ON u.id::text = c.instructor_id::text
       WHERE c.published = true
       ORDER BY c.created_at DESC`;

  const { rows } = await pool.query(query);

  // Carrega módulos e aulas para cada curso
  for (const course of rows) {
    const { rows: mods } = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY "order"',
      [course.id]
    );
    for (const mod of mods) {
      const { rows: lessons } = await pool.query(
        'SELECT * FROM lessons WHERE module_id = $1 ORDER BY "order"',
        [mod.id]
      );
      mod.lessons = lessons;
    }
    course.modules = mods;
  }

  return send(res, 200, rows);
}

async function createCourse(req, res, auth) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!['professor', 'admin'].includes(auth.role))
    return send(res, 403, { error: 'Sem permissão' });

  const { title, description, category, level, format, duration, thumbnail_url, vimeo_id, published, visibility, instructor } = req.body ?? {};
  if (!title) return send(res, 400, { error: 'Título obrigatório' });

  const vis = Array.isArray(visibility) && visibility.length
    ? visibility
    : ['aluno','gestor','professor','admin'];

  const { rows } = await pool.query(
    `INSERT INTO courses (title, description, category, level, format, duration,
                          thumbnail_url, vimeo_id, instructor_id, instructor_name,
                          published, visibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [title, description, category, level, format, duration,
     thumbnail_url || null, vimeo_id || null, auth.sub, instructor || null,
     Boolean(published), vis]
  );
  // Se publicado, notifica usuários com acesso baseado na visibilidade
  if (Boolean(published) && rows[0]) {
    const course = rows[0];
    const visibility = course.visibility || ['aluno','gestor','professor','admin'];
    // Busca usuários que têm acesso ao curso
    await pool.query(
      `INSERT INTO notifications (user_id, title, description, type, link)
       SELECT id, $1, $2, 'course', $3
       FROM users
       WHERE active = true AND status = 'approved'
       AND role = ANY($4::text[])`,
      [
        `Novo curso disponível: ${course.title}`,
        `Um novo curso foi publicado. Confira agora!`,
        `/player?id=${course.id}`,
        visibility,
      ]
    ).catch(() => {});
  }
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

  const { title, description, category, level, format, duration, thumbnail_url, vimeo_id, published, instructor, visibility } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE courses SET
       title           = COALESCE($1, title),
       description     = COALESCE($2, description),
       category        = COALESCE($3, category),
       level           = COALESCE($4, level),
       format          = COALESCE($5, format),
       duration        = COALESCE($6, duration),
       thumbnail_url   = COALESCE($7, thumbnail_url),
       vimeo_id        = COALESCE($8, vimeo_id),
       instructor_name = $9,
       published       = COALESCE($10, published),
       visibility      = COALESCE($11, visibility),
       updated_at      = now()
     WHERE id = $12 RETURNING *`,
    [title, description, category, level, format, duration,
     thumbnail_url || null, vimeo_id || null,
     instructor || null,
     published, visibility || null, id]
  );
  // Se publicação foi ativada neste update, notifica
  if (published === true && rows[0] && !rows[0].published === false) {
    const course = rows[0];
    const vis = course.visibility || ['aluno','gestor','professor','admin'];
    await pool.query(
      `INSERT INTO notifications (user_id, title, description, type, link)
       SELECT id, $1, $2, 'course', $3
       FROM users
       WHERE active = true AND status = 'approved'
       AND role = ANY($4::text[])
       AND id NOT IN (
         SELECT user_id FROM notifications
         WHERE link = $3 AND type = 'course'
       )`,
      [
        `Novo curso disponível: ${course.title}`,
        `Um novo curso foi publicado. Confira agora!`,
        `/player?id=${course.id}`,
        vis,
      ]
    ).catch(() => {});
  }
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

// ── MODULES ───────────────────────────────────────────────────────────────────
async function getModules(res, courseId) {
  if (!courseId) return send(res, 400, { error: 'courseId obrigatório' });
  const { rows } = await pool.query(
    `SELECT m.*, json_agg(l.* ORDER BY l."order") FILTER (WHERE l.id IS NOT NULL) as lessons
     FROM modules m LEFT JOIN lessons l ON l.module_id = m.id
     WHERE m.course_id = $1 GROUP BY m.id ORDER BY m."order"`, [courseId]
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
  const { rows } = await pool.query(
    'INSERT INTO modules (course_id, title, "order") VALUES ($1,$2,$3) RETURNING *',
    [courseId, title.trim(), Number(counts[0].count) + 1]
  );
  return send(res, 201, { ...rows[0], lessons: [] });
}

async function updateModule(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });
  const { title } = req.body ?? {};
  const { rows } = await pool.query(
    'UPDATE modules SET title=$1 WHERE id=$2 RETURNING *', [title, id]
  );
  return send(res, 200, rows[0]);
}

async function deleteModule(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });
  await pool.query('DELETE FROM modules WHERE id=$1', [id]);
  return send(res, 200, { ok: true });
}

// ── LESSONS ───────────────────────────────────────────────────────────────────
async function createLesson(req, res, auth) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  const { moduleId, title, duration, vimeo_id, type='video', visibility } = req.body ?? {};
  if (!moduleId || !title) return send(res, 400, { error: 'moduleId e title obrigatórios' });
  const { rows: counts } = await pool.query(
    'SELECT COUNT(*) as count FROM lessons WHERE module_id=$1', [moduleId]
  );
  const order = Number(counts[0].count) + 1;
  const vis = Array.isArray(visibility) && visibility.length ? visibility : ['aluno','gestor','professor','admin'];
  const { rows } = await pool.query(
    `INSERT INTO lessons (module_id, title, duration, vimeo_id, "order", locked, visibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [moduleId, title.trim(), duration || null, vimeo_id || null, order, order > 1, vis]
  );
  return send(res, 201, rows[0]);
}

async function updateLesson(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });
  const { title, duration, vimeo_id, locked, visibility } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE lessons SET
       title=COALESCE($1,title), duration=COALESCE($2,duration),
       vimeo_id=COALESCE($3,vimeo_id), locked=COALESCE($4,locked),
       visibility=COALESCE($5,visibility)
     WHERE id=$6 RETURNING *`,
    [title, duration, vimeo_id, locked, visibility || null, id]
  );
  return send(res, 200, rows[0]);
}

async function deleteLesson(req, res, auth, id) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  if (!id)   return send(res, 400, { error: 'ID obrigatório' });
  await pool.query('DELETE FROM lessons WHERE id=$1', [id]);
  return send(res, 200, { ok: true });
}

// ── PROGRESS ──────────────────────────────────────────────────────────────────
async function getProgress(req, res, auth) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  const { courseId } = req.query;
  if (!courseId) return send(res, 400, { error: 'courseId obrigatório' });
  const { rows } = await pool.query(
    `SELECT lp.lesson_id FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id
     JOIN modules m ON m.id = l.module_id
     WHERE lp.user_id=$1 AND m.course_id=$2`,
    [auth.sub, courseId]
  );
  return send(res, 200, { completed: rows.map(r => r.lesson_id), count: rows.length });
}

async function markProgress(req, res, auth) {
  if (!auth) return send(res, 401, { error: 'Não autorizado' });
  const { lessonId, courseId } = req.body ?? {};
  if (!lessonId) return send(res, 400, { error: 'lessonId obrigatório' });

  await pool.query(
    `INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1,$2)
     ON CONFLICT (user_id, lesson_id) DO NOTHING`,
    [auth.sub, lessonId]
  );

  if (courseId) {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) as count FROM lessons l
       JOIN modules m ON m.id=l.module_id WHERE m.course_id=$1`, [courseId]
    );
    const { rows: done } = await pool.query(
      `SELECT COUNT(*) as count FROM lesson_progress lp
       JOIN lessons l ON l.id=lp.lesson_id
       JOIN modules m ON m.id=l.module_id
       WHERE lp.user_id=$1 AND m.course_id=$2`, [auth.sub, courseId]
    );
    const courseCompleted = Number(done[0].count) >= Number(total[0].count);
    if (courseCompleted) {
      const { rows: c } = await pool.query('SELECT title FROM courses WHERE id=$1', [courseId]);
      await createNotification({
        user_id: auth.sub,
        title: `Parabéns! Você concluiu "${c[0]?.title || 'curso'}" 🎉`,
        description: 'Seu progresso foi registrado. Continue aprendendo!',
        type: 'certificate',
        link: '/certificados',
      });
    }
    return send(res, 200, { ok: true, courseCompleted });
  }
  return send(res, 200, { ok: true });
}
