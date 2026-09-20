import { NextResponse } from 'next/server';
import { obtenerUsuarioSeguros, crearPoliza, listarPolizas } from '@/lib/segurosAuth';
import { SECTORES, ZONAS_NORTE, cotizar, sectorPorSlug } from '@/app/seguros-parametricos/data';

export async function GET() {
    const usuario = await obtenerUsuarioSeguros();
    if (!usuario) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    return NextResponse.json({ polizas: listarPolizas(usuario.id) });
}

const entero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

export async function POST(request) {
    const usuario = await obtenerUsuarioSeguros();
    if (!usuario) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

    const b = await request.json().catch(() => null);
    const empresa = texto(b?.empresa), localidad = texto(b?.localidad);
    const sector = SECTORES.find((s) => s.slug === b?.sector);

    if (empresa.length < 2 || empresa.length > 120) return NextResponse.json({ error: 'Nombre de empresa no válido.' }, { status: 400 });
    if (localidad.length < 2 || localidad.length > 120) return NextResponse.json({ error: 'Localidad no válida.' }, { status: 400 });
    if (!sector) return NextResponse.json({ error: 'Sector no válido.' }, { status: 400 });
    if (!ZONAS_NORTE.includes(b?.zona)) return NextResponse.json({ error: 'Región no válida.' }, { status: 400 });
    if (!sectorPorSlug(sector.slug).riesgos.includes(b?.riesgo)) return NextResponse.json({ error: 'Riesgo no válido para el sector.' }, { status: 400 });
    if (!entero(b?.monto, 5_000_000, 500_000_000)) return NextResponse.json({ error: 'Monto fuera de rango.' }, { status: 400 });
    if (!entero(b?.meses, 1, 12)) return NextResponse.json({ error: 'Periodo fuera de rango.' }, { status: 400 });
    if (!entero(b?.sens, 10, 100)) return NextResponse.json({ error: 'Sensibilidad fuera de rango.' }, { status: 400 });

    // La prima y el umbral los calcula el servidor; nunca se aceptan del cliente.
    const cot = cotizar(b.riesgo, b.monto, b.meses, b.sens);
    const id = crearPoliza(usuario.id, {
        empresa, localidad, sector: sector.slug, zona: b.zona, riesgo: b.riesgo,
        monto: b.monto, meses: b.meses, sensibilidad: b.sens, prima: cot.prima, umbral: cot.umbral,
    });
    return NextResponse.json({ id }, { status: 201 });
}
