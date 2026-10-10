import db from '../db.js';

/** Norte grande: Antofagasta, Mejillones y Calama en un mismo lienzo. */
export const MAP_BOUNDS = {
  north: -22.2,
  south: -24.05,
  west: -70.85,
  east: -68.55,
};

const SEED = [
  { tipo: 'POS', alias: 'POS Mall Antofagasta', serial: 'POS-ANTOF-01', lat: -23.646, lng: -70.398, rumbo: 0, velocidad_kmh: 0, estado: 'CONECTADO', bateria: 92, senal: 80, metrica: 'cobros_hora', valor: 6 },
  { tipo: 'POS', alias: 'POS Puerto Mejillones', serial: 'POS-MEJI-01', lat: -23.098, lng: -70.453, rumbo: 0, velocidad_kmh: 0, estado: 'CONECTADO', bateria: 74, senal: 61, metrica: 'cobros_hora', valor: 2 },
  { tipo: 'POS', alias: 'POS Calama plaza', serial: 'POS-CALA-01', lat: -22.457, lng: -68.929, rumbo: 0, velocidad_kmh: 0, estado: 'EN_PRUEBA', bateria: 88, senal: 70, metrica: 'cobros_hora', valor: 1 },
  { tipo: 'GPS', alias: 'GPS ruta 5 norte', serial: 'GPS-R5-14', lat: -23.6, lng: -70.39, rumbo: 18, velocidad_kmh: 78, estado: 'CONECTADO', bateria: 81, senal: 75, metrica: 'velocidad', valor: 78 },
  { tipo: 'GPS', alias: 'GPS corredor Calama', serial: 'GPS-R5-22', lat: -22.5, lng: -68.95, rumbo: 40, velocidad_kmh: 86, estado: 'CONECTADO', bateria: 64, senal: 58, metrica: 'velocidad', valor: 86 },
  { tipo: 'GPS', alias: 'GPS desvío pampa', serial: 'GPS-DESVIO-03', lat: -23.28, lng: -69.55, rumbo: 140, velocidad_kmh: 54, estado: 'ALERTA', bateria: 41, senal: 33, metrica: 'velocidad', valor: 54 },
  { tipo: 'IOT', alias: 'Sensor bodega Antofagasta', serial: 'IOT-BOD-01', lat: -23.62, lng: -70.39, rumbo: 0, velocidad_kmh: 0, estado: 'CONECTADO', bateria: 96, senal: 84, metrica: 'temperatura_c', valor: 21.4 },
  { tipo: 'IOT', alias: 'Sensor muelle Mejillones', serial: 'IOT-PTO-02', lat: -23.09, lng: -70.44, rumbo: 0, velocidad_kmh: 0, estado: 'CONECTADO', bateria: 70, senal: 55, metrica: 'humedad_pct', valor: 68 },
  { tipo: 'IOT', alias: 'Medidor energía Calama', serial: 'IOT-ENE-03', lat: -22.47, lng: -68.91, rumbo: 0, velocidad_kmh: 0, estado: 'CONECTADO', bateria: 100, senal: 77, metrica: 'voltaje', valor: 220 },
];

const GEOCERCAS = [
  { nombre: 'Antofagasta urbano', lat: -23.65, lng: -70.4, radio_m: 22000, color: '#7ac943' },
  { nombre: 'Puerto Mejillones', lat: -23.1, lng: -70.45, radio_m: 12000, color: '#175cd3' },
  { nombre: 'Calama', lat: -22.46, lng: -68.93, radio_m: 18000, color: '#6B5CF6' },
];

