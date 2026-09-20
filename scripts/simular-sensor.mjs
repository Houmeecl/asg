// Simula un sensor IoT que envía una lectura firmada al oráculo.
//
//   node scripts/simular-sensor.mjs <url> <id-dispositivo> <secreto> <valor> [--ts=<ms>] [--firma-mala]
//   ej: node scripts/simular-sensor.mjs http://localhost:3000 1 <secreto> 85
//
// El secreto se muestra una sola vez al crear el dispositivo en el admin. Nunca lo pongas en código versionado.
import crypto from 'crypto';

const [, , url, id, secreto, valor, ...opts] = process.argv;
if (!url || !id || !secreto || valor === undefined) {
    console.error('Uso: node scripts/simular-sensor.mjs <url> <id-dispositivo> <secreto> <valor> [--ts=<ms>] [--firma-mala]');
    process.exit(1);
}

const tsOpt = opts.find((o) => o.startsWith('--ts='));
const ts = tsOpt ? tsOpt.slice(5) : String(Date.now());
const cuerpo = JSON.stringify({ valor: Number(valor) });
let firma = crypto.createHmac('sha256', secreto).update(`${ts}.${cuerpo}`).digest('hex');
if (opts.includes('--firma-mala')) firma = firma.replace(/^./, (c) => (c === '0' ? '1' : '0'));

const res = await fetch(`${url.replace(/\/$/, '')}/api/oraculo/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dispositivo': id, 'x-timestamp': ts, 'x-firma': firma },
    body: cuerpo,
});
console.log(res.status, await res.text());
