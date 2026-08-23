// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const db = require('./db'); // Base de datos SQLite de SICR3P
const { auditarTextoConOllama } = require('./services/ollamaService'); // Servicio de IA con contexto SICR3P

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

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor SICR3P corriendo en el puerto ${PORT}`);
    console.log(`🛡️ Protocolo: Assurance, Forensic & Sustainable Finance (Ollama Conectado)`);
});