/** Esquema BaaS pagos SICR3P (wallet virtual, ops, contacto). Sin Global66. */
export function initBaasSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS baas_contactos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baas_personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rut TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      pais TEXT NOT NULL DEFAULT 'CL',
      kyc_estado TEXT NOT NULL DEFAULT 'PENDIENTE'
        CHECK(kyc_estado IN ('PENDIENTE','EN_REVISION','APROBADO','RECHAZADO')),
      registro_token TEXT UNIQUE,
      registro_expira DATETIME,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baas_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      persona_id INTEGER NOT NULL UNIQUE,
      wallet_id TEXT UNIQUE NOT NULL,
      tarjeta_virtual_id TEXT UNIQUE NOT NULL,
      estado TEXT NOT NULL DEFAULT 'VIRTUAL'
        CHECK(estado IN ('VIRTUAL','PREPAGO_PENDIENTE','PREPAGO_ACTIVA','BLOQUEADA')),
      etiqueta TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (persona_id) REFERENCES baas_personas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS baas_beneficiarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      documento TEXT NOT NULL,
      documento_tipo TEXT NOT NULL DEFAULT 'RUT',
      pais TEXT NOT NULL DEFAULT 'CL',
      bank_code TEXT,
      bank_account TEXT,
      bank_account_type TEXT DEFAULT 'CHECKING',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS baas_operaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      modo TEXT NOT NULL DEFAULT 'ENVIO'
        CHECK(modo IN ('ENVIO','TURISTA_QR')),
      estado TEXT NOT NULL DEFAULT 'BORRADOR'
        CHECK(estado IN ('BORRADOR','PENDIENTE_REGISTRO','PENDIENTE_COBRO','COBRADA','EN_LOTE','ENVIADA','PAGADA','RECHAZADA')),
      monto_clp INTEGER NOT NULL,
      pais_destino TEXT NOT NULL DEFAULT 'PE',
      moneda_destino TEXT NOT NULL DEFAULT 'PEN',
      persona_id INTEGER,
      beneficiario_id INTEGER,
      empresa_usuario_id INTEGER,
      tuu_sequence TEXT,
      dlocal_payout_id TEXT,
      dlocal_payment_id TEXT,
      tourist_qr_token TEXT,
      nota TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (persona_id) REFERENCES baas_personas(id) ON DELETE SET NULL,
      FOREIGN KEY (beneficiario_id) REFERENCES baas_beneficiarios(id) ON DELETE SET NULL,
      FOREIGN KEY (empresa_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS baas_lotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referencia TEXT UNIQUE NOT NULL,
      estado TEXT NOT NULL DEFAULT 'ABIERTO'
        CHECK(estado IN ('ABIERTO','CERRADO','FONDEADO','LIBERADO')),
      monto_esperado INTEGER NOT NULL DEFAULT 0,
      transferido_en DATETIME,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baas_lote_ops (
      lote_id INTEGER NOT NULL,
      operacion_id INTEGER NOT NULL,
      PRIMARY KEY (lote_id, operacion_id),
      FOREIGN KEY (lote_id) REFERENCES baas_lotes(id) ON DELETE CASCADE,
      FOREIGN KEY (operacion_id) REFERENCES baas_operaciones(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_baas_ops_estado ON baas_operaciones(estado, id DESC);
    CREATE INDEX IF NOT EXISTS idx_baas_personas_rut ON baas_personas(rut);
  `);

  // Ampliar roles de usuarios (SQLite CHECK antiguo solo AUDITOR|ADMIN).
  migrateUsuariosRoles(db);
}

function migrateUsuariosRoles(db) {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'`).get();
  if (!row?.sql) return;
  if (row.sql.includes("'EMPRESA'") && row.sql.includes("'OPERADOR'")) return;

  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE usuarios_baas_mig (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'AUDITOR',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO usuarios_baas_mig (id, email, password_hash, nombre, rol, fecha_registro)
      SELECT id, email, password_hash, nombre, rol, fecha_registro FROM usuarios;
    DROP TABLE usuarios;
    ALTER TABLE usuarios_baas_mig RENAME TO usuarios;
    PRAGMA foreign_keys = ON;
  `);
}
