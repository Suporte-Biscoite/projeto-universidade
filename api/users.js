// api/users.js
// GET    /api/users              — lista usuários (admin)
// GET    /api/users?id=uuid      — dados do usuário logado
// POST   /api/users              — criar usuário (admin)
// PUT    /api/users?id=uuid      — atualizar usuário
// DELETE /api/users?id=uuid      — desativar usuário (admin)

import pool from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function authenticate(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try { return jwt.verify(header.slice(7), process.env.JWT_SECRET); }
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

  const user = authenticate(req);
  if (!user) return send(res, 401, { error: 'Não autorizado' });

  const { id } = req.query;

  try {
    if (req.method === 'GET')    return await getUsers(req, res, user, id);
    if (req.method === 'POST')   return await createUser(req, res, user);
    if (req.method === 'PUT')    return await updateUser(req, res, user, id);
    if (req.method === 'DELETE') return await deleteUser(req, res, user, id);
    return send(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    console.error('[users]', err);
    return send(res, 500, { error: err.message });
  }
}

async function getUsers(req, res, auth, id) {
  // Busca usuário específico (próprio perfil ou admin buscando qualquer um)
  if (id) {
    if (auth.sub !== id && auth.role !== 'admin')
      return send(res, 403, { error: 'Sem permissão' });

    const { rows } = await pool.query(
      'SELECT id, name, email, role, unit, store_id, active, instructor_id, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    if (!rows.length) return send(res, 404, { error: 'Usuário não encontrado' });
    return send(res, 200, rows[0]);
  }

  // Lista todos — só admin
  if (auth.role !== 'admin')
    return send(res, 403, { error: 'Sem permissão' });

  const { rows } = await pool.query(
    'SELECT id, name, email, role, unit, store_id, active, instructor_id, avatar_url, created_at FROM users ORDER BY created_at DESC'
  );
  return send(res, 200, rows);
}

async function createUser(req, res, auth) {
  if (auth.role !== 'admin')
    return send(res, 403, { error: 'Apenas admin pode criar usuários' });

  const { name, email, password, role = 'aluno', unit, store_id, instructor_id } = req.body ?? {};
  if (!name || !email || !password)
    return send(res, 400, { error: 'Nome, email e senha são obrigatórios' });
  if (password.length < 8)
    return send(res, 400, { error: 'Senha deve ter no mínimo 8 caracteres' });

  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]
  );
  if (existing.length) return send(res, 409, { error: 'Email já cadastrado' });

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, unit, store_id, instructor_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, name, email, role, unit, store_id, active, instructor_id`,
    [name.trim(), email.toLowerCase().trim(), hash, role, unit || null, store_id || null, instructor_id || null]
  );
  return send(res, 201, rows[0]);
}

async function updateUser(req, res, auth, id) {
  if (!id) return send(res, 400, { error: 'ID obrigatório' });

  // Usuário só edita o próprio perfil; admin edita qualquer um
  if (auth.sub !== id && auth.role !== 'admin')
    return send(res, 403, { error: 'Sem permissão' });

  const { name, email, password, role, unit, store_id, active, avatar_url, instructor_id } = req.body ?? {};

  // Apenas admin pode mudar role e active
  const updates = [];
  const values  = [];
  let i = 1;

  if (name)       { updates.push(`name = $${i++}`);       values.push(name.trim()); }
  if (email)      { updates.push(`email = $${i++}`);      values.push(email.toLowerCase().trim()); }
  if (unit)       { updates.push(`unit = $${i++}`);       values.push(unit); }
  if (store_id !== undefined) { updates.push(`store_id = $${i++}`); values.push(store_id); }
  if (avatar_url) { updates.push(`avatar_url = $${i++}`); values.push(avatar_url); }
  if (instructor_id !== undefined) { updates.push(`instructor_id = $${i++}`); values.push(instructor_id); }

  // Só admin muda role e active
  if (auth.role === 'admin') {
    if (role)            { updates.push(`role = $${i++}`);   values.push(role); }
    if (active !== undefined) { updates.push(`active = $${i++}`); values.push(active); }
  }

  // Troca de senha
  if (password) {
    if (password.length < 8) return send(res, 400, { error: 'Senha deve ter no mínimo 8 caracteres' });
    const hash = await bcrypt.hash(password, 12);
    updates.push(`password_hash = $${i++}`);
    values.push(hash);
  }

  if (!updates.length) return send(res, 400, { error: 'Nenhum campo para atualizar' });

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = now()
     WHERE id = $${i}
     RETURNING id, name, email, role, unit, store_id, active, instructor_id, avatar_url`,
    values
  );
  if (!rows.length) return send(res, 404, { error: 'Usuário não encontrado' });
  return send(res, 200, rows[0]);
}

async function deleteUser(req, res, auth, id) {
  if (auth.role !== 'admin')
    return send(res, 403, { error: 'Apenas admin pode desativar usuários' });
  if (!id) return send(res, 400, { error: 'ID obrigatório' });

  // Soft delete — não apaga, só desativa
  await pool.query('UPDATE users SET active = false WHERE id = $1', [id]);
  return send(res, 200, { ok: true });
}
