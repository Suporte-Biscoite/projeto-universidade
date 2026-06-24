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
           FROM notifications WHERE user_id = $1 AND read = false
           ORDER BY created_at DESC LIMIT 30`,
          [auth.sub]
        );
        return send(res, 200, { notifications: rows, unread: rows.length });
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
        if (action === 'delete' && id) {
          await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, auth.sub]);
          return send(res, 200, { ok: true });
        }
        if (action === 'delete-all') {
          await pool.query('DELETE FROM notifications WHERE user_id = $1', [auth.sub]);
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

    // ── CERTIFICATES ──────────────────────────────────────────────────────────
    // GET /api/data?resource=certificates          — lista do usuário
    // GET /api/data?resource=certificates&id=uuid  — busca por ID (público)
    if (resource === 'certificates') {
      if (req.method === 'GET') {
        // Busca por ID — validação pública sem auth
        if (id) {
          const { rows } = await pool.query(
            `SELECT c.id, c.issued_at,
                    COALESCE(NULLIF(c.user_name,''), u.name, 'Colaborador') as user_name,
                    COALESCE(NULLIF(c.course_title,''), co.title, 'Curso') as course_title,
                    u.avatar_url
             FROM certificates c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN courses co ON co.id = c.course_id
             WHERE c.id = $1`,
            [id]
          );
          if (!rows.length) return send(res, 404, { error: 'Certificado não encontrado' });
          return send(res, 200, rows[0]);
        }
        // Lista do usuário logado
        if (!auth) return send(res, 401, { error: 'Não autorizado' });
        const { rows } = await pool.query(
          `SELECT c.id, c.course_id, c.issued_at,
                  COALESCE(NULLIF(c.user_name,''), u.name, 'Colaborador') as user_name,
                  COALESCE(NULLIF(c.course_title,''), co.title, 'Curso') as course_title,
                  co.thumbnail_url, co.category, co.level, co.duration
           FROM certificates c
           LEFT JOIN courses co ON co.id = c.course_id
           LEFT JOIN users u ON u.id = c.user_id
           WHERE c.user_id = $1
           ORDER BY c.issued_at DESC`,
          [auth.sub]
        );
        return send(res, 200, rows);
      }
    }

    // ── FAVORITES ─────────────────────────────────────────────────────────────
    // GET    /api/data?resource=favorites          — lista favoritos do usuário
    // POST   /api/data?resource=favorites          — adiciona favorito
    // DELETE /api/data?resource=favorites&id=uuid  — remove favorito
    if (resource === 'favorites') {
      if (!auth) return send(res, 401, { error: 'Não autorizado' });

      if (req.method === 'GET') {
        const { rows } = await pool.query(
          `SELECT f.course_id, c.title, c.description, c.category, c.level,
                  c.format, c.duration, c.thumbnail_url, c.vimeo_id,
                  c.published, c.instructor_name, f.created_at
           FROM user_favorites f
           JOIN courses c ON c.id = f.course_id
           WHERE f.user_id = $1
           ORDER BY f.created_at DESC`,
          [auth.sub]
        );
        return send(res, 200, rows);
      }

      if (req.method === 'POST') {
        const { courseId } = req.body ?? {};
        if (!courseId) return send(res, 400, { error: 'courseId obrigatório' });
        await pool.query(
          `INSERT INTO user_favorites (user_id, course_id) VALUES ($1,$2)
           ON CONFLICT (user_id, course_id) DO NOTHING`,
          [auth.sub, courseId]
        );
        return send(res, 200, { ok: true });
      }

      if (req.method === 'DELETE') {
        const courseId = id || req.body?.courseId;
        if (!courseId) return send(res, 400, { error: 'courseId obrigatório' });
        await pool.query(
          'DELETE FROM user_favorites WHERE user_id=$1 AND course_id=$2',
          [auth.sub, courseId]
        );
        return send(res, 200, { ok: true });
      }
    }

    // ── NEWSLETTER ────────────────────────────────────────────────────────────
    // POST /api/data?resource=newsletter — inscreve email na newsletter
    if (resource === 'newsletter') {
      if (req.method === 'POST') {
        const { email } = req.body ?? {};
        if (!email?.includes('@')) return send(res, 400, { error: 'Email inválido' });

        // Salva no banco
        await pool.query(
          `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )`
        );
        await pool.query(
          `INSERT INTO newsletter_subscribers (email) VALUES ($1)
           ON CONFLICT (email) DO NOTHING`,
          [email.toLowerCase().trim()]
        );

        // Envia email de confirmação via Resend
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM || 'noreply@biscolab.tech',
              to: [email],
              subject: 'Bem-vindo à newsletter da Universidade Biscoitê! 🎓',
              html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
                <h2 style="color:#001A26;">Obrigado por se inscrever!</h2>
                <p>Você agora faz parte da newsletter da <strong>Universidade Biscoitê</strong>.</p>
                <p>Em breve você receberá novidades sobre cursos, lives e muito mais.</p>
                <div style="background:#e2eef9;border-radius:12px;padding:16px;margin-top:20px;">
                  <p style="color:#4A72B2;margin:0;font-size:13px;">Acesse a plataforma em <a href="https://projeto-universidade-chi.vercel.app" style="color:#4A72B2;">projeto-universidade-chi.vercel.app</a></p>
                </div>
              </div>`,
            }),
          });
        } catch (e) { console.error('newsletter email error:', e); }

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
