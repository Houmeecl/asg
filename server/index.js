// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const db = require('./db'); // Base de datos SQLite de SICR3P
const { auditarTextoConOllama } = require('./services/ollamaService'); // Servicio de IA con contexto SICR3P
const flotaService = require('./services/flotaService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de Multer para recepción temporal de archivos
const upload = multer({ dest: 'uploads/' });

// ==========================================
// 1. RUTAS: EMPRESAS PROVEEDORAS (Clientes)
// ==========================================

app.post('/api/clientes', (req, res) => {
    const { rut, razon_social, sector_industrial } = req.body;
    const sql = `INSERT INTO empresas_proveedoras (rut, razon_social, sector_industrial) VALUES (?, ?, ?)`;
    db.run(sql, [rut, razon_social, sector_industrial], function(err) {
        if (err) {
            return res.status(400).json({ error: 'Error al registrar cliente.', detalle: err.message });
        }
        res.status(201).json({ mensaje: 'Cliente registrado exitosamente', id_cliente: this.lastID });
    });
});

app.get('/api/clientes', (req, res) => {
    const sql = `SELECT * FROM empresas_proveedoras ORDER BY fecha_registro DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener clientes' });
        res.json(rows);
    });
});

// ==========================================
// 2. RUTAS: EXPEDIENTES SICR3P
// ==========================================

app.post('/api/expedientes', (req, res) => {
    const { proveedor_id, periodo_fiscal, area_practica } = req.body;
    const sql = `INSERT INTO expedientes_sicr3p (proveedor_id, periodo_fiscal, area_practica) VALUES (?, ?, ?)`;
    db.run(sql, [proveedor_id, periodo_fiscal, area_practica], function(err) {
        if (err) return res.status(400).json({ error: 'Error al abrir el expediente', detalle: err.message });
        res.status(201).json({ mensaje: 'Expediente SICR3P abierto', id_expediente: this.lastID });
    });
});

app.get('/api/clientes/:id/expedientes', (req, res) => {
    const proveedor_id = req.params.id;
    const sql = `SELECT * FROM expedientes_sicr3p WHERE proveedor_id = ? ORDER BY fecha_apertura DESC`;
    db.all(sql, [proveedor_id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener expedientes' });
        res.json(rows);
    });
});

// ==========================================
// 3. RUTAS: EVIDENCIA FORENSE & HASH SHA-256
// ==========================================

app.post('/api/expedientes/:id/evidencia', upload.single('archivo'), (req, res) => {
    const expediente_id = req.params.id;
    const archivo = req.file;
    const { categoria_analisis } = req.body;

    if (!archivo) {
        return res.status(400).json({ error: 'No se ha adjuntado ningún archivo.' });
    }

    try {
        const fileBuffer = fs.readFileSync(archivo.path);
        const hash_sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const tipo_archivo = archivo.originalname.split('.').pop().toUpperCase();
        const resultado_inicial = JSON.stringify({ status: 'Evidencia blindada criptográficamente' });

        const sql = `INSERT INTO evidencias_forenses (expediente_id, tipo_archivo, hash_sha256, categoria_analisis, resultado_ia) VALUES (?, ?, ?, ?, ?)`;

        db.run(sql, [expediente_id, tipo_archivo, hash_sha256, categoria_analisis, resultado_inicial], function(err) {
            fs.unlinkSync(archivo.path);
            if (err) return res.status(500).json({ error: 'Error al registrar evidencia', detalle: err.message });

            res.status(201).json({
                mensaje: 'Evidencia procesada y blindada',
                id_evidencia: this.lastID,
                hash_inmutabilidad: hash_sha256,
                tipo: tipo_archivo
            });
        });
    } catch (error) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        res.status(500).json({ error: 'Error interno', detalle: error.message });
    }
});

// ==========================================
// 4. RUTAS: MOTOR DE AUDITORÍA CON OLLAMA IA
// ==========================================

app.post('/api/expedientes/:id/auditar-ia', async (req, res) => {
    const { texto } = req.body;

    if (!texto) {
        return res.status(400).json({ error: 'Debe proporcionar el texto del contrato o política para auditar.' });
    }

    try {
        const analisisForense = await auditarTextoConOllama(texto);
        
        res.json({ 
            status: 'success',
            expediente_id: req.params.id,
            dictamen_ia: analisisForense 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 5. RUTAS: MÓDULO FLOTA (Rent a Car / Leasing / Maquinaria Pesada)
//    Certificado individual (QR + hash) + informe agregado de CO2 por alcance
// ==========================================

// Helpers promisificados sobre sqlite3 (callback-style) para las rutas async de este módulo
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbRun = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
    });
};

// --- Empresas de flota (rent a car / leasing / maquinaria pesada / transporte) ---

app.post('/api/flota/empresas', async (req, res) => {
    const { rut, razon_social, ciudad, tipo_negocio } = req.body;
    try {
        const result = await dbRun(
            `INSERT INTO flota_empresas (rut, razon_social, ciudad, tipo_negocio) VALUES (?, ?, ?, ?)`,
            [rut, razon_social, ciudad, tipo_negocio]
        );
        res.status(201).json({ mensaje: 'Empresa de flota registrada', id: result.lastID });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar empresa de flota', detalle: error.message });
    }
});

app.get('/api/flota/empresas', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM flota_empresas ORDER BY fecha_registro DESC`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener empresas de flota' });
    }
});

