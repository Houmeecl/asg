// Asigna o retira el rol ADMIN del sitio de seguros. Solo se puede hacer con acceso al servidor:
// el registro público NUNCA otorga este rol.
//
//   node scripts/seg-admin.mjs correo@empresa.cl            -> hace ADMIN a un usuario ya registrado
//   node scripts/seg-admin.mjs correo@empresa.cl --quitar   -> lo vuelve CLIENTE
//   node scripts/seg-admin.mjs --listar                     -> lista los administradores
import Database from 'better-sqlite3';
import path from 'path';

const [, , arg, flag] = process.argv;
if (!arg) {
    console.error('Uso: node scripts/seg-admin.mjs <correo> [--quitar]  |  --listar');
    process.exit(1);
}

const db = new Database(path.resolve(process.cwd(), 'data', 'sicr3p.db'), { timeout: 10000 });

const tabla = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='seg_usuarios'`).get();
if (!tabla) {
    console.error('Todavía no existe la tabla seg_usuarios. Inicia la app y crea tu cuenta en /seguros-parametricos/ingresar primero.');
    process.exit(1);
}
if (!db.prepare(`PRAGMA table_info(seg_usuarios)`).all().some((c) => c.name === 'rol')) {
    db.exec(`ALTER TABLE seg_usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'CLIENTE'`);
}

if (arg === '--listar') {
    const admins = db.prepare(`SELECT email, nombre FROM seg_usuarios WHERE rol = 'ADMIN'`).all();
    console.log(admins.length ? admins.map((a) => `${a.email} (${a.nombre})`).join('\n') : 'No hay administradores.');
    process.exit(0);
}

const email = arg.trim().toLowerCase();
const rol = flag === '--quitar' ? 'CLIENTE' : 'ADMIN';
const r = db.prepare(`UPDATE seg_usuarios SET rol = ? WHERE email = ?`).run(rol, email);
if (r.changes === 0) {
    console.error(`No existe un usuario con el correo ${email}. Debe registrarse primero en el sitio.`);
    process.exit(1);
}
console.log(`${email} ahora es ${rol}.`);
