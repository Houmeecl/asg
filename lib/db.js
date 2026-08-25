// lib/db.js
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'sicr3p.db');

// Singleton en globalThis: Next.js recarga módulos en dev (HMR), esto evita
// abrir múltiples conexiones a la misma base de datos SQLite.
const globalForDb = globalThis;

function inicializarEsquema(db) {
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    db.exec(`
        -- ==========================================
        -- MÓDULO FORENSE (SICR3P clásico)
        -- ==========================================
        CREATE TABLE IF NOT EXISTS empresas_proveedoras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rut TEXT UNIQUE NOT NULL,
            razon_social TEXT NOT NULL,
            sector_industrial TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS actores_interesados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_actor TEXT NOT NULL CHECK(tipo_actor IN ('MINERA', 'BANCO', 'INVERSIONISTA')),
            nombre_institucion TEXT NOT NULL,
            requisito_estandar TEXT
        );

        CREATE TABLE IF NOT EXISTS expedientes_sicr3p (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            periodo_fiscal TEXT NOT NULL,
            area_practica TEXT NOT NULL CHECK(area_practica IN ('SUSTAINABILITY_ASSURANCE', 'FORENSIC', 'COMPLIANCE')),
            estado TEXT DEFAULT 'PLANIFICACION' CHECK(estado IN ('PLANIFICACION', 'TRABAJO_CAMPO', 'REVISION', 'DICTAMEN_EMITIDO')),
            fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proveedor_id) REFERENCES empresas_proveedoras(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS objetivo_expediente (
            expediente_id INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            proposito_especifico TEXT,
            PRIMARY KEY (expediente_id, actor_id),
            FOREIGN KEY (expediente_id) REFERENCES expedientes_sicr3p(id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES actores_interesados(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS evidencias_forenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id INTEGER NOT NULL,
            tipo_archivo TEXT NOT NULL,
            hash_sha256 TEXT NOT NULL,
            nombre_original TEXT,
            ruta_archivo TEXT,
            categoria_analisis TEXT,
            resultado_ia TEXT,
            fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes_sicr3p(id) ON DELETE CASCADE
        );

        -- ==========================================
        -- MÓDULO FLOTA (Rent a Car / Leasing / Maquinaria Pesada / Transporte)
        -- ==========================================
        CREATE TABLE IF NOT EXISTS flota_empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rut TEXT UNIQUE NOT NULL,
            razon_social TEXT NOT NULL,
            ciudad TEXT NOT NULL,
            pais TEXT NOT NULL DEFAULT 'CL' CHECK(pais IN ('CL', 'PE', 'BR')),
            tipo_negocio TEXT NOT NULL CHECK(tipo_negocio IN ('RENT_A_CAR', 'LEASING', 'MAQUINARIA_PESADA', 'TRANSPORTE')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS flota_clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES flota_empresas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flota_activos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            patente TEXT NOT NULL,
            tipo_activo TEXT NOT NULL CHECK(tipo_activo IN ('VEHICULO', 'MAQUINARIA')),
            unidad_medida TEXT NOT NULL CHECK(unidad_medida IN ('KM', 'HORAS')),
            descripcion TEXT,
            tasa_referencia_litros REAL NOT NULL,
            tipo_combustible TEXT NOT NULL DEFAULT 'DIESEL' CHECK(tipo_combustible IN ('DIESEL', 'GASOLINA')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES flota_empresas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flota_contratos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activo_id INTEGER NOT NULL,
            cliente_id INTEGER NOT NULL,
            fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_termino DATETIME,
            dias_renovacion INTEGER NOT NULL DEFAULT 30,
            estado TEXT NOT NULL DEFAULT 'VIGENTE' CHECK(estado IN ('VIGENTE', 'TERMINADO')),
            datos_anonimizados INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (activo_id) REFERENCES flota_activos(id) ON DELETE CASCADE,
            FOREIGN KEY (cliente_id) REFERENCES flota_clientes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flota_renovaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contrato_id INTEGER NOT NULL,
            numero_adhesivo TEXT UNIQUE NOT NULL,
            codigo_qr TEXT UNIQUE NOT NULL,
            fecha_renovacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_vencimiento DATETIME NOT NULL,
            lectura_uso REAL NOT NULL,
            lectura_combustible_litros REAL NOT NULL,
            consumo_esperado_litros REAL NOT NULL,
            discrepancia_pct REAL NOT NULL,
            alcance_ghg TEXT NOT NULL CHECK(alcance_ghg IN ('ALCANCE_1', 'ALCANCE_3')),
            co2_fosil_kg REAL NOT NULL,
            co2_biogenico_kg REAL NOT NULL DEFAULT 0,
            mezcla_biocombustible_pct REAL NOT NULL DEFAULT 0,
            factor_fuente TEXT,
            hash_evidencia TEXT NOT NULL,
            xml_uso_origen TEXT,
            xml_combustible_origen TEXT,
            estado_firma TEXT NOT NULL DEFAULT 'PENDIENTE_FEA' CHECK(estado_firma IN ('PENDIENTE_FEA', 'FIRMADO')),
            auditor_firmante TEXT,
            sellado_tiempo_pendiente INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (contrato_id) REFERENCES flota_contratos(id) ON DELETE CASCADE
        );

        -- ==========================================
        -- USUARIOS (acceso al panel interno)
        -- ==========================================
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nombre TEXT NOT NULL,
            rol TEXT NOT NULL DEFAULT 'AUDITOR' CHECK(rol IN ('AUDITOR', 'ADMIN')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

function getDb() {
    if (!globalForDb.__sicr3pDb) {
        // timeout: Next.js recolecta datos de rutas usando varios workers en PROCESOS
        // separados durante el build — pueden abrir/inicializar el mismo archivo SQLite
        // en paralelo. Sin esto, better-sqlite3 lanza SQLITE_BUSY de inmediato en vez
        // de esperar a que el otro proceso libere el lock.
        const db = new Database(dbPath, { timeout: 10000 });
        inicializarEsquema(db);
        globalForDb.__sicr3pDb = db;
    }
    return globalForDb.__sicr3pDb;
}

export default getDb();
