import { NextResponse } from 'next/server';
import {
    obtenerUsuarioSeguros, esAdmin, registrarOperacionNico, actualizarOperacionNico,
    obtenerOperacionNico, listarOperacionesNico,
} from '@/lib/segurosAuth';
import { nicoFetch, NicoError } from '@/lib/nicoApi';
import { rutValido, rutFormateado, rutNormalizado } from '@/lib/rut';
import { RIESGOS, SECTORES, ZONAS_NORTE, clp, cotizar } from '@/app/seguros-parametricos/data';

// Onboarding real de un cliente en Nico (uso interno del admin):
//   1) buscar la cuenta por RUT (o crearla)  2) crear la oportunidad/cotización (lead)  3) dejar bitácora.
// POR SEGURIDAD escribe en Nico solo si el cuerpo trae `simular: false` explícito; en cualquier otro caso simula.

const enCurso = (globalThis.__nicoOnboardingEnCurso ??= new Set());
const texto = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const entero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function exigirAdmin() {
    const usuario = await obtenerUsuarioSeguros();
    if (!usuario) return { error: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }) };
    if (!esAdmin(usuario)) return { error: NextResponse.json({ error: 'Solo administradores.' }, { status: 403 }) };
    return { usuario };
}

const idDe = (json) => json?.data?.id ?? json?.id ?? null;
const fechaDDMMAAAA = (d = new Date()) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export async function GET() {
    const { error } = await exigirAdmin();
    if (error) return error;
    return NextResponse.json({ operaciones: listarOperacionesNico() });
}

// Devuelve { datos } o { error: Response } con los campos ya validados y normalizados.
function validar(b) {
    const fallo = (msg) => ({ error: NextResponse.json({ error: msg }, { status: 400 }) });
    const c = b?.cliente ?? {}, k = b?.cobertura ?? {}, n = b?.nico ?? {};

    const nombre = texto(c.nombre), rut = texto(c.rut, 20), direccion = texto(c.direccion);
    const contactoNombre = texto(c.contactoNombre) || nombre, correo = texto(c.correo, 200), telefono = texto(c.telefono, 30);
    if (nombre.length < 2) return fallo('Ingresa el nombre del cliente.');
    if (!rutValido(rut)) return fallo('RUT del cliente no válido.');
    if (!['natural', 'legal'].includes(c.tipo)) return fallo('Tipo de cliente no válido (natural o legal).');
    if (c.tipo === 'legal' && !entero(c.industryId, 1, 1e9)) return fallo('Para una empresa (persona jurídica) elige el rubro.');
    if (direccion.length < 5) return fallo('Ingresa la dirección (dirección, comuna y ciudad).');
    if (!EMAIL_RE.test(correo)) return fallo('Correo del contacto no válido.');

    const sector = SECTORES.find((s) => s.slug === k.sector);
    if (!sector) return fallo('Sector no válido.');
    if (!ZONAS_NORTE.includes(k.zona)) return fallo('Región no válida.');
    if (!sector.riesgos.includes(k.riesgo)) return fallo('Riesgo no válido para el sector.');
    const localidad = texto(k.localidad);
    if (localidad.length < 2) return fallo('Ingresa la localidad o predio.');
    if (!entero(k.monto, 5_000_000, 500_000_000)) return fallo('Monto fuera de rango.');
    if (!entero(k.meses, 1, 12)) return fallo('Periodo fuera de rango.');
    if (!entero(k.sens, 10, 100)) return fallo('Sensibilidad fuera de rango.');

    if (!entero(n.insuranceCategoryId, 1, 1e9)) return fallo('Elige el ramo de Nico.');
    if (!['uf', 'usd'].includes(n.currency)) return fallo('Moneda no válida (uf o usd).');
    const prima = n.estimatedNetPrime;
    if (prima !== undefined && prima !== null && !(typeof prima === 'number' && prima >= 0 && prima < 1e9)) return fallo('Prima neta estimada no válida.');

    return {
        datos: {
            cliente: { nombre, rut: rutFormateado(rut), tipo: c.tipo, industryId: c.industryId, direccion, contactoNombre, correo, telefono },
            cobertura: { sector, zona: k.zona, localidad, riesgo: k.riesgo, monto: k.monto, meses: k.meses, sens: k.sens },
            nico: {
                categoriaId: n.insuranceCategoryId, currency: n.currency, prima: typeof prima === 'number' ? prima : undefined,
                requested: n.requested === true, notas: texto(n.notas, 300),
            },
        },
    };
}

