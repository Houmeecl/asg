import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const rows = db.prepare(
            `SELECT id, numero_adhesivo, codigo_qr, fecha_renovacion, fecha_vencimiento, lectura_uso,
                    lectura_combustible_litros, consumo_esperado_litros, discrepancia_pct, alcance_ghg,
                    co2_fosil_kg, co2_biogenico_kg, estado_firma, auditor_firmante
             FROM flota_renovaciones WHERE contrato_id = ? ORDER BY fecha_renovacion DESC`
        ).all(id);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener historial de renovaciones' }, { status: 500 });
    }
}
