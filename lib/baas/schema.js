/** Esquema BaaS pagos SICR3P (wallet virtual, ops, contacto). Sin Global66. */
export function initBaasSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS baas_contactos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      hubspot_contact_id TEXT,
      hubspot_mode TEXT,
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

    -- Open Banking (API partner BaaS): clientes, consentimientos, pagos PIS
    CREATE TABLE IF NOT EXISTS ob_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT UNIQUE NOT NULL,
      client_secret_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      empresa_usuario_id INTEGER,
      scopes_default TEXT NOT NULL DEFAULT 'accounts:read transactions:read payments:write',
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ob_consents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consent_id TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      empresa_usuario_id INTEGER NOT NULL,
      scopes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AWAITING_AUTHORISATION'
        CHECK(status IN ('AWAITING_AUTHORISATION','AUTHORISED','REVOKED','EXPIRED','REJECTED')),
      expires_at DATETIME,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      autorizado_en DATETIME,
      FOREIGN KEY (client_id) REFERENCES ob_clients(client_id) ON DELETE CASCADE,
      FOREIGN KEY (empresa_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ob_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_token TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      consent_id TEXT,
      scopes TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES ob_clients(client_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ob_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT UNIQUE NOT NULL,
      consent_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending'
        CHECK(status IN ('Pending','AcceptedSettlementInProcess','AcceptedSettlementCompleted','Rejected')),
      amount_clp INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'CLP',
      creditor_name TEXT,
      creditor_account TEXT,
      creditor_bank_code TEXT,
      reference TEXT,
      operacion_id INTEGER,
      dlocal_payout_id TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consent_id) REFERENCES ob_consents(consent_id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES ob_clients(client_id) ON DELETE CASCADE,
      FOREIGN KEY (operacion_id) REFERENCES baas_operaciones(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ob_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT,
      action TEXT NOT NULL,
      path TEXT,
      detail TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baas_terminales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alias TEXT NOT NULL,
      serial TEXT UNIQUE NOT NULL,
      modelo TEXT NOT NULL DEFAULT 'SUNMI',
      estado TEXT NOT NULL DEFAULT 'DESCONECTADO'
        CHECK(estado IN ('DESCONECTADO','CONECTADO','EN_PRUEBA')),
      comercio_rut TEXT,
      ultimo_latido DATETIME,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
      lat REAL,
      lng REAL,
      metrica TEXT,
      valor REAL,
      detalle TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unidad_id) REFERENCES baas_unidades(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS baas_geocercas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radio_m INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#6B5CF6'
    );

    CREATE TABLE IF NOT EXISTS baas_platform_accounts (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      account_id TEXT NOT NULL,
      platform_type TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'CL',
      legal_name TEXT NOT NULL,
      payment_methods TEXT NOT NULL,
      fee_note TEXT NOT NULL,
      settlement_period INTEGER NOT NULL DEFAULT 7,
      pricing_level TEXT NOT NULL DEFAULT 'type_1',
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baas_user_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT UNIQUE,
      external_reference TEXT UNIQUE NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('vendedor','prestador','contratista','submerchant')),
      tax_category TEXT NOT NULL CHECK(tax_category IN ('individual','company')),
      account_name TEXT NOT NULL,
      account_email TEXT NOT NULL,
      account_country TEXT NOT NULL DEFAULT 'CL',
      notification_url TEXT NOT NULL,
      status TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      status_detail TEXT NOT NULL,
      pricing_level TEXT,
      settlement_period INTEGER,
      payload_json TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baas_kyc_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_row_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(account_row_id, file_name),
      FOREIGN KEY (account_row_id) REFERENCES baas_user_accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS baas_account_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_row_id INTEGER,
      account_id TEXT,
      tipo TEXT NOT NULL,
      status TEXT,
      status_detail TEXT,
      detalle TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_baas_user_accounts_status ON baas_user_accounts(status, id DESC);
    CREATE INDEX IF NOT EXISTS idx_baas_account_events ON baas_account_events(account_row_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_baas_telemetria_unidad ON baas_telemetria(unidad_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_ob_consents_client ON ob_consents(client_id, status);
    CREATE INDEX IF NOT EXISTS idx_ob_payments_status ON ob_payments(status, id DESC);
  `);

  migrateUsuariosRoles(db);
  migrateContactosHubspot(db);
  migrateOpenBankingInfra(db);
}

function migrateOpenBankingInfra(db) {
  const cols = db.prepare('PRAGMA table_info(ob_payments)').all().map((c) => c.name);
  if (!cols.includes('idempotency_key')) {
    db.exec('ALTER TABLE ob_payments ADD COLUMN idempotency_key TEXT');
  }
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_ob_payments_idem
     ON ob_payments(client_id, idempotency_key)`,
  );
}

function migrateContactosHubspot(db) {
  const cols = db.prepare('PRAGMA table_info(baas_contactos)').all().map((c) => c.name);
  if (!cols.includes('hubspot_contact_id')) {
    db.exec('ALTER TABLE baas_contactos ADD COLUMN hubspot_contact_id TEXT');
  }
  if (!cols.includes('hubspot_mode')) {
    db.exec('ALTER TABLE baas_contactos ADD COLUMN hubspot_mode TEXT');
  }
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