function construirPayloads({ cliente, cobertura, nico }, cuentaId) {
    const r = RIESGOS[cobertura.riesgo];
    const cot = cotizar(cobertura.riesgo, cobertura.monto, cobertura.meses, cobertura.sens);
    const descripcion =
        `Seguro paramétrico de ${r.nombre.toLowerCase()} (${r.indice.toLowerCase()}, ${r.dir === 'menor' ? 'bajo' : 'sobre'} ${cot.umbral.toFixed(0)} ${r.unidad}, pago total en ${r.salida} ${r.unidad}) ` +
        `para ${cobertura.sector.nombre} en ${cobertura.localidad}, ${cobertura.zona}. Monto asegurado ${clp(cobertura.monto)}, ${cobertura.meses} meses. Origen: SICR3P.` +
        (nico.notas ? ` ${nico.notas}` : '');

    const cuenta = {
        account: {
            name: cliente.nombre,
            national_identification: cliente.rut,
            legal_person_type: cliente.tipo,
            ...(cliente.tipo === 'legal' ? { industry_id: cliente.industryId } : {}),
            contacts_attributes: [{
                name: cliente.contactoNombre, email: cliente.correo,
                is_insured_user: true, is_primary_contact: true,
                ...(cliente.telefono ? { phone_number: cliente.telefono } : {}),
                address_attributes: { address: cliente.direccion },
            }],
        },
    };

    const lead = {
        lead: {
            account_id: cuentaId ?? '<id de la cuenta en Nico>',
            insurance_category_id: nico.categoriaId,
            currency: nico.currency,
            hiring_person_name: cliente.nombre, hiring_person_national_identification: cliente.rut, hiring_person_address: cliente.direccion,
            insured_person_name: cliente.nombre, insured_person_national_identification: cliente.rut, insured_person_address: cliente.direccion,
            responsible_email: cliente.correo,
            subject_matter: descripcion,
            validity_start: fechaDDMMAAAA(),
            requested: nico.requested,
            insurance_items_attributes: [{ name: `${r.nombre} — ${cobertura.localidad}`, notes: `Cotización SICR3P · umbral ${cot.umbral.toFixed(0)} ${r.unidad}` }],
            ...(nico.prima !== undefined ? { estimated_net_prime: nico.prima } : {}),
        },
    };
    return { cuenta, lead, cot };
}

// Busca una cuenta ya creada con el mismo RUT para no duplicarla.
async function buscarCuenta(rut) {
    const { status, data } = await nicoFetch('/api/v1/accounts_external', { query: { query: rut, display_length: '20' } });
    if (status !== 200) return null;
    const lista = Array.isArray(data?.data) ? data.data : [];
    const buscado = rutNormalizado(rut);
    const hit = lista.find((it) => JSON.stringify(it).toUpperCase().replace(/[.\s-]/g, '').includes(buscado));
    return hit ? { id: hit.id ?? hit.attributes?.id, nombre: hit.name ?? hit.attributes?.name } : null;
}

const mensajeNico = (data, status) =>
    (typeof data?.error === 'string' && data.error) || (typeof data?.message === 'string' && data.message) ||
    (data?.errors ? JSON.stringify(data.errors) : `Nico respondió ${status}.`);

