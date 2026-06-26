// api/stores.js
// GET    /api/stores              — lista todas as lojas ativas
// GET    /api/stores?type=propria — filtra por tipo
// POST   /api/stores              — criar loja (admin)
// PUT    /api/stores?id=uuid      — editar loja (admin)
// DELETE /api/stores?id=uuid      — desativar loja (admin)

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

  try {
    if (req.method === 'GET')    return await getStores(req, res);

    // Demais métodos exigem autenticação como admin
    const auth = authenticate(req);
    if (!auth) return send(res, 401, { error: 'Não autorizado' });
    if (auth.role !== 'admin') return send(res, 403, { error: 'Apenas admins podem gerenciar lojas' });

    if (req.method === 'POST')   return await createStore(req, res);
    if (req.method === 'PUT')    return await updateStore(req, res);
    if (req.method === 'DELETE') return await deleteStore(req, res);

    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[stores]', err);
    return send(res, 500, { error: err.message });
  }
}

async function getStores(req, res) {
  const { type, id } = req.query;

  if (id) {
    const { rows } = await pool.query(
      'SELECT * FROM stores WHERE id = $1', [id]
    );
    if (!rows.length) return send(res, 404, { error: 'Loja não encontrada' });
    return send(res, 200, rows[0]);
  }

  let query = 'SELECT * FROM stores WHERE active = true';
  const params = [];

  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }

  query += ' ORDER BY type, name';

  const { rows } = await pool.query(query, params);
  return send(res, 200, rows);
}

async function createStore(req, res) {
  const { name, type } = req.body ?? {};
  if (!name?.trim()) return send(res, 400, { error: 'Nome é obrigatório' });
  if (!['propria', 'franquia'].includes(type))
    return send(res, 400, { error: 'Tipo deve ser propria ou franquia' });

  const { rows } = await pool.query(
    `INSERT INTO stores (name, type) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET active = true, type = $2
     RETURNING *`,
    [name.trim().toUpperCase(), type]
  );
  return send(res, 201, rows[0]);
}

async function updateStore(req, res) {
  const { id } = req.query;
  if (!id) return send(res, 400, { error: 'ID obrigatório' });

  const { name, type, active } = req.body ?? {};
  const updates = [];
  const values  = [];
  let i = 1;

  if (name !== undefined)   { updates.push(`name = $${i++}`);   values.push(name.trim().toUpperCase()); }
  if (type !== undefined)   { updates.push(`type = $${i++}`);   values.push(type); }
  if (active !== undefined) { updates.push(`active = $${i++}`); values.push(active); }

  if (!updates.length) return send(res, 400, { error: 'Nenhum campo para atualizar' });

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE stores SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows.length) return send(res, 404, { error: 'Loja não encontrada' });
  return send(res, 200, rows[0]);
}

async function deleteStore(req, res) {
  const { id } = req.query;
  if (!id) return send(res, 400, { error: 'ID obrigatório' });

  // Soft delete — não apaga, só desativa
  await pool.query('UPDATE stores SET active = false WHERE id = $1', [id]);
  return send(res, 200, { ok: true });
}