function distanciaM(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function dentroDeAlguna(lat, lng, cercas) {
  return cercas.some((g) => distanciaM(lat, lng, g.lat, g.lng) <= g.radio_m);
}

function ensureM2MSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS baas_unidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('POS','GPS','IOT')),
      alias TEXT NOT NULL,
      serial TEXT UNIQUE NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      rumbo REAL NOT NULL DEFAULT 0,
      velocidad_kmh REAL NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'CONECTADO'
        CHECK(estado IN ('DESCONECTADO','CONECTADO','EN_PRUEBA','ALERTA')),
      bateria INTEGER,
      senal INTEGER,
      metrica TEXT,
      valor REAL,
      comercio_rut TEXT,
      terminal_id INTEGER,
      ultimo_latido DATETIME DEFAULT CURRENT_TIMESTAMP,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS baas_telemetria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unidad_id INTEGER NOT NULL,
      lat REAL, lng REAL, metrica TEXT, valor REAL, detalle TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS baas_geocercas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
      radio_m INTEGER NOT NULL, color TEXT NOT NULL DEFAULT '#6B5CF6'
    );
  `);
}

export function seedRedM2M() {
  ensureM2MSchema();
  const marcada = db.prepare("SELECT id FROM baas_unidades WHERE serial = 'GPS-R5-14'").get();
  if (!marcada) {
    const insert = db.prepare(`
      INSERT INTO baas_unidades
        (tipo, alias, serial, lat, lng, rumbo, velocidad_kmh, estado, bateria, senal, metrica, valor, ultimo_latido)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ahora = new Date().toISOString();
    for (const u of SEED) {
      insert.run(u.tipo, u.alias, u.serial, u.lat, u.lng, u.rumbo, u.velocidad_kmh, u.estado, u.bateria, u.senal, u.metrica, u.valor, ahora);
    }
  }
  const cercas = db.prepare('SELECT COUNT(*) AS n FROM baas_geocercas').get().n;
  if (!cercas) {
    const insert = db.prepare(`
      INSERT INTO baas_geocercas (nombre, lat, lng, radio_m, color) VALUES (?, ?, ?, ?, ?)
    `);
    for (const g of GEOCERCAS) insert.run(g.nombre, g.lat, g.lng, g.radio_m, g.color);
  } else {
    const upd = db.prepare('UPDATE baas_geocercas SET radio_m = ? WHERE nombre = ?');
    for (const g of GEOCERCAS) upd.run(g.radio_m, g.nombre);
  }
  const escoltas = [
    { serial: 'GPS-R5-14', lat: -23.6, lng: -70.39, anclaLat: -23.65, anclaLng: -70.4, radio: 20000 },
    { serial: 'GPS-R5-22', lat: -22.5, lng: -68.95, anclaLat: -22.46, anclaLng: -68.93, radio: 16000 },
  ];
  const poner = db.prepare("UPDATE baas_unidades SET lat = ?, lng = ?, estado = 'CONECTADO' WHERE serial = ?");
  for (const e of escoltas) {
    const u = db.prepare('SELECT lat, lng FROM baas_unidades WHERE serial = ?').get(e.serial);
    if (u && distanciaM(u.lat, u.lng, e.anclaLat, e.anclaLng) > e.radio) poner.run(e.lat, e.lng, e.serial);
  }
}

export function listUnidades() {
  return db.prepare('SELECT * FROM baas_unidades ORDER BY tipo, alias').all();
}

export function listGeocercas() {
  return db.prepare('SELECT * FROM baas_geocercas ORDER BY id').all();
}

