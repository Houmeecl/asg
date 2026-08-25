import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Endpoint PÚBLICO (sin auth) — es el respaldo del Pasaporte Digital que se
// escanea vía QR. Devuelve solo el subconjunto seguro para mostrar a un
// tercero (banco, mandante): nada de XML crudo ni IDs internos de cliente/empresa.
export async function GET(request, { params }) {
    const { codigo } = await params;

    try {
        const renovacion = db.prepare(
            `SELECT r.numero_adhesivo, r.codigo_qr, r.fecha_renovacion, r.fecha_vencimiento,
                    r.lectura_uso, r.lectura_combustible_litros, r.consumo_esperado_litros,
                    r.discrepancia_pct, r.alcance_ghg, r.co2_kg, r.hash_evidencia,
                    r.estado_firma, r.auditor_firmante,
                    a.patente, a.tipo_activo, a.unidad_medida, a.tipo_combustible,
                    e.razon_social AS empresa_razon_social, e.ciudad AS empresa_ciudad, e.tipo_negocio
             FROM flota_renovaciones r
             JOIN flota_contratos c ON c.id = r.contrato_id
             JOIN flota_activos a ON a.id = c.activo_id
             JOIN flota_empresas e ON e.id = a.empresa_id
             WHERE r.codigo_qr = ?`
        ).get(codigo);

        if (!renovacion) {
            return NextResponse.json({ error: 'Código no encontrado. Este certificado no existe o el código es inválido.' }, { status: 404 });
        }

        return NextResponse.json(renovacion);
    } catch (error) {
        return NextResponse.json({ error: 'Error al verificar el certificado' }, { status: 500 });
    }
}
