"""Normalize the uploaded Global66 B2B webhook contract without moving funds.

The source has no required fields. Missing/unknown fields are retained as unknown
and flagged, rather than being converted to zero or used to update balances.
"""
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any

REMITTANCE_STATUSES = {'successful', 'created', 'rejected', 'sent'}
PAYMENT_STATUSES = {'COMPLETED','PAID','PENDING_VERIFICATION','REJECTED',
                    'RELEASED','REJETED','PENDING','VERIFIED'}


def _identifier(value: Any) -> str | None:
    if isinstance(value, bool) or value is None:
        return None
    text = str(value)
    if not text.isascii() or not text.isdigit() or len(text) > 19:
        return None
    if int(text) > 9223372036854775807:
        return None
    return text


def _money(value: Any) -> str | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or len(amount.as_tuple().digits) > 40 or abs(amount.adjusted()) > 40:
            return None
        return format(amount, 'f')
    except (InvalidOperation, ValueError, TypeError):
        return None


def normalize_event(document: dict, expected_customer_id: str | None = None) -> dict:
    """Return only minimum account-scoped fields, never bank/identity details."""
    issues = []
    payload, data = document.get('payload'), document.get('data')
    if isinstance(payload, dict) and not isinstance(data, dict):
        event_type, body = 'remittanceUpdate', payload
    elif isinstance(data, dict) and not isinstance(payload, dict):
        event_type, body = 'paymentReceived', data
    else:
        event_type, body = 'unknown', {}
        issues.append('El formato no permite distinguir una remesa de una recepción; revisar el aviso.')
    transaction_id = _identifier(body.get('transactionId'))
    if transaction_id is None:
        issues.append('Identificador de transacción no informado o no válido.')
    raw_status = body.get('status')
    status = raw_status[:80] if isinstance(raw_status, str) and raw_status else None
    allowed = REMITTANCE_STATUSES if event_type == 'remittanceUpdate' else PAYMENT_STATUSES
    if status is None or status not in allowed:
        issues.append('Estado no informado o distinto de los descritos en el archivo.')
    if status == 'REJETED':
        issues.append('El archivo incluye el estado literal REJETED; confirmar su interpretación sin corregirlo automáticamente.')
    amount = _money(body.get('originAmount'))
    if amount is None:
        issues.append('Monto de origen no informado o no válido; no se presume cero.')
    currency = body.get('originCurrencyCode')
    if not isinstance(currency, str) or len(currency) != 3 or not currency.isascii() or not currency.isalpha() or not currency.isupper():
        currency = None
        issues.append('Moneda de origen no informada o no válida.')
    created = None
    value = body.get('createdAt')
    if value is not None:
        try:
            if not isinstance(value, str) or len(value) > 64:
                raise ValueError
            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                raise ValueError
            created = dt.isoformat()
        except (ValueError, TypeError):
            issues.append('La fecha de la transacción no tiene un formato con zona horaria válido.')
    if expected_customer_id:
        customer = body.get('customerId')
        if isinstance(customer, bool) or customer is None or str(customer).strip() != expected_customer_id.strip():
            issues.append('El cliente informado no coincide con el esperado para esta conexión; revisar sin enrutar a otra empresa.')
            # A mismatched identity must not disclose another customer's financial
            # details, even to the holder of the endpoint's organization.
            transaction_id = status = amount = currency = created = None
    return {
        'event_type': event_type,
        'transaction_id': transaction_id,
        'provider_status': status,
        'amount': amount,
        'currency': currency,
        'transaction_created_at': created,
        'state': 'needs_review' if issues else 'reported',
        'issues': issues,
    }