function anotarTelemetria(unidad, { lat, lng, metrica, valor, detalle }) {
  db.prepare(`
    INSERT INTO baas_telemetria (unidad_id, lat, lng, metrica, valor, detalle)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(unidad.id, lat ?? unidad.lat, lng ?? unidad.lng, metrica || unidad.metrica, valor ?? unidad.valor, detalle || null);
  db.prepare(`
    DELETE FROM baas_telemetria
    WHERE unidad_id = ?
      AND id NOT IN (SELECT id FROM baas_telemetria WHERE unidad_id = ? ORDER BY id DESC LIMIT 24)
  `).run(unidad.id, unidad.id);
}

/** Cada POS registrado entra a la red M2M. Sin coordenadas, cae junto a Antofagasta. */
export function syncPosEnRed(terminal, coords = {}) {
  if (!terminal?.serial) return null;
  seedRedM2M();
  const existente = db.prepare('SELECT * FROM baas_unidades WHERE serial = ?').get(terminal.serial);
  if (existente) {
    if (existente.tipo === 'POS') {
      db.prepare(`
        UPDATE baas_unidades
        SET alias = ?, estado = ?, terminal_id = ?, comercio_rut = ?, ultimo_latido = ?
        WHERE id = ?
      `).run(terminal.alias, terminal.estado, terminal.id, terminal.comercio_rut || null, terminal.ultimo_latido, existente.id);
    }
    return db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(existente.id);
  }
  const lat = coords.lat ?? (-23.652 + ((terminal.id % 5) - 2) * 0.015);
  const lng = coords.lng ?? (-70.4 + ((terminal.id % 3) - 1) * 0.015);
  const info = db.prepare(`
    INSERT INTO baas_unidades
      (tipo, alias, serial, lat, lng, estado, bateria, senal, metrica, valor, comercio_rut, terminal_id, ultimo_latido)
    VALUES ('POS', ?, ?, ?, ?, ?, 90, 70, 'cobros_hora', 0, ?, ?, ?)
  `).run(terminal.alias, terminal.serial, lat, lng, terminal.estado, terminal.comercio_rut || null, terminal.id, terminal.ultimo_latido);
  return db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(info.lastInsertRowid);
}

export function vincularTerminalesSueltas() {
  const terminales = db.prepare('SELECT * FROM baas_terminales').all();
  for (const t of terminales) syncPosEnRed(t);
}

export function registrarUnidad({ tipo, alias, serial, lat, lng, metrica }) {
  if (!alias || !serial) throw new Error('Alias y serial son requeridos');
  if (!['POS', 'GPS', 'IOT'].includes(tipo)) throw new Error('Tipo inválido');
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) throw new Error('Latitud y longitud son requeridas');
  const existing = db.prepare('SELECT * FROM baas_unidades WHERE serial = ?').get(serial.trim());
  if (existing) return existing;
  const info = db.prepare(`
    INSERT INTO baas_unidades
      (tipo, alias, serial, lat, lng, estado, bateria, senal, metrica, valor, velocidad_kmh, rumbo, ultimo_latido)
    VALUES (?, ?, ?, ?, ?, 'CONECTADO', 85, 72, ?, 0, ?, 0, ?)
  `).run(
    tipo,
    alias.trim(),
    serial.trim(),
    latN,
    lngN,
    metrica || (tipo === 'IOT' ? 'temperatura_c' : tipo === 'GPS' ? 'velocidad' : 'cobros_hora'),
    tipo === 'GPS' ? 40 : 0,
    new Date().toISOString(),
  );
  return db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(info.lastInsertRowid);
}

export function capturarLectura({ id, metrica, valor }) {
  const unidad = db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(id);
  if (!unidad) throw new Error('Unidad no encontrada');
  const valorN = Number(valor);
  if (!Number.isFinite(valorN)) throw new Error('Valor numérico requerido');
  const nombre = (metrica || unidad.metrica || 'lectura').trim();
  db.prepare(`
    UPDATE baas_unidades
    SET metrica = ?, valor = ?, estado = 'CONECTADO', ultimo_latido = ?
    WHERE id = ?
  `).run(nombre, valorN, new Date().toISOString(), unidad.id);
  anotarTelemetria(unidad, { metrica: nombre, valor: valorN, detalle: 'captura operador' });
  return db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(unidad.id);
}

export function setUnidadEstado(id, estado) {
  const unidad = db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(id);
  if (!unidad) throw new Error('Unidad no encontrada');
  db.prepare(`
    UPDATE baas_unidades SET estado = ?, ultimo_latido = ? WHERE id = ?
  `).run(estado, new Date().toISOString(), id);
  return db.prepare('SELECT * FROM baas_unidades WHERE id = ?').get(id);
}

/** Avanza GPS y refresca sensores. Un GPS fuera de geocerca queda en alerta. */
export function tickRedM2M() {
  seedRedM2M();
  const cercas = listGeocercas();
  const unidades = db.prepare("SELECT * FROM baas_unidades WHERE estado != 'DESCONECTADO'").all();
  const ahora = new Date().toISOString();
  for (const u of unidades) {
    if (u.tipo === 'GPS') {
      const rad = ((u.rumbo || 0) * Math.PI) / 180;
      let lat = u.lat + Math.cos(rad) * 0.006;
      let lng = u.lng + Math.sin(rad) * 0.006;
      let rumbo = u.rumbo || 0;
      if (lat > MAP_BOUNDS.north || lat < MAP_BOUNDS.south || lng < MAP_BOUNDS.west || lng > MAP_BOUNDS.east) {
        rumbo = (rumbo + 180) % 360;
        lat = Math.min(MAP_BOUNDS.north - 0.02, Math.max(MAP_BOUNDS.south + 0.02, u.lat));
        lng = Math.min(MAP_BOUNDS.east - 0.02, Math.max(MAP_BOUNDS.west + 0.02, u.lng));
      } else {
        rumbo = (rumbo + ((u.id % 5) - 2) * 3 + 360) % 360;
      }
      const adentro = dentroDeAlguna(lat, lng, cercas);
      const estado = adentro ? 'CONECTADO' : 'ALERTA';
      const velocidad = Math.max(20, Math.round((u.velocidad_kmh || 50) + ((u.id % 3) - 1) * 2));
      db.prepare(`
        UPDATE baas_unidades
        SET lat = ?, lng = ?, rumbo = ?, velocidad_kmh = ?, valor = ?, estado = ?, ultimo_latido = ?
        WHERE id = ?
      `).run(lat, lng, rumbo, velocidad, velocidad, estado, ahora, u.id);
      anotarTelemetria({ ...u, lat, lng }, { lat, lng, metrica: 'velocidad', valor: velocidad, detalle: adentro ? 'en geocerca' : 'fuera de geocerca' });
    } else if (u.tipo === 'IOT') {
      const centro = u.metrica === 'voltaje' ? 220 : u.metrica === 'humedad_pct' ? 68 : 21.4;
      const amplitud = u.metrica === 'voltaje' ? 2.5 : 1.1;
      const valor = Math.round((centro + Math.sin(Date.now() / 8000 + u.id) * amplitud) * 10) / 10;
      db.prepare(`
        UPDATE baas_unidades SET valor = ?, ultimo_latido = ? WHERE id = ?
      `).run(valor, ahora, u.id);
      anotarTelemetria(u, { metrica: u.metrica, valor, detalle: 'latido iot' });
    } else {
      db.prepare('UPDATE baas_unidades SET ultimo_latido = ? WHERE id = ?').run(ahora, u.id);
    }
  }
  return listUnidades();
}

export function recorridosGps() {
  const gps = db.prepare("SELECT id FROM baas_unidades WHERE tipo = 'GPS'").all();
  const stmt = db.prepare(`
    SELECT lat, lng FROM baas_telemetria
    WHERE unidad_id = ? AND lat IS NOT NULL
    ORDER BY id DESC LIMIT 16
  `);
  const out = {};
  for (const g of gps) {
    out[g.id] = stmt.all(g.id).reverse();
  }
  return out;
}

export function mensajesRecientes(limit = 18) {
  return db.prepare(`
    SELECT t.id, t.unidad_id, t.lat, t.lng, t.metrica, t.valor, t.detalle, t.creado_en,
           u.alias, u.tipo, u.serial, u.estado
    FROM baas_telemetria t
    JOIN baas_unidades u ON u.id = t.unidad_id
    ORDER BY t.id DESC
    LIMIT ?
  `).all(limit);
}

export function analisisCapas() {
  const porTipo = db.prepare(`
    SELECT tipo, COUNT(*) AS n,
           SUM(CASE WHEN estado = 'CONECTADO' THEN 1 ELSE 0 END) AS conectadas,
           SUM(CASE WHEN estado = 'ALERTA' THEN 1 ELSE 0 END) AS alertas
    FROM baas_unidades
    GROUP BY tipo
  `).all();
  const alertas = db.prepare("SELECT COUNT(*) AS n FROM baas_unidades WHERE estado = 'ALERTA'").get().n;
  const lecturas = db.prepare('SELECT COUNT(*) AS n FROM baas_telemetria').get().n;
  const cobros = db.prepare(`
    SELECT estado, COUNT(*) AS n, COALESCE(SUM(monto_clp), 0) AS monto
    FROM baas_operaciones GROUP BY estado
  `).all();
  const kyc = db.prepare('SELECT kyc_estado, COUNT(*) AS n FROM baas_personas GROUP BY kyc_estado').all();
  return { porTipo, alertas, lecturas, cobros, kyc };
}

export function snapshotCapas() {
  seedRedM2M();
  vincularTerminalesSueltas();
  return {
    bounds: MAP_BOUNDS,
    unidades: listUnidades(),
    geocercas: listGeocercas(),
    recorridos: recorridosGps(),
    mensajes: mensajesRecientes(),
    analisis: analisisCapas(),
  };
}
