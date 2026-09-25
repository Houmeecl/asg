import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { crearUsuario, exigirAdministrador } from '@/lib/auth';

export async function GET() {
  const admin = await exigirAdministrador();
  if (!admin) return NextResponse.json({ error: 'Solo un administrador puede revisar usuarios.' }, { status: 403 });

  const usuarios = db.prepare(`
    SELECT u.id, u.email, u.nombre, u.rol, u.fecha_registro,
           COALESCE(GROUP_CONCAT(p.permiso), '') AS permisos
    FROM usuarios u
    LEFT JOIN usuario_permisos p ON p.usuario_id = u.id
    GROUP BY u.id
    ORDER BY u.rol = 'ADMIN' DESC, u.nombre
  `).all();
  return NextResponse.json({ usuarios: usuarios.map((usuario) => ({ ...usuario, permisos: usuario.rol === 'ADMIN' ? ['INDUSTRIAL', 'CORREDOR'] : usuario.permisos.split(',').filter(Boolean) })) });
}

export async function POST(request) {
  const admin = await exigirAdministrador();
  if (!admin) return NextResponse.json({ error: 'Solo un administrador puede crear usuarios.' }, { status: 403 });

  try {
    const payload = await request.json();
    const usuario = crearUsuario(payload);
    return NextResponse.json({ usuario, mensaje: 'Usuario creado.' }, { status: 201 });
  } catch (error) {
    const duplicado = String(error.message || '').includes('UNIQUE');
    return NextResponse.json({ error: duplicado ? 'Ya existe un usuario con ese correo.' : error.message }, { status: 400 });
  }
}
