// api/config.js
// GET  /api/config?type=sectors|job_titles  — lista itens
// POST /api/config                          — cria item (admin)
// PUT  /api/config?id=uuid                  — edita item (admin)
// DELETE /api/config?id=uuid               — remove item (admin)

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

function getTable(type) {
  if (type === 'sectors')    return 'sectors';
  if (type === 'job_titles') return 'job_titles';
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { type, id } = req.query;

  try {
    // GET — público, qualquer usuário autenticado pode listar
    if (req.method === 'GET') {
      const table = getTable(type);
      if (!table) return send(res, 400, { error: 'type deve ser sectors ou job_titles' });
      const { rows } = await pool.query(
        `SELECT id, name, active FROM ${table} WHERE active = true ORDER BY name ASC`
      );
      return send(res, 200, rows);
    }

    // Demais métodos exigem admin
    const auth = authenticate(req);
    if (!auth) return send(res, 401, { error: 'Não autorizado' });
    if (auth.role !== 'admin') return send(res, 403, { error: 'Apenas admins' });

    if (req.method === 'POST') {
      const { name, type: bodyType } = req.body ?? {};
      const table = getTable(bodyType || type);
      if (!table || !name?.trim()) return send(res, 400, { error: 'name e type obrigatórios' });
      const { rows } = await pool.query(
        `INSERT INTO ${table} (name) VALUES ($1) RETURNING *`,
        [name.trim()]
      );
      return send(res, 201, rows[0]);
    }

    if (req.method === 'PUT') {
      const { name, active, type: bodyType } = req.body ?? {};
      const table = getTable(bodyType || type);
      if (!table || !id) return send(res, 400, { error: 'type e id obrigatórios' });
      const { rows } = await pool.query(
        `UPDATE ${table} SET
           name   = COALESCE($1, name),
           active = COALESCE($2, active)
         WHERE id = $3 RETURNING *`,
        [name?.trim() || null, active ?? null, id]
      );
      return send(res, 200, rows[0]);
    }

    if (req.method === 'DELETE') {
      const { type: bodyType } = req.body ?? {};
      const table = getTable(bodyType || type);
      if (!table || !id) return send(res, 400, { error: 'type e id obrigatórios' });
      // Soft delete — apenas desativa
      await pool.query(`UPDATE ${table} SET active = false WHERE id = $1`, [id]);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[config]', err);
    return send(res, 500, { error: err.message });
  }
}
