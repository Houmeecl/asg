// scripts/init-db.mjs
// Se ejecuta UNA vez, en un solo proceso, antes de `next dev`/`next build`
// (via los scripts predev/prebuild de package.json). Evita que los ~13 procesos
// worker que Next.js usa para recolectar datos de rutas compitan por crear e
// inicializar el mismo archivo SQLite en paralelo (causaba SQLITE_BUSY incluso
// con busy_timeout, porque la carrera ocurre en la creación del archivo mismo).
import '../lib/db.js';

console.log('[init-db] Base de datos SICR3P inicializada.');
