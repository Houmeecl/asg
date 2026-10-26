"""Bounded, tenant-scoped Global66 read adapter.

No payment execution, beneficiary creation, FX operation or RaaS endpoint is exposed.
Callers MUST authorize the requested tenant before calling this module. Live reads
are opt-in server-side; no credentials are accepted from a browser or API payload.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import os
import re
from typing import Any

import httpx

BASE_URL = "https://api.global66.com/business-api"
_TENANT = re.compile(r"[A-Z][A-Z0-9_]{0,31}\Z")
_MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class IntegrationUnavailable(Exception):
    """Safe exception: no provider response, request, secret or token is retained."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _prefix(tenant_code: str) -> str:
    if not isinstance(tenant_code, str) or not _TENANT.fullmatch(tenant_code):
        raise IntegrationUnavailable("invalid_tenant", "La organización no tiene un código de integración válido.")
    return f"GLOBAL66_{tenant_code}_"


def _credentials(tenant_code: str) -> tuple[str, str]:
    prefix = _prefix(tenant_code)
    return os.getenv(prefix + "CLIENT_ID", ""), os.getenv(prefix + "CLIENT_SECRET", "")


def config_status(tenant_code: str) -> dict[str, Any]:
    """Return configuration flags only, never credential values or tokens."""
    client_id, secret = _credentials(tenant_code)
    enabled = os.getenv("GLOBAL66_LIVE_READS", "false").lower() == "true"
    configured = bool(client_id and secret)
    return {
        "provider": "Global66",
        "configured": configured,
        "live_reads_enabled": enabled,
        "mode": "ready" if enabled and configured else "disabled",
        "credentials_scope": "tenant",
        "message": (
            "Lectura habilitada; conexión real todavía no validada."
            if enabled and configured
            else "Lectura real deshabilitada." if not enabled
            else "Faltan credenciales de esta organización en el servidor."
        ),
    }


def _limit(name: str, default: int, maximum: int) -> int:
    try:
        number = int(os.getenv(name, str(default)))
    except (ValueError, TypeError):
        return default
    return min(max(number, 1), maximum)


def _decimal(value: Any, *, required: bool = False) -> str | None:
    if value is None and not required:
        return None
    if isinstance(value, bool):
        raise IntegrationUnavailable("invalid_response", "La respuesta financiera no tiene el formato esperado.")
    try:
        parsed = Decimal(str(value))
        if not parsed.is_finite() or len(parsed.as_tuple().digits) > 40 or abs(parsed.adjusted()) > 40:
            raise InvalidOperation
    except (InvalidOperation, ValueError, TypeError):
        raise IntegrationUnavailable("invalid_response", "La respuesta financiera no tiene el formato esperado.") from None
    return format(parsed, "f")


def _text(value: Any, maximum: int = 240) -> str | None:
    return value[:maximum] if isinstance(value, str) else None


def _currency(value: Any) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[A-Z]{3,5}", value):
        raise IntegrationUnavailable("invalid_response", "La respuesta financiera no tiene el formato esperado.")
    return value


def _id(value: Any) -> str:
    if isinstance(value, bool) or not isinstance(value, (int, str)) or not re.fullmatch(r"[0-9]{1,24}", str(value)):
        raise IntegrationUnavailable("invalid_response", "La respuesta financiera no tiene el formato esperado.")
    return str(value)


