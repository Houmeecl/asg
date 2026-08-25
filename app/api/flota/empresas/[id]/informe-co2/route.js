import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Informe alineado a los elementos mínimos del GHG Protocol Corporate Standard
// (sección "Reporting"): límites organizacionales/operacionales, período cubierto,
// fuente del factor de emisión, desglose por alcance, y CO2 biogénico reportado
// aparte del total fósil (no se suma al alcance, por convención del estándar).
export async function GET(request, { params }) {
    const { id } = await params;

    try {
        const empresa = db.prepare(`SELECT razon_social, pais, tipo_negocio FROM flota_empresas WHERE id = ?`).get(id);
        if (!empresa) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

        const rows = db.prepare(
            `SELECT r.alcance_ghg,
                    SUM(r.co2_fosil_kg) AS co2_fosil_kg_total,
                    SUM(r.co2_biogenico_kg) AS co2_biogenico_kg_total,
                    COUNT(*) AS cantidad_renovaciones,
                    SUM(CASE WHEN r.discrepancia_pct > 15 THEN 1 ELSE 0 END) AS renovaciones_con_discrepancia_alta
             FROM flota_renovaciones r
             JOIN flota_contratos c ON c.id = r.contrato_id
             JOIN flota_activos a ON a.id = c.activo_id
             WHERE a.empresa_id = ?
             GROUP BY r.alcance_ghg`
        ).all(id);

        const periodo = db.prepare(
            `SELECT MIN(r.fecha_renovacion) AS desde, MAX(r.fecha_renovacion) AS hasta
             FROM flota_renovaciones r
             JOIN flota_contratos c ON c.id = r.contrato_id
             JOIN flota_activos a ON a.id = c.activo_id
             WHERE a.empresa_id = ?`
        ).get(id);

        const porAlcance = rows.map(r => ({
            alcance_ghg: r.alcance_ghg,
            co2_fosil_ton: Number((r.co2_fosil_kg_total / 1000).toFixed(3)),
            co2_biogenico_ton: Number((r.co2_biogenico_kg_total / 1000).toFixed(3)),
            cantidad_renovaciones: r.cantidad_renovaciones,
            renovaciones_con_discrepancia_alta: r.renovaciones_con_discrepancia_alta,
        }));

        const totalFosilTon = Number((porAlcance.reduce((s, r) => s + r.co2_fosil_ton, 0)).toFixed(3));
        const totalBiogenicoTon = Number((porAlcance.reduce((s, r) => s + r.co2_biogenico_ton, 0)).toFixed(3));

        return NextResponse.json({
            empresa_id: Number(id),
            empresa: empresa.razon_social,
            pais: empresa.pais,
            periodo_cubierto: periodo.desde ? { desde: periodo.desde, hasta: periodo.hasta } : null,
            total_co2_fosil_ton: totalFosilTon,
            total_co2_biogenico_ton: totalBiogenicoTon,
            por_alcance: porAlcance,
            metodologia: {
                estandar: 'GHG Protocol Corporate Standard (Alcance 1/2/3), factores base IPCC 2006',
                limites_organizacionales: 'Enfoque de control operacional — se reportan las emisiones de los activos sobre los que la empresa auditada tiene control operacional directo (Alcance 1) o que arrienda a terceros sin control operacional (Alcance 3, Categoría 13: downstream leased assets)',
                co2_biogenico_nota: 'El CO2 proveniente de la fracción de biocombustible mezclado por ley en el diésel/gasolina (variable por país) se reporta aparte y NO se suma al total de Alcance 1/3, conforme al GHG Protocol Corporate Standard.',
            },
            nota: 'Alcance 1 = combustible consumido bajo control operacional directo. Alcance 3 (Cat. 13, downstream leased assets) = combustible consumido por el cliente en un activo arrendado por esta empresa.'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error al generar informe de CO2' }, { status: 500 });
    }
}
