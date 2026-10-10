import { NextResponse } from 'next/server';
import { initiatePayment, listPayments, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, readJson, withObAuth } from '@/lib/baas/ob-http';

export async function GET(request) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request, { requireConsent: true });
  if (error) return error;
  const rows = listPayments({ clientId: auth.client.client_id });
  return NextResponse.json({
    Data: {
      Payment: rows.map((p) => ({
        PaymentId: p.payment_id,
        Status: p.status,
        Amount: p.amount_clp,
        Currency: p.currency,
        CreationDateTime: p.creado_en,
      })),
    },
  });
}

export async function POST(request) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request, { requireConsent: true });
  if (error) return error;
  const body = (await readJson(request)) || {};
  try {
    const payment = await initiatePayment(auth, body.Data?.Initiation ? flattenInitiation(body) : body);
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return obError(err.message, err.message, err.status || 400);
  }
}

function flattenInitiation(body) {
  const i = body.Data?.Initiation || {};
  return {
    amount: i.InstructedAmount?.Amount,
    currency: i.InstructedAmount?.Currency,
    creditorName: i.CreditorAccount?.Name,
    creditorAccount: i.CreditorAccount?.Identification,
    bankCode: i.CreditorAccount?.SchemeName,
    reference: i.RemittanceInformation?.Unstructured,
    debtorRut: body.Data?.DebtorRut,
    country: body.Data?.Country || 'CL',
    creditorDocument: body.Data?.CreditorDocument,
  };
}
