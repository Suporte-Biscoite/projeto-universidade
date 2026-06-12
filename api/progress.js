// api/progress.js
// GET  /api/progress?courseId=uuid  — progresso do usuário no curso
// POST /api/progress                — marca aula como concluída

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

  try {
    if (req.method === 'GET') {
      const { courseId } = req.query;
      if (!courseId) return send(res, 400, { error: 'courseId obrigatório' });

      const { rows } = await pool.query(
        `SELECT lp.lesson_id, lp.completed_at
         FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id
         JOIN modules m ON m.id = l.module_id
         WHERE lp.user_id = $1 AND m.course_id = $2`,
        [auth.sub, courseId]
      );

      return send(res, 200, {
        completed: rows.map(r => r.lesson_id),
        count: rows.length,
      });
    }

    if (req.method === 'POST') {
      const { lessonId, courseId } = req.body ?? {};
      if (!lessonId) return send(res, 400, { error: 'lessonId obrigatório' });

      // Upsert — não duplica se já marcou
      await pool.query(
        `INSERT INTO lesson_progress (user_id, lesson_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, lesson_id) DO NOTHING`,
        [auth.sub, lessonId]
      );

      // Verifica se concluiu o curso inteiro
      if (courseId) {
        const { rows: total } = await pool.query(
          `SELECT COUNT(*) as count FROM lessons l
           JOIN modules m ON m.id = l.module_id
           WHERE m.course_id = $1`,
          [courseId]
        );
        const { rows: done } = await pool.query(
          `SELECT COUNT(*) as count FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           JOIN modules m ON m.id = l.module_id
           WHERE lp.user_id = $1 AND m.course_id = $2`,
          [auth.sub, courseId]
        );

        const courseCompleted = Number(done[0].count) >= Number(total[0].count);
        return send(res, 200, { ok: true, courseCompleted });
      }

      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[progress]', err);
    return send(res, 500, { error: err.message });
  }
}
