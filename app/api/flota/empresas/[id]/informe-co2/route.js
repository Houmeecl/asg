import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const rows = db.prepare(
            `SELECT r.alcance_ghg, SUM(r.co2_kg) AS co2_kg_total, COUNT(*) AS cantidad_renovaciones,
                    SUM(CASE WHEN r.discrepancia_pct > 15 THEN 1 ELSE 0 END) AS renovaciones_con_discrepancia_alta
             FROM flota_renovaciones r
             JOIN flota_contratos c ON c.id = r.contrato_id
             JOIN flota_activos a ON a.id = c.activo_id
             WHERE a.empresa_id = ?
             GROUP BY r.alcance_ghg`
        ).all(id);
        return NextResponse.json({
            empresa_id: Number(id),
            por_alcance: rows,
            nota: 'Alcance 1 = combustible consumido bajo control operacional directo. Alcance 3 (Cat. 13, downstream leased assets) = combustible consumido por el cliente en un activo arrendado por esta empresa.'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error al generar informe de CO2' }, { status: 500 });
    }
}