export async function POST(request) {
    const { error, usuario } = await exigirAdmin();
    if (error) return error;

    const body = await request.json().catch(() => null);
    const v = validar(body);
    if (v.error) return v.error;
    const datos = v.datos;
    const { cliente, cobertura, nico } = datos;

    const base = {
        adminId: usuario.id, rut: cliente.rut, empresa: cliente.nombre, sector: cobertura.sector.slug, zona: cobertura.zona,
        localidad: cobertura.localidad, riesgo: cobertura.riesgo, monto: cobertura.monto, meses: cobertura.meses, sensibilidad: cobertura.sens,
    };

    // ---- SIMULAR (valor por defecto): no llama a Nico, solo muestra lo que se enviaría ----
    if (body?.simular !== false) {
        const { cuenta, lead, cot } = construirPayloads(datos, null);
        const operacionId = registrarOperacionNico({ ...base, prima: cot.prima, umbral: cot.umbral, payload: { cuenta, lead }, estado: 'SIMULADA' });
        return NextResponse.json({ simulado: true, operacionId, cuenta, lead, primaSicr3p: cot.prima, umbral: cot.umbral });
    }

    // ---- REAL: escribe en Nico ----
    const clave = rutNormalizado(cliente.rut);
    if (enCurso.has(clave)) return NextResponse.json({ error: 'Ya hay un envío en curso para este RUT.' }, { status: 409 });
    enCurso.add(clave);

    let operacionId = null;
    try {
        let cuentaId = null, reutilizada = false;

        // Reintento tras un fallo: reutiliza la cuenta ya creada por una operación anterior del mismo RUT.
        if (Number.isInteger(body?.operacionId)) {
            const previa = obtenerOperacionNico(body.operacionId);
            if (previa && previa.rut === cliente.rut && previa.nico_account_id && !previa.nico_lead_id && previa.estado === 'ERROR') {
                cuentaId = previa.nico_account_id;
                reutilizada = true;
            }
        }
        if (!cuentaId) {
            const existente = await buscarCuenta(cliente.rut);
            if (existente?.id) { cuentaId = existente.id; reutilizada = true; }
        }

        const { cuenta, lead, cot } = construirPayloads(datos, cuentaId);
        operacionId = registrarOperacionNico({ ...base, prima: cot.prima, umbral: cot.umbral, payload: { cuenta, lead }, estado: 'CUENTA_CREADA', cuentaId });

        if (!cuentaId) {
            const r = await nicoFetch('/api/v1/accounts_external', { method: 'POST', body: cuenta });
            cuentaId = idDe(r.data);
            if (![200, 201].includes(r.status) || !cuentaId) {
                const msg = `No se pudo crear la cuenta: ${mensajeNico(r.data, r.status)}`;
                actualizarOperacionNico(operacionId, { estado: 'ERROR', error: msg });
                return NextResponse.json({ error: msg, operacionId, detalle: r.data }, { status: r.status >= 500 ? 502 : r.status === 200 ? 502 : r.status });
            }
            actualizarOperacionNico(operacionId, { cuentaId });
            lead.lead.account_id = cuentaId;
        } else {
            lead.lead.account_id = Number.isNaN(Number(cuentaId)) ? cuentaId : Number(cuentaId);
        }

        const l = await nicoFetch('/api/v1/leads', { method: 'POST', body: lead });
        const leadId = idDe(l.data);
        if (![200, 201].includes(l.status)) {
            const msg = `La cuenta está en Nico (id ${cuentaId}) pero falló la cotización: ${mensajeNico(l.data, l.status)}`;
            actualizarOperacionNico(operacionId, { estado: 'ERROR', error: msg });
            return NextResponse.json({ error: msg, operacionId, cuentaId, reintentable: true, detalle: l.data }, { status: l.status >= 500 ? 502 : l.status });
        }
        actualizarOperacionNico(operacionId, { estado: 'ENVIADA', leadId: leadId ?? 'sin-id' });
        return NextResponse.json({ ok: true, operacionId, cuentaId, leadId, cuentaReutilizada: reutilizada }, { status: 201 });
    } catch (e) {
        const msg = e instanceof NicoError ? e.message : 'Error interno al hablar con Nico.';
        if (operacionId) actualizarOperacionNico(operacionId, { estado: 'ERROR', error: msg });
        if (!(e instanceof NicoError)) console.error('[nico-onboarding]', e?.message);
        return NextResponse.json({ error: msg, operacionId }, { status: e instanceof NicoError ? e.status : 500 });
    } finally {
        enCurso.delete(clave);
    }
}
