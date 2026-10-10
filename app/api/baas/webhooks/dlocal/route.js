import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { advanceSimPayout, getSimulatorState } from '@/lib/baas/dlocal';

/**
 * Webhook merchant dLocal Go (pay-in + payout notifications).
 * En simulator acepta body { type, payout_id|payment_id, status }.
 */
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const type = body.type || body.event || 'payout';
  const status = String(body.status || 'SUCCESS').toUpperCase();

  if (type === 'payout' || body.payout_id) {
    const payoutId = body.payout_id || body.id;
    advanceSimPayout(payoutId, status === 'SUCCESS' || status === 'COMPLETED' ? 'SUCCESS' : status);
    if (payoutId) {
      const map =
        status === 'SUCCESS' || status === 'COMPLETED'
          ? 'PAGADA'
          : status === 'REJECTED' || status === 'FAILED'
            ? 'RECHAZADA'
            : null;
      if (map) {
        db.prepare(`UPDATE baas_operaciones SET estado = ? WHERE dlocal_payout_id = ?`).run(map, payoutId);
      }
    }
    return NextResponse.json({ ok: true, simulator: getSimulatorState() });
  }

  if (type === 'payment' || body.payment_id) {
    const paymentId = body.payment_id || body.id;
    if (paymentId && (status === 'PAID' || status === 'SUCCESS')) {
      db.prepare(`UPDATE baas_operaciones SET estado = 'COBRADA' WHERE dlocal_payment_id = ?`).run(paymentId);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, received: body });
}
