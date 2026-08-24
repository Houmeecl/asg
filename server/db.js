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

        // 6. EMPRESAS DE FLOTA (Rent a Car / Leasing / Maquinaria Pesada)
        db.run(`CREATE TABLE IF NOT EXISTS flota_empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rut TEXT UNIQUE NOT NULL,
            razon_social TEXT NOT NULL,
            ciudad TEXT NOT NULL,
            tipo_negocio TEXT NOT NULL CHECK(tipo_negocio IN ('RENT_A_CAR', 'LEASING', 'MAQUINARIA_PESADA', 'TRANSPORTE')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 7. CLIENTES DE FLOTA (Solo nombre — dato mínimo, sin RUT obligatorio)
        db.run(`CREATE TABLE IF NOT EXISTS flota_clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES flota_empresas(id) ON DELETE CASCADE
        )`);

        // 8. ACTIVOS (Vehículo o Maquinaria) — pertenecen a la empresa de flota
        db.run(`CREATE TABLE IF NOT EXISTS flota_activos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            patente TEXT NOT NULL,
            tipo_activo TEXT NOT NULL CHECK(tipo_activo IN ('VEHICULO', 'MAQUINARIA')),
            unidad_medida TEXT NOT NULL CHECK(unidad_medida IN ('KM', 'HORAS')), -- KM=odómetro, HORAS=horómetro
            descripcion TEXT, -- Ej: 'Retroexcavadora CAT 320', 'Camioneta Hilux'
            tasa_referencia_litros REAL NOT NULL, -- L/km o L/hora según fabricante, para calcular consumo esperado
            tipo_combustible TEXT NOT NULL DEFAULT 'DIESEL' CHECK(tipo_combustible IN ('DIESEL', 'GASOLINA')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES flota_empresas(id) ON DELETE CASCADE
        )`);

        // 9. CONTRATOS DE ARRIENDO/LEASING (Vincula activo + cliente)
        db.run(`CREATE TABLE IF NOT EXISTS flota_contratos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activo_id INTEGER NOT NULL,
            cliente_id INTEGER NOT NULL,
            fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_termino DATETIME,
            dias_renovacion INTEGER NOT NULL DEFAULT 30, -- cada cuántos días debe renovarse el adhesivo
            estado TEXT NOT NULL DEFAULT 'VIGENTE' CHECK(estado IN ('VIGENTE', 'TERMINADO')),
            datos_anonimizados INTEGER NOT NULL DEFAULT 0, -- 0/1: si ya se aplicó anonimización post-Ley 21.719 al terminar
            FOREIGN KEY (activo_id) REFERENCES flota_activos(id) ON DELETE CASCADE,
            FOREIGN KEY (cliente_id) REFERENCES flota_clientes(id) ON DELETE CASCADE
        )`);

        // 10. RENOVACIONES (Adhesivo/QR periódico — como "revisión técnica") + certificado + evidencia
        db.run(`CREATE TABLE IF NOT EXISTS flota_renovaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contrato_id INTEGER NOT NULL,
            numero_adhesivo TEXT UNIQUE NOT NULL, -- código físico del adhesivo/credencial
            codigo_qr TEXT UNIQUE NOT NULL, -- identificador único codificado en el QR
            fecha_renovacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_vencimiento DATETIME NOT NULL, -- próxima renovación exigida
            lectura_uso REAL NOT NULL, -- km u horas declaradas desde la renovación anterior
            lectura_combustible_litros REAL NOT NULL,
            consumo_esperado_litros REAL NOT NULL, -- lectura_uso * tasa_referencia_litros del activo
            discrepancia_pct REAL NOT NULL, -- (declarado - esperado) / esperado
            alcance_ghg TEXT NOT NULL CHECK(alcance_ghg IN ('ALCANCE_1', 'ALCANCE_3')), -- según tipo_negocio de la empresa
            co2_kg REAL NOT NULL,
            hash_evidencia TEXT NOT NULL, -- SHA-256 de los XML de origen (uso + combustible)
            xml_uso_origen TEXT, -- XML crudo recibido (distancia/horómetro)
            xml_combustible_origen TEXT, -- XML crudo recibido (combustible)
            estado_firma TEXT NOT NULL DEFAULT 'PENDIENTE_FEA' CHECK(estado_firma IN ('PENDIENTE_FEA', 'FIRMADO')),
            auditor_firmante TEXT, -- nombre/matrícula del Contador Auditor que firma
            sellado_tiempo_pendiente INTEGER NOT NULL DEFAULT 1, -- 0/1: TODO — requiere integrar TSA acreditado (Acepta.com / ENCE)
            FOREIGN KEY (contrato_id) REFERENCES flota_contratos(id) ON DELETE CASCADE
        )`);

        console.log('✅ Esquema del Protocolo SICR3P inicializado correctamente.');
    });
}

module.exports = db;