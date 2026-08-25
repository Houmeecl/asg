import { NextResponse } from 'next/server';
import db from '@/lib/db';
import * as flotaService from '@/lib/flotaService';

// NOTA: la Firma Electrónica Avanzada y el sellado de tiempo con TSA acreditado quedan
// como TODO explícito (estado_firma/sellado_tiempo_pendiente) — requieren contratar un
// prestador acreditado (ver entidadacreditadora.gob.cl); no se pueden simular sin ese servicio.
export async function POST(request, { params }) {
    const { id: contratoId } = await params;
    const { xml_uso, xml_combustible, auditor_firmante } = await request.json();

    if (!xml_uso || !xml_combustible) {
        return NextResponse.json({ error: 'Debe enviar xml_uso y xml_combustible.' }, { status: 400 });
    }

    try {
        const contrato = db.prepare(
            `SELECT c.*, a.tasa_referencia_litros, a.tipo_combustible, a.unidad_medida, a.patente, e.tipo_negocio
             FROM flota_contratos c
             JOIN flota_activos a ON a.id = c.activo_id
             JOIN flota_empresas e ON e.id = a.empresa_id
             WHERE c.id = ?`
        ).get(contratoId);

        if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
        if (contrato.estado !== 'VIGENTE') return NextResponse.json({ error: 'El contrato no está vigente' }, { status: 400 });

        const lecturaUso = flotaService.parsearLecturaUso(xml_uso);
        const lecturaCombustible = flotaService.parsearLecturaCombustible(xml_combustible);

        if (lecturaUso.patente !== contrato.patente || lecturaCombustible.patente !== contrato.patente) {
            return NextResponse.json({ error: 'La patente del XML no coincide con la del activo del contrato.' }, { status: 400 });
        }

        const consumoEsperado = flotaService.calcularConsumoEsperado(contrato.tasa_referencia_litros, lecturaUso.valor);
        const discrepanciaPct = flotaService.calcularDiscrepanciaPct(lecturaCombustible.litros, consumoEsperado);
        const co2Kg = flotaService.calcularCO2Kg(lecturaCombustible.litros, contrato.tipo_combustible);
        const alcanceGhg = flotaService.determinarAlcanceGHG(contrato.tipo_negocio);
        const hashEvidencia = flotaService.generarHashEvidencia(xml_uso, xml_combustible);

        const { secuencia } = db.prepare(
            `SELECT COUNT(*) AS secuencia FROM flota_renovaciones WHERE contrato_id = ?`
        ).get(contratoId);
        const numeroAdhesivo = flotaService.generarNumeroAdhesivo(contratoId, secuencia + 1);
        const codigoQr = flotaService.generarCodigoQR();

        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (contrato.dias_renovacion || 30));

        const result = db.prepare(
            `INSERT INTO flota_renovaciones (
                contrato_id, numero_adhesivo, codigo_qr, fecha_vencimiento,
                lectura_uso, lectura_combustible_litros, consumo_esperado_litros, discrepancia_pct,
                alcance_ghg, co2_kg, hash_evidencia, xml_uso_origen, xml_combustible_origen, auditor_firmante,
                estado_firma
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            contratoId, numeroAdhesivo, codigoQr, fechaVencimiento.toISOString(),
            lecturaUso.valor, lecturaCombustible.litros, consumoEsperado, discrepanciaPct,
            alcanceGhg, co2Kg, hashEvidencia, xml_uso, xml_combustible, auditor_firmante || null,
            auditor_firmante ? 'FIRMADO' : 'PENDIENTE_FEA'
        );

        // El QR codifica la URL pública de verificación, no solo el código —
        // así escanearlo lleva directo al Pasaporte Digital, no a un UUID suelto.
        const origin = request.headers.get('origin') || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
        const urlVerificacion = `${origin}/verificar/${codigoQr}`;
        const qrDataUrl = await flotaService.generarQR(urlVerificacion);

        return NextResponse.json({
            mensaje: 'Renovación registrada y certificado generado',
            id_renovacion: result.lastInsertRowid,
            numero_adhesivo: numeroAdhesivo,
            codigo_qr: codigoQr,
            qr_data_url: qrDataUrl,
            url_verificacion: urlVerificacion,
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
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al procesar la renovación', detalle: error.message }, { status: 400 });
    }
}
