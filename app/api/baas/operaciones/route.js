import { NextResponse } from 'next/server';
import { exigirEmpresa, exigirOps, exigirUsuarioSesion } from '@/lib/auth';
import {
  crearOperacionEnvio,
  crearOperacionTurista,
  listOperaciones,
  cobrarConTuuMock,
  marcarCobroTurista,
  cerrarLote,
  liberarLoteConDlocal,
  getOperacion,
} from '@/lib/baas/operations';
import { createPayment } from '@/lib/baas/dlocal';
import db from '@/lib/db';

export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ operaciones: listOperaciones({ limit: 100 }) });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'crear_envio';

  if (action === 'crear_envio') {
    const usuario = await exigirEmpresa();
    if (!usuario) {
      // Admin también puede crear en demo
      const u = await exigirUsuarioSesion();
      if (!u || (u.rol !== 'ADMIN' && u.rol !== 'EMPRESA')) {
        return NextResponse.json({ error: 'Solo empresa' }, { status: 403 });
      }
      const created = crearOperacionEnvio({
        montoClp: body.montoClp,
        paisDestino: body.paisDestino || 'PE',
        monedaDestino: body.monedaDestino || 'PEN',
        rutEmisor: body.rutEmisor,
        empresaUsuarioId: u.id,
        beneficiarioId: body.beneficiarioId,
      });
      return NextResponse.json(created);
    }
    const created = crearOperacionEnvio({
      montoClp: body.montoClp,
      paisDestino: body.paisDestino || 'PE',
      monedaDestino: body.monedaDestino || 'PEN',
      rutEmisor: body.rutEmisor,
      empresaUsuarioId: usuario.id,
      beneficiarioId: body.beneficiarioId,
    });
    return NextResponse.json(created);
  }

  if (action === 'crear_turista') {
    const usuario = await exigirOps();
    if (!usuario) return NextResponse.json({ error: 'Solo ops' }, { status: 403 });
    const created = crearOperacionTurista({
      montoClp: body.montoClp,
      empresaUsuarioId: usuario.id,
      nota: body.nota,
    });
    return NextResponse.json(created);
  }

  if (action === 'cobrar_tuu') {
    const usuario = await exigirOps();
    if (!usuario) return NextResponse.json({ error: 'Solo ops' }, { status: 403 });
    try {
      const result = await cobrarConTuuMock(body.operacionId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  if (action === 'cobrar_turista') {
    try {
      const op = marcarCobroTurista(body.token);
      return NextResponse.json({ ok: true, operacion: op });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  if (action === 'cerrar_lote') {
    const usuario = await exigirOps();
    if (!usuario) return NextResponse.json({ error: 'Solo ops' }, { status: 403 });
    const lote = cerrarLote();
    if (!lote) return NextResponse.json({ error: 'No hay operaciones COBRADA' }, { status: 400 });
    return NextResponse.json({ lote });
  }

  if (action === 'liberar_lote') {
    const usuario = await exigirOps();
    if (!usuario) return NextResponse.json({ error: 'Solo ops' }, { status: 403 });
    try {
      const result = await liberarLoteConDlocal(body.loteId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  if (action === 'get') {
    const op = getOperacion(body.operacionId);
    return NextResponse.json({ operacion: op });
  }

  if (action === 'payin_dlocal') {
    const usuario = await exigirOps();
    if (!usuario) return NextResponse.json({ error: 'Solo ops' }, { status: 403 });
    const op = getOperacion(body.operacionId);
    if (!op) return NextResponse.json({ error: 'Operación no encontrada' }, { status: 404 });
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://sicr3p.cl';
      const payment = await createPayment({
        amount: op.monto_clp || body.montoClp,
        currency: 'CLP',
        country: 'CL',
        orderId: op.id,
        description: body.description || `SICR3P op ${op.id}`,
        successUrl: body.successUrl || `${origin}/ops`,
        backUrl: body.backUrl || `${origin}/ops`,
        notificationUrl: body.notificationUrl || `${origin}/api/baas/webhooks/dlocal`,
      });
      const paymentId = payment.id || payment.payment_id;
      if (paymentId) {
        db.prepare(`UPDATE baas_operaciones SET dlocal_payment_id = ? WHERE id = ?`).run(String(paymentId), op.id);
      }
      return NextResponse.json({ ok: true, payment, operacion: getOperacion(op.id) });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
}
