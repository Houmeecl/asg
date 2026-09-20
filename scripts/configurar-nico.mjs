// Configura las credenciales de la API de Nico Seguros en .env.local.
// Se ejecuta EN TU TERMINAL: te pide el correo y la contraseña (oculta) y las escribe en tu máquina.
//
//   node scripts/configurar-nico.mjs
//
// .env.local está en .gitignore: no se sube a git. Las credenciales solo las lee el servidor.
import readline from 'readline';
import fs from 'fs';
import path from 'path';

function preguntar(pregunta, { oculto = false } = {}) {
    return new Promise((resolver) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        if (oculto) {
            // Muestra * en vez de lo que escribes.
            rl._writeToOutput = (s) => {
                if (s.includes(pregunta) || s === '\r\n' || s === '\n') process.stdout.write(s);
                else process.stdout.write('*');
            };
        }
        rl.question(pregunta, (r) => { rl.close(); resolver(r.trim()); });
    });
}

const archivo = path.resolve(process.cwd(), '.env.local');
const gitignore = path.resolve(process.cwd(), '.gitignore');
if (fs.existsSync(gitignore) && !/^\.env\*?/m.test(fs.readFileSync(gitignore, 'utf8'))) {
    console.error('Aviso: .gitignore no parece ignorar .env.local. Agrégalo antes de continuar para no subir tus credenciales.');
    process.exit(1);
}

const email = await preguntar('Correo de tu usuario en Nico: ');
const password = await preguntar('Contraseña de Nico (no se muestra): ', { oculto: true });
console.log('');
if (!email || !password) {
    console.error('Faltan datos; no se escribió nada.');
    process.exit(1);
}

const nuevas = { NICO_API_EMAIL: email, NICO_API_PASSWORD: password };
const lineas = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8').split(/\r?\n/) : [];
const resto = lineas.filter((l) => !Object.keys(nuevas).some((k) => l.startsWith(`${k}=`)) && l !== '');
const salida = [...resto, ...Object.entries(nuevas).map(([k, v]) => `${k}=${v}`)].join('\n') + '\n';
fs.writeFileSync(archivo, salida);

console.log(`Listo: credenciales guardadas en ${archivo}`);
console.log('Reinicia el servidor y usa "Probar conexión" en /seguros-parametricos/admin.');
