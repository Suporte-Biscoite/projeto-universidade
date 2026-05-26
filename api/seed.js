// api/seed.js — popula usuários iniciais no banco
// ATENÇÃO: deletar este arquivo após rodar uma vez!

import { createPool } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Use POST' });

  const pool = createPool();

  try {
    const users = [
      { name: 'Karla Madeira',   email: 'karla@biscoite.com',   password: 'Biscoite@2025',  role: 'admin',     unit: 'Unidade Eldorado', instructor_id: 'karla_yuasa'     },
      { name: 'Marcos Ferreira', email: 'marcos@biscoite.com',  password: 'Professor@2025', role: 'professor', unit: 'Unidade Centro',   instructor_id: 'marcos_ferreira' },
      { name: 'Ana Costa',       email: 'ana@biscoite.com',      password: 'Aluno@2025',     role: 'aluno',     unit: 'Unidade Moema',    instructor_id: null              },
      { name: 'Paula Ribeiro',   email: 'paula@biscoite.com',    password: 'Gestor@2025',    role: 'gestor',    unit: 'Gestora Regional', instructor_id: null              },
      { name: 'Juliana Ferro',   email: 'juliana@biscoite.com',  password: 'Aluno@2025',     role: 'aluno',     unit: 'Unidade Tatuapé',  instructor_id: null              },
    ];

    const created = [];
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 12);
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, unit, active, instructor_id)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, name, email, role`,
        [u.name, u.email, hash, u.role, u.unit, u.instructor_id]
      );
      if (rows[0]) created.push(rows[0]);
    }

    return res.status(200).json({
      ok: true,
      message: `${created.length} usuário(s) criado(s)`,
      created,
    });

  } catch (err) {
    console.error('[seed]', err);
    return res.status(500).json({ error: err.message });
  }
}