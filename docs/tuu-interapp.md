# Adapter InterApp TUU

Implementación: `lib/baas/tuu.js`.

## Packages

- Dev: `com.haulmer.paymentapp.dev`
- Prod: `com.haulmer.paymentapp`

## Payload de entrada (TUU Demo)

```json
{
  "amount": 200,
  "tip": 0,
  "cashback": 0,
  "method": 0,
  "installmentsQuantity": 0,
  "printVoucherOnApp": true,
  "dteType": 48,
  "extraData": {
    "taxIdnValidation": "<RUT_comercio>",
    "exemptAmount": 0,
    "netAmount": 200,
    "sourceName": "sicr3p",
    "sourceVersion": "0.1.0",
    "customFields": [
      { "name": "operationId", "value": "<id>", "print": true }
    ]
  }
}
```

## Mock (Cloud Agent)

`mockTuuCharge({ amount, reference })`:

- aprobado → `sequenceNumber`, auth, last4
- monto `% 100 === 13` → REJECTED
- monto `% 100 === 66` → CANCELED

Respuesta se persiste en `baas_operaciones.tuu_sequence` vía `cobrarConTuuMock`.

## Impresión

Preferir `printVoucherOnApp: true`. Librería KOZEN solo si el voucher lo genera la app SICR3P.