async def _json(client: httpx.AsyncClient, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
    """Only known auth/read paths are admitted, even for an internal caller."""
    is_auth = method == "POST" and path == "/b2b/auth"
    is_read = method == "GET" and (
        path == "/b2b/accounts" or re.fullmatch(r"/b2b/movements/[0-9]{1,24}", path)
    )
    if not (is_auth or is_read):
        raise IntegrationUnavailable("operation_not_allowed", "Esta integración permite solo consultas financieras.")
    response = await client.request(method, path, **kwargs)
    if response.status_code in (401, 403):
        raise IntegrationUnavailable("access_rejected", "Global66 rechazó el acceso. Revise credenciales, permisos e IP de salida con su administrador.")
    if response.status_code == 429:
        raise IntegrationUnavailable("rate_limited", "Global66 limitó temporalmente las consultas. Intente más tarde.")
    if response.status_code >= 500:
        raise IntegrationUnavailable("provider_unavailable", "Global66 no está disponible para esta consulta.")
    if response.status_code != 200:
        raise IntegrationUnavailable("request_rejected", "Global66 no aceptó la consulta solicitada.")
    if len(response.content) > _MAX_RESPONSE_BYTES:
        raise IntegrationUnavailable("invalid_response", "La respuesta excede el tamaño admitido para esta consulta.")
    try:
        payload = response.json(parse_float=Decimal)
    except (ValueError, TypeError):
        raise IntegrationUnavailable("invalid_response", "Global66 no entregó una respuesta válida para la consulta.") from None
    if not isinstance(payload, dict):
        raise IntegrationUnavailable("invalid_response", "Global66 no entregó una respuesta válida para la consulta.")
    return payload


async def read_snapshot(
    tenant_code: str, *, _transport: httpx.AsyncBaseTransport | None = None
) -> dict[str, Any]:
    """Read own accounts and bounded movement pages using that tenant's credential.

    Financial amounts are decimal strings. Missing optional values remain None.
    `partial` is True when account/page limits or incomplete pagination apply.
    Tests may inject MockTransport; callers should not supply `_transport`.
    """
    status = config_status(tenant_code)
    if not status["live_reads_enabled"]:
        raise IntegrationUnavailable("live_disabled", "La conexión real de solo lectura está deshabilitada.")
    if not status["configured"]:
        raise IntegrationUnavailable("not_configured", "Faltan las credenciales de esta organización en el servidor.")
    client_id, secret = _credentials(tenant_code)
    max_accounts = _limit("GLOBAL66_MAX_ACCOUNTS", 3, 20)
    max_pages = _limit("GLOBAL66_MAX_MOVEMENT_PAGES", 2, 10)
    try:
        # Global66 documents base /business-api; relative paths keep that prefix.
        async with asyncio.timeout(35):
            async with httpx.AsyncClient(
                base_url=BASE_URL + "/",
                timeout=httpx.Timeout(10, connect=5),
                follow_redirects=False,
                transport=_transport,
            ) as client:
                # httpx leading-slash paths are relative to base_url's path prefix.
                auth = await _json(client, "POST", "/b2b/auth", json={"clientId": client_id, "clientSecret": secret})
                token = auth.get("token")
                if not isinstance(token, str) or not token or len(token) > 8192 or "\r" in token or "\n" in token:
                    raise IntegrationUnavailable("invalid_auth_response", "Global66 no entregó un acceso válido para la consulta.")
                headers = {"Authorization": token}
                result = await _json(client, "GET", "/b2b/accounts", headers=headers)
                raw_accounts = result.get("accounts")
                if not isinstance(raw_accounts, list):
                    raise IntegrationUnavailable("invalid_response", "La lista de cuentas no tiene el formato esperado.")
                accounts: list[dict[str, Any]] = []
                movements: list[dict[str, Any]] = []
                partial = len(raw_accounts) > max_accounts
                for item in raw_accounts[:max_accounts]:
                    if not isinstance(item, dict):
                        raise IntegrationUnavailable("invalid_response", "La lista de cuentas no tiene el formato esperado.")
                    wallet_id = _id(item.get("walletId"))
                    currency = _currency(item.get("currency"))
                    accounts.append({
                        "id": wallet_id,
                        "currency": currency,
                        "balance": _decimal(item.get("balance"), required=True),
                        "alias": _text(item.get("alias")),
                        "is_principal": item.get("isPrincipal") is True,
                    })
                    for page in range(1, max_pages + 1):
                        payload = await _json(client, "GET", f"/b2b/movements/{wallet_id}", headers=headers, params={"page": page})
                        records = payload.get("movements")
                        if not isinstance(records, list) or len(records) > 50:
                            raise IntegrationUnavailable("invalid_response", "La lista de movimientos no tiene el formato esperado.")
                        for record in records:
                            if not isinstance(record, dict):
                                raise IntegrationUnavailable("invalid_response", "La lista de movimientos no tiene el formato esperado.")
                            raw_id = record.get("id")
                            # Most fields are optional in the provider's documented schema.
                            direction = {"DEPOSIT": "in", "WITHDRAWAL": "out"}.get(record.get("typeMovement"), "unknown")
                            movements.append({
                                "id": _id(raw_id) if raw_id is not None else None,
                                "account_id": wallet_id,
                                "date": _text(record.get("date"), 40),
                                "amount": _decimal(record.get("amount")),
                                "currency": _currency(record.get("currencyCode", currency)),
                                "direction": direction,
                                "status": _text(record.get("status"), 80),
                                "description": _text(record.get("comment")) or _text(record.get("nameCommerce")) or "Movimiento Global66",
                            })
                        total_pages = payload.get("totalPages")
                        if isinstance(total_pages, bool) or not isinstance(total_pages, int) or total_pages < 0:
                            partial = True
                            break
                        if page >= total_pages:
                            break
                        if page == max_pages:
                            partial = True
                return {
                    "source": "global66",
                    "tenant_code": tenant_code,
                    "as_of": datetime.now(timezone.utc).isoformat(),
                    "accounts": accounts,
                    "movements": movements,
                    "partial": partial,
                }
    except IntegrationUnavailable:
        raise
    except (httpx.HTTPError, TimeoutError, ValueError, TypeError, KeyError):
        # Never relay provider URLs, bodies, request headers or exception repr.
        raise IntegrationUnavailable("connection_failed", "No fue posible completar la consulta de Global66. No se modificaron fondos.") from None
