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

        CREATE TABLE IF NOT EXISTS usuario_permisos (
            usuario_id INTEGER NOT NULL,
            permiso TEXT NOT NULL CHECK(permiso IN ('INDUSTRIAL', 'CORREDOR')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (usuario_id, permiso),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );

        -- ==========================================
        -- NÚCLEO INDUSTRIAL / CBAM / CORREDOR
        -- La evidencia se organiza por el hecho que ocurrió: instalación,
        -- producto, período y lote. No representa certificación externa.
        -- ==========================================
        CREATE TABLE IF NOT EXISTS instalaciones_industriales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            direccion TEXT,
            comuna TEXT,
            pais TEXT NOT NULL DEFAULT 'CL',
            activa INTEGER NOT NULL DEFAULT 1,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proveedor_id) REFERENCES empresas_proveedoras(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS expedientes_industriales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            instalacion_id INTEGER,
            flujo TEXT NOT NULL CHECK(flujo IN ('PROVEEDOR_MINERO', 'CBAM', 'CORREDOR_BIOCEANICO')),
            periodo TEXT NOT NULL,
            producto TEXT NOT NULL,
            lote TEXT,
            codigo_cn TEXT,
            pais_origen TEXT NOT NULL DEFAULT 'CL',
            pais_destino TEXT,
            estado TEXT NOT NULL DEFAULT 'ABIERTO' CHECK(estado IN ('ABIERTO', 'EN_REVISION', 'PREPARADO_PARA_TERCERO', 'CERRADO')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proveedor_id) REFERENCES empresas_proveedoras(id) ON DELETE CASCADE,
            FOREIGN KEY (instalacion_id) REFERENCES instalaciones_industriales(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS evidencias_industriales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id INTEGER NOT NULL,
            bloque TEXT NOT NULL CHECK(bloque IN ('EMPRESA_INSTALACION', 'VENTA', 'MATERIAL', 'ENERGIA', 'COMBUSTIBLE', 'PRODUCCION', 'ENTREGA')),
            concepto TEXT NOT NULL,
            valor TEXT,
            unidad TEXT,
            periodo TEXT,
            fuente TEXT,
            responsable TEXT,
            nivel_respaldo TEXT NOT NULL DEFAULT 'DECLARADO' CHECK(nivel_respaldo IN ('DECLARADO', 'DOCUMENTADO', 'VALIDADO_EN_FUENTE')),
            nombre_original TEXT,
            hash_sha256 TEXT,
            ruta_archivo TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes_industriales(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS hitos_corredor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id INTEGER NOT NULL,
            etapa TEXT NOT NULL CHECK(etapa IN ('PRODUCTOR_ORIGEN', 'EXPORTADOR', 'TRANSPORTE', 'ADUANA_PUERTO', 'IMPORTADOR_DESTINO')),
            actor TEXT NOT NULL,
            pais TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'DOCUMENTADO', 'VALIDADO_EN_FUENTE')),
            referencia TEXT,
            norma_referencia TEXT,
            documento_requerido TEXT,
            fecha_hito TEXT,
            FOREIGN KEY (expediente_id) REFERENCES expedientes_industriales(id) ON DELETE CASCADE
        );

        -- Biblioteca normativa versionada. La fuente legal, su versión y su
        -- huella se conservan separadas de la evidencia aportada por el cliente.
        CREATE TABLE IF NOT EXISTS fuentes_normativas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clave TEXT NOT NULL UNIQUE,
            titulo TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('REGLAMENTO', 'GUIA', 'VALOR_POR_DEFECTO', 'BENCHMARK')),
            jurisdiccion TEXT NOT NULL,
            referencia_legal TEXT,
            version TEXT,
            fecha_publicacion TEXT,
            vinculante INTEGER NOT NULL DEFAULT 0,
            ruta_archivo TEXT,
            hash_sha256 TEXT,
            url_oficial TEXT,
            nota_uso TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Filas normalizadas de las planillas oficiales. Los valores por
        -- defecto y benchmarks son referencias, nunca evidencia real de una instalación.
        CREATE TABLE IF NOT EXISTS valores_cbam_referencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fuente_id INTEGER NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('VALOR_POR_DEFECTO', 'BENCHMARK')),
            pais TEXT,
            sector TEXT,
            codigo_cn TEXT,
            codigo_cn_normalizado TEXT,
            descripcion TEXT,
            ruta_produccion TEXT,
            emisiones_directas REAL,
            emisiones_indirectas REAL,
            emisiones_totales REAL,
            benchmark_a REAL,
            ruta_benchmark_a TEXT,
            benchmark_b REAL,
            ruta_benchmark_b TEXT,
            unidad TEXT NOT NULL DEFAULT 'tCO2e/t de mercancía',
            valor_bruto TEXT,
            fila_hash TEXT NOT NULL UNIQUE,
            FOREIGN KEY (fuente_id) REFERENCES fuentes_normativas(id) ON DELETE CASCADE
        );

        -- Catálogo operativo del Corredor Bioceánico. Describe el tipo de
        -- evidencia por país; no pretende sustituir normativa local.
        CREATE TABLE IF NOT EXISTS paises_corredor (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            rol_logistico TEXT NOT NULL,
            evidencia_base TEXT NOT NULL
        );

        -- Bitácora encadenada de acciones del núcleo industrial. El hash
        -- acredita la secuencia e integridad del registro, no la veracidad
        -- material de los datos declarados por el cliente.
        CREATE TABLE IF NOT EXISTS trazabilidad_industrial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id INTEGER,
            usuario_id INTEGER,
            entidad TEXT NOT NULL,
            entidad_id INTEGER,
            accion TEXT NOT NULL,
            detalle_json TEXT NOT NULL,
            hash_anterior TEXT,
            hash_evento TEXT NOT NULL UNIQUE,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes_industriales(id) ON DELETE SET NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        );

        -- Evaluación EUDR para cargas del Corredor Bioceánico. Identifica si
        -- un producto puede quedar dentro del Reglamento (UE) 2023/1115 y qué
        -- evidencia de origen, legalidad y geolocalización debe prepararse.
        CREATE TABLE IF NOT EXISTS eudr_corredor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id INTEGER NOT NULL,
            aplica TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(aplica IN ('PENDIENTE', 'NO_APLICA', 'APLICA')),
            producto_relevante TEXT,
            codigo_hs TEXT,
            materia_prima TEXT,
            pais_produccion TEXT,
            geolocalizacion TEXT,
            documento_legalidad TEXT,
            referencia_dds TEXT,
            nivel_riesgo TEXT NOT NULL DEFAULT 'NO_EVALUADO' CHECK(nivel_riesgo IN ('NO_EVALUADO', 'BAJO', 'ESTANDAR', 'ALTO')),
            observacion TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expediente_id) REFERENCES expedientes_industriales(id) ON DELETE CASCADE
        );

        -- ==========================================
        -- ANTĀi: administración interna de cuentas prepago
        -- Los saldos son un registro operativo interno. No representan una
        -- cuenta bancaria ni habilitan pagos externos sin la integración y
        -- cumplimiento contractual correspondientes.
        -- ==========================================
        CREATE TABLE IF NOT EXISTS antai_clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rut TEXT UNIQUE NOT NULL,
            razon_social TEXT NOT NULL,
            email_contacto TEXT,
            telefono TEXT,
            tipo_cliente TEXT NOT NULL DEFAULT 'PROVEEDOR',
            estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO', 'SUSPENDIDO')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS antai_cuentas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL UNIQUE,
            alias TEXT NOT NULL,
            saldo_disponible INTEGER NOT NULL DEFAULT 0 CHECK(saldo_disponible >= 0),
            moneda TEXT NOT NULL DEFAULT 'CLP',
            estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK(estado IN ('ACTIVA', 'BLOQUEADA')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES antai_clientes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS antai_movimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cuenta_id INTEGER NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('CARGA', 'CARGO', 'AJUSTE')),
            monto INTEGER NOT NULL CHECK(monto > 0),
            descripcion TEXT NOT NULL,
            centro_costo TEXT,
            referencia TEXT,
            creado_por_usuario_id INTEGER,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cuenta_id) REFERENCES antai_cuentas(id) ON DELETE CASCADE,
            FOREIGN KEY (creado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_expedientes_industriales_proveedor ON expedientes_industriales(proveedor_id);
        CREATE INDEX IF NOT EXISTS idx_evidencias_industriales_expediente ON evidencias_industriales(expediente_id);
        CREATE INDEX IF NOT EXISTS idx_hitos_corredor_expediente ON hitos_corredor(expediente_id);
        CREATE INDEX IF NOT EXISTS idx_valores_cbam_busqueda ON valores_cbam_referencia(tipo, pais, codigo_cn_normalizado);
        CREATE INDEX IF NOT EXISTS idx_trazabilidad_industrial_expediente ON trazabilidad_industrial(expediente_id, id DESC);
        CREATE INDEX IF NOT EXISTS idx_eudr_corredor_expediente ON eudr_corredor(expediente_id, id DESC);
        CREATE INDEX IF NOT EXISTS idx_antai_movimientos_cuenta ON antai_movimientos(cuenta_id, id DESC);
    `);

    // La base existente puede venir de una versión anterior a los campos del corredor.
    const columnasHitos = db.prepare('PRAGMA table_info(hitos_corredor)').all().map((columna) => columna.name);
    if (!columnasHitos.includes('norma_referencia')) db.exec('ALTER TABLE hitos_corredor ADD COLUMN norma_referencia TEXT');
    if (!columnasHitos.includes('documento_requerido')) db.exec('ALTER TABLE hitos_corredor ADD COLUMN documento_requerido TEXT');

    const paisesCorredor = [
        ['CL', 'Chile', 'Origen / puerto de salida', 'Instalación, lote, DTE/OC, guía de despacho y salida portuaria o fronteriza.'],
        ['AR', 'Argentina', 'Tránsito / frontera', 'Transportista, cruce fronterizo, manifiesto y documento de tránsito aplicable.'],
        ['BO', 'Bolivia', 'Tránsito / frontera', 'Transportista, cruce fronterizo, manifiesto y documento de tránsito aplicable.'],
        ['BR', 'Brasil', 'Tránsito / destino regional', 'Recepción, transporte, aduana o puerto y documento comercial aplicable.'],
        ['PY', 'Paraguay', 'Tránsito / destino regional', 'Transportista, aduana o puerto y documento comercial aplicable.'],
        ['PE', 'Perú', 'Tránsito / puerto de salida', 'Transportista, aduana, puerto y documento de tránsito aplicable.'],
    ];
    const insertarPais = db.prepare('INSERT OR IGNORE INTO paises_corredor (codigo, nombre, rol_logistico, evidencia_base) VALUES (?, ?, ?, ?)');
    for (const pais of paisesCorredor) insertarPais.run(...pais);

    db.prepare(`
        INSERT OR IGNORE INTO fuentes_normativas
        (clave, titulo, tipo, jurisdiccion, referencia_legal, version, fecha_publicacion, vinculante, url_oficial, nota_uso)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        'EUDR_REGLAMENTO_2023_1115',
        'Reglamento de la UE sobre productos libres de deforestación',
        'REGLAMENTO',
        'Unión Europea',
        'Reglamento (UE) 2023/1115',
        'Vigente con fechas de aplicación actualizadas',
        '2023-06-09',
        1,
        'https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en',
        'Referencia para evaluar aplicabilidad EUDR en productos del corredor; no sustituye asesoría legal ni declaración DDS ante el sistema europeo.'
    );
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
