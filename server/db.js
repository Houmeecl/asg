// server/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Inicializamos la base de datos local (creará el archivo sicr3p_core.db si no existe)
const dbPath = path.resolve(__dirname, 'sicr3p_core.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SICR3P:', err.message);
    } else {
        console.log('✅ Base de datos SICR3P (SQLite) conectada exitosamente.');
        // Habilitar llaves foráneas en SQLite
        db.run('PRAGMA foreign_keys = ON;');
        inicializarEsquema();
    }
});

function inicializarEsquema() {
    db.serialize(() => {
        // 1. EMPRESAS PROVEEDORAS (Tu cliente directo)
        db.run(`CREATE TABLE IF NOT EXISTS empresas_proveedoras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rut TEXT UNIQUE NOT NULL,
            razon_social TEXT NOT NULL,
            sector_industrial TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. ACTORES INTERESADOS (Mandantes o Bancos)
        db.run(`CREATE TABLE IF NOT EXISTS actores_interesados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_actor TEXT NOT NULL CHECK(tipo_actor IN ('MINERA', 'BANCO', 'INVERSIONISTA')),
            nombre_institucion TEXT NOT NULL,
            requisito_estandar TEXT -- Ej: 'SICEP', 'The Copper Mark', 'Crédito Verde'
        )`);

        // 3. EXPEDIENTES SICR3P (El encargo de auditoría)
        db.run(`CREATE TABLE IF NOT EXISTS expedientes_sicr3p (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            periodo_fiscal TEXT NOT NULL, -- Ej: '2026'
            area_practica TEXT NOT NULL CHECK(area_practica IN ('SUSTAINABILITY_ASSURANCE', 'FORENSIC', 'COMPLIANCE')),
            estado TEXT DEFAULT 'PLANIFICACION' CHECK(estado IN ('PLANIFICACION', 'TRABAJO_CAMPO', 'REVISION', 'DICTAMEN_EMITIDO')),
            fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proveedor_id) REFERENCES empresas_proveedoras(id) ON DELETE CASCADE
        )`);

        // 4. OBJETIVO DEL EXPEDIENTE (Conecta el expediente con el banco o mandante)
        db.run(`CREATE TABLE IF NOT EXISTS objetivo_expediente (
            expediente_id INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            proposito_especifico TEXT, -- Ej: 'Renovación de flota eléctrica'
            PRIMARY KEY (expediente_id, actor_id),
            FOREIGN KEY (expediente_id) REFERENCES expedientes_sicr3p(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES actores_interesados(id) ON DELETE CASCADE
        )`);

        // 5. EVIDENCIAS FORENSES (El Audit Trail Inmutable)
        db.run(`CREATE TABLE IF NOT EXISTS evidencias_forenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id INTEGER NOT NULL,
            tipo_archivo TEXT NOT NULL, -- 'XML_SII', 'PDF_CONTRATO', 'XLSX_RRHH'
            hash_sha256 TEXT NOT NULL, -- Huella criptográfica para inmutabilidad
            categoria_analisis TEXT, -- Ej: 'ALCANCE_1', 'RIESGO_LABORAL'
            resultado_ia TEXT, -- JSON con la respuesta de Ollama o el parser
            fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes_sicr3p(id) ON DELETE CASCADE
        )`);

        console.log('✅ Esquema del Protocolo SICR3P inicializado correctamente.');
    });
}

module.exports = db;