// --- Clientes de flota (solo nombre) ---

app.post('/api/flota/empresas/:id/clientes', async (req, res) => {
    const { nombre } = req.body;
    try {
        const result = await dbRun(
            `INSERT INTO flota_clientes (empresa_id, nombre) VALUES (?, ?)`,
            [req.params.id, nombre]
        );
        res.status(201).json({ mensaje: 'Cliente de flota registrado', id: result.lastID });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar cliente de flota', detalle: error.message });
    }
});

app.get('/api/flota/empresas/:id/clientes', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM flota_clientes WHERE empresa_id = ? ORDER BY fecha_registro DESC`, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes de flota' });
    }
});

// --- Activos (vehículo o maquinaria) ---

app.post('/api/flota/empresas/:id/activos', async (req, res) => {
    const { patente, tipo_activo, unidad_medida, descripcion, tasa_referencia_litros, tipo_combustible } = req.body;
    try {
        const result = await dbRun(
            `INSERT INTO flota_activos (empresa_id, patente, tipo_activo, unidad_medida, descripcion, tasa_referencia_litros, tipo_combustible)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, patente, tipo_activo, unidad_medida, descripcion, tasa_referencia_litros, tipo_combustible || 'DIESEL']
        );
        res.status(201).json({ mensaje: 'Activo registrado', id: result.lastID });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar activo', detalle: error.message });
    }
});

app.get('/api/flota/empresas/:id/activos', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM flota_activos WHERE empresa_id = ? ORDER BY fecha_registro DESC`, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener activos' });
    }
});

// --- Contratos (vincula activo + cliente) ---

app.post('/api/flota/contratos', async (req, res) => {
    const { activo_id, cliente_id, dias_renovacion } = req.body;
    try {
        const result = await dbRun(
            `INSERT INTO flota_contratos (activo_id, cliente_id, dias_renovacion) VALUES (?, ?, ?)`,
            [activo_id, cliente_id, dias_renovacion || 30]
        );
        res.status(201).json({ mensaje: 'Contrato registrado', id: result.lastID });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar contrato', detalle: error.message });
    }
});

app.get('/api/flota/empresas/:id/contratos', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT c.*, a.patente, a.descripcion, a.tipo_activo, cl.nombre AS cliente_nombre
             FROM flota_contratos c
             JOIN flota_activos a ON a.id = c.activo_id
             JOIN flota_clientes cl ON cl.id = c.cliente_id
             WHERE a.empresa_id = ?
             ORDER BY c.fecha_inicio DESC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener contratos' });
    }
});

// --- Renovación (adhesivo/QR periódico): ingesta XML de uso + combustible, genera certificado ---
// NOTA: la Firma Electrónica Avanzada y el sellado de tiempo con TSA acreditado quedan
// como TODO explícito (estado_firma/sellado_tiempo_pendiente) — requieren contratar un
// prestador acreditado (ver entidadacreditadora.gob.cl); no se pueden simular sin ese servicio.
app.post('/api/flota/contratos/:id/renovar', async (req, res) => {
    const contratoId = req.params.id;
    const { xml_uso, xml_combustible, auditor_firmante } = req.body;

    if (!xml_uso || !xml_combustible) {
        return res.status(400).json({ error: 'Debe enviar xml_uso y xml_combustible.' });
    }

    try {
        const contrato = await dbGet(
            `SELECT c.*, a.tasa_referencia_litros, a.tipo_combustible, a.unidad_medida, a.patente, e.tipo_negocio
             FROM flota_contratos c
             JOIN flota_activos a ON a.id = c.activo_id
             JOIN flota_empresas e ON e.id = a.empresa_id
             WHERE c.id = ?`,
            [contratoId]
        );
        if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado' });
        if (contrato.estado !== 'VIGENTE') return res.status(400).json({ error: 'El contrato no está vigente' });

        const lecturaUso = flotaService.parsearLecturaUso(xml_uso);
        const lecturaCombustible = flotaService.parsearLecturaCombustible(xml_combustible);

        if (lecturaUso.patente !== contrato.patente || lecturaCombustible.patente !== contrato.patente) {
            return res.status(400).json({ error: 'La patente del XML no coincide con la del activo del contrato.' });
        }

        const consumoEsperado = flotaService.calcularConsumoEsperado(contrato.tasa_referencia_litros, lecturaUso.valor);
        const discrepanciaPct = flotaService.calcularDiscrepanciaPct(lecturaCombustible.litros, consumoEsperado);
        const co2Kg = flotaService.calcularCO2Kg(lecturaCombustible.litros, contrato.tipo_combustible);
        const alcanceGhg = flotaService.determinarAlcanceGHG(contrato.tipo_negocio);
        const hashEvidencia = flotaService.generarHashEvidencia(xml_uso, xml_combustible);

        const { secuencia } = await dbGet(
            `SELECT COUNT(*) AS secuencia FROM flota_renovaciones WHERE contrato_id = ?`,
            [contratoId]
        );
        const numeroAdhesivo = flotaService.generarNumeroAdhesivo(contratoId, secuencia + 1);
        const codigoQr = flotaService.generarCodigoQR();

        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (contrato.dias_renovacion || 30));

        const result = await dbRun(
            `INSERT INTO flota_renovaciones (
                contrato_id, numero_adhesivo, codigo_qr, fecha_vencimiento,
                lectura_uso, lectura_combustible_litros, consumo_esperado_litros, discrepancia_pct,
                alcance_ghg, co2_kg, hash_evidencia, xml_uso_origen, xml_combustible_origen, auditor_firmante,
                estado_firma
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                contratoId, numeroAdhesivo, codigoQr, fechaVencimiento.toISOString(),
                lecturaUso.valor, lecturaCombustible.litros, consumoEsperado, discrepanciaPct,
                alcanceGhg, co2Kg, hashEvidencia, xml_uso, xml_combustible, auditor_firmante || null,
                auditor_firmante ? 'FIRMADO' : 'PENDIENTE_FEA'
            ]
        );

        const qrDataUrl = await flotaService.generarQR(codigoQr);

        res.status(201).json({
            mensaje: 'Renovación registrada y certificado generado',
            id_renovacion: result.lastID,
            numero_adhesivo: numeroAdhesivo,
            codigo_qr: codigoQr,
            qr_data_url: qrDataUrl,
            lectura_uso: lecturaUso.valor,
            unidad_medida: contrato.unidad_medida,
            lectura_combustible_litros: lecturaCombustible.litros,
            consumo_esperado_litros: consumoEsperado,
            discrepancia_pct: discrepanciaPct,
            alcance_ghg: alcanceGhg,
            co2_kg: co2Kg,
            hash_evidencia: hashEvidencia,
            fecha_vencimiento: fechaVencimiento.toISOString(),
            estado_firma: auditor_firmante ? 'FIRMADO' : 'PENDIENTE_FEA',
            aviso_legal: 'Certificado basado en información entregada por el cliente (Alcance de auditoría limitado a datos suministrados, ISAE 3000 / futuro ISSA 5000). No reemplaza el inventario oficial HuellaChile ni constituye certificación ambiental primaria.'
        });
    } catch (error) {
        res.status(400).json({ error: 'Error al procesar la renovación', detalle: error.message });
    }
});

app.get('/api/flota/contratos/:id/renovaciones', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT id, numero_adhesivo, codigo_qr, fecha_renovacion, fecha_vencimiento, lectura_uso,
                    lectura_combustible_litros, consumo_esperado_litros, discrepancia_pct, alcance_ghg,
                    co2_kg, estado_firma, auditor_firmante
             FROM flota_renovaciones WHERE contrato_id = ? ORDER BY fecha_renovacion DESC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial de renovaciones' });
    }
});

// --- Informe agregado de flota: CO2 total por alcance (1 vs 3) ---

app.get('/api/flota/empresas/:id/informe-co2', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT r.alcance_ghg, SUM(r.co2_kg) AS co2_kg_total, COUNT(*) AS cantidad_renovaciones,
                    SUM(CASE WHEN r.discrepancia_pct > 15 THEN 1 ELSE 0 END) AS renovaciones_con_discrepancia_alta
             FROM flota_renovaciones r
             JOIN flota_contratos c ON c.id = r.contrato_id
             JOIN flota_activos a ON a.id = c.activo_id
             WHERE a.empresa_id = ?
             GROUP BY r.alcance_ghg`,
            [req.params.id]
        );
        res.json({
            empresa_id: Number(req.params.id),
            por_alcance: rows,
            nota: 'Alcance 1 = combustible consumido bajo control operacional directo. Alcance 3 (Cat. 13, downstream leased assets) = combustible consumido por el cliente en un activo arrendado por esta empresa.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar informe de CO2' });
    }
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor SICR3P corriendo en el puerto ${PORT}`);
    console.log(`🛡️ Protocolo: Assurance, Forensic & Sustainable Finance (Ollama Conectado)`);
});