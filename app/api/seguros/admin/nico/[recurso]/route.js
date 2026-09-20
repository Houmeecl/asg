import { NextResponse } from 'next/server';
import { obtenerUsuarioSeguros, esAdmin, obtenerPoliza, marcarPolizaEnviadaANico } from '@/lib/segurosAuth';
import { nicoFetch, NicoError } from '@/lib/nicoApi';
import { RIESGOS, SECTORES, clp } from '@/app/seguros-parametricos/data';

// Lista cerrada de recursos de Nico expuestos al panel admin (no es un proxy abierto).
const RECURSOS = {
    polizas: '/api/v1/policies',
    leads: '/api/v1/leads',
    productos: '/api/v1/products',
    cuentas: '/api/v1/accounts_external',
    companias: '/api/v1/insurance_companies',
    ramos: '/api/v1/insurance_categories',
    rubros: '/api/v1/industries',
    regiones: '/api/v1/regions',
    comunas: '/api/v1/communes',
    planes_pago: '/api/v1/payment_plans',
    nominas: '/api/v1/admin/beneficiary_policies',
};

// Filtros de listado documentados por Nico que se reenvían tal cual.
const PARAMS_PERMITIDOS = new Set([
    'display_length', 'display_start', 'query', 'sort_direction', 'step', 'quotation_status',
    'close_status', 'account_id', 'account_national_id', 'insurance_category_id',
    'insurance_company_id', 'is_valid', 'active',
]);

async function exigirAdmin() {
    const usuario = await obtenerUsuarioSeguros();
    if (!usuario) return { error: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }) };
    if (!esAdmin(usuario)) return { error: NextResponse.json({ error: 'Solo administradores.' }, { status: 403 }) };
    return { usuario };
}

function errorNico(e) {
    if (e instanceof NicoError) {
        return NextResponse.json({ error: e.message, codigo: e.codigo }, { status: e.status });
    }
    console.error('[nico] error inesperado:', e?.message);
    return NextResponse.json({ error: 'Error interno al consultar Nico.' }, { status: 500 });
}

export async function GET(request, { params }) {
    const { error } = await exigirAdmin();
    if (error) return error;

    const { recurso } = await params;
    const ruta = RECURSOS[recurso];
    if (!ruta) return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 404 });

    const query = {};
    for (const [k, v] of new URL(request.url).searchParams) {
        if (PARAMS_PERMITIDOS.has(k) && v.length <= 100) query[k] = v;
    }
    if (!query.display_length || +query.display_length > 100) query.display_length = '20';

    try {
        const { status, data } = await nicoFetch(ruta, { query });
        return NextResponse.json(data ?? {}, { status });
    } catch (e) {
        return errorNico(e);
    }
}

// ---- Alta de una oportunidad (lead) en Nico a partir de una cotización de SICR3P ----

// Módulo 11 chileno. Acepta con o sin puntos y guion.
function rutValido(rut) {
    const limpio = String(rut ?? '').replace(/[.\s-]/g, '').toUpperCase();
    if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;
    const cuerpo = limpio.slice(0, -1), dv = limpio.slice(-1);
    let suma = 0, mult = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += +cuerpo[i] * mult;
        mult = mult === 7 ? 2 : mult + 1;
    }
    const resto = 11 - (suma % 11);
    return dv === (resto === 11 ? '0' : resto === 10 ? 'K' : String(resto));
}

// Evita dos envíos simultáneos de la misma cotización (doble clic) antes de que quede marcada.
const enviando = (globalThis.__nicoLeadsEnCurso ??= new Set());

const texto = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const hoyDDMMAAAA = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export async function POST(request, { params }) {
    const { error } = await exigirAdmin();
    if (error) return error;

    const { recurso } = await params;
    if (recurso !== 'leads') return NextResponse.json({ error: 'Operación no permitida.' }, { status: 405 });

    const b = await request.json().catch(() => null);
    const poliza = obtenerPoliza(Number.isInteger(b?.polizaId) ? b.polizaId : -1);
    if (!poliza) return NextResponse.json({ error: 'Cotización no encontrada.' }, { status: 404 });
    if (poliza.nico_lead_id) {
        return NextResponse.json({ error: `Esta cotización ya se envió a Nico (lead ${poliza.nico_lead_id}).` }, { status: 409 });
    }

    const accountId = b?.account_id, categoriaId = b?.insurance_category_id;
    if (!Number.isInteger(accountId) || accountId < 1) return NextResponse.json({ error: 'Elige la cuenta de Nico.' }, { status: 400 });
    if (!Number.isInteger(categoriaId) || categoriaId < 1) return NextResponse.json({ error: 'Elige el ramo.' }, { status: 400 });

    const nombre = texto(b?.hiring_person_name) || poliza.empresa;
    const rut = texto(b?.hiring_person_national_identification, 20);
    const direccion = texto(b?.hiring_person_address);
    const correo = texto(b?.responsible_email, 200);
    if (!rutValido(rut)) return NextResponse.json({ error: 'RUT del contratante no válido.' }, { status: 400 });
    if (direccion.length < 5) return NextResponse.json({ error: 'Ingresa la dirección (dirección, comuna y ciudad).' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return NextResponse.json({ error: 'Correo del encargado no válido.' }, { status: 400 });
    if (!['uf', 'usd'].includes(b?.currency)) return NextResponse.json({ error: 'Moneda no válida (uf o usd).' }, { status: 400 });
    const prima = b?.estimated_net_prime;
    if (prima !== undefined && prima !== null && !(typeof prima === 'number' && prima >= 0 && prima < 1e9)) {
        return NextResponse.json({ error: 'Prima neta estimada no válida.' }, { status: 400 });
    }

    const riesgo = RIESGOS[poliza.riesgo];
    const sector = SECTORES.find((s) => s.slug === poliza.sector);
    const descripcion = `Seguro paramétrico de ${riesgo.nombre.toLowerCase()} (${riesgo.indice.toLowerCase()}, ${riesgo.dir === 'menor' ? 'bajo' : 'sobre'} ${poliza.umbral.toFixed(0)} ${riesgo.unidad}) ` +
        `para ${sector?.nombre ?? poliza.sector} en ${poliza.localidad}, ${poliza.zona}. Monto asegurado ${clp(poliza.monto)}, ${poliza.meses} meses. Origen: SICR3P.`;

    const lead = {
        account_id: accountId,
        insurance_category_id: categoriaId,
        currency: b.currency,
        hiring_person_name: nombre,
        hiring_person_national_identification: rut,
        hiring_person_address: direccion,
        // Asegurado = contratante (el sitio no distingue ambos roles).
        insured_person_name: nombre,
        insured_person_national_identification: rut,
        insured_person_address: direccion,
        responsible_email: correo,
        subject_matter: descripcion,
        validity_start: hoyDDMMAAAA(),
        // `requested: true` solicita cotización a las aseguradoras; por defecto solo guarda la oportunidad.
        requested: b?.requested === true,
        insurance_items_attributes: [{ name: `${riesgo.nombre} — ${poliza.localidad}`, notes: `Cotización SICR3P #${poliza.id}` }],
        ...(typeof prima === 'number' ? { estimated_net_prime: prima } : {}),
    };

    if (enviando.has(poliza.id)) return NextResponse.json({ error: 'Esta cotización ya se está enviando.' }, { status: 409 });
    enviando.add(poliza.id);
    try {
        const { status, data } = await nicoFetch(RECURSOS.leads, { method: 'POST', body: { lead } });
        if (status !== 201 && status !== 200) {
            return NextResponse.json({ error: data?.error ?? data?.errors ?? `Nico respondió ${status}.`, detalle: data }, { status: status >= 500 ? 502 : status });
        }
        const leadId = data?.data?.id ?? data?.id ?? null;
        marcarPolizaEnviadaANico(poliza.id, leadId);
        return NextResponse.json({ ok: true, leadId, lead: data }, { status: 201 });
    } catch (e) {
        return errorNico(e);
    } finally {
        enviando.delete(poliza.id);
    }
}
