"""Global66 adapter contract tests using an in-memory HTTP transport only."""
import json
import os
import unittest
from unittest.mock import patch

import httpx

from app.global66 import IntegrationUnavailable, config_status, read_snapshot


ENV = {
    "GLOBAL66_LIVE_READS": "true",
    "GLOBAL66_FUNDACION_CLIENT_ID": "demo-client-foundation",
    "GLOBAL66_FUNDACION_CLIENT_SECRET": "test-only-foundation-secret",
    "GLOBAL66_EMPRESA01_CLIENT_ID": "demo-client-company",
    "GLOBAL66_EMPRESA01_CLIENT_SECRET": "test-only-company-secret",
}


def response(payload, status=200):
    return httpx.Response(status, json=payload)


class ConnectorTests(unittest.IsolatedAsyncioTestCase):
    async def test_live_is_off_by_default_and_does_not_call_transport(self):
        def unexpected(_):
            self.fail("A disabled connector made an outbound request")
        with patch.dict(os.environ, {}, clear=True):
            status = config_status("FUNDACION")
            self.assertEqual(status["mode"], "disabled")
            with self.assertRaises(IntegrationUnavailable) as cm:
                await read_snapshot("FUNDACION", _transport=httpx.MockTransport(unexpected))
            self.assertEqual(cm.exception.code, "live_disabled")

    async def test_credentials_are_per_tenant_and_not_returned(self):
        with patch.dict(os.environ, ENV, clear=True):
            a = config_status("FUNDACION")
            b = config_status("EMPRESA02")
            self.assertTrue(a["configured"])
            self.assertFalse(b["configured"])
            self.assertNotIn("secret", json.dumps(a))
            self.assertNotIn(ENV["GLOBAL66_FUNDACION_CLIENT_ID"], json.dumps(a))
            with self.assertRaises(IntegrationUnavailable) as cm:
                await read_snapshot("EMPRESA02", _transport=httpx.MockTransport(lambda _: self.fail("No tenant fallback")))
            self.assertEqual(cm.exception.code, "not_configured")

    async def test_exact_read_contract_and_decimal_precision(self):
        seen = []
        def handler(req):
            seen.append((req.method, str(req.url)))
            if req.url.path.endswith("/auth"):
                self.assertNotIn("Authorization", req.headers)
                self.assertEqual(json.loads(req.content), {
                    "clientId": ENV["GLOBAL66_EMPRESA01_CLIENT_ID"],
                    "clientSecret": ENV["GLOBAL66_EMPRESA01_CLIENT_SECRET"],
                })
                return response({"token": "test-token", "refreshToken": "test-refresh"})
            self.assertEqual(req.headers["Authorization"], "test-token")
            if req.url.path.endswith("/accounts"):
                return response({"accounts": [{"walletId": 123, "currency": "USD", "balance": "100.00000001", "isPrincipal": True}]})
            self.assertEqual(req.url.path, "/business-api/b2b/movements/123")
            self.assertEqual(req.url.params["page"], "1")
            return response({"movements": [{"id": 42, "amount": "0.12345678", "currencyCode": "USD", "typeMovement": "DEPOSIT", "status": "PAID"}], "totalPages": 1})
        with patch.dict(os.environ, ENV, clear=True):
            result = await read_snapshot("EMPRESA01", _transport=httpx.MockTransport(handler))
        self.assertEqual(result["source"], "global66")
        self.assertEqual(result["accounts"][0]["balance"], "100.00000001")
        self.assertEqual(result["movements"][0]["amount"], "0.12345678")
        self.assertEqual(result["movements"][0]["direction"], "in")
        self.assertFalse(result["partial"])
        self.assertTrue(all(url.startswith("https://api.global66.com/business-api/") for _, url in seen))
        self.assertEqual([method for method, _ in seen], ["POST", "GET", "GET"])
        self.assertNotIn("test-token", json.dumps(result))
        self.assertNotIn("test-refresh", json.dumps(result))

    async def test_empty_accounts_is_valid_without_movement_calls(self):
        def handler(req):
            if req.url.path.endswith("/auth"):
                return response({"token": "test-token"})
            self.assertTrue(req.url.path.endswith("/accounts"))
            return response({"accounts": []})
        with patch.dict(os.environ, ENV, clear=True):
            result = await read_snapshot("FUNDACION", _transport=httpx.MockTransport(handler))
        self.assertEqual(result["accounts"], [])
        self.assertEqual(result["movements"], [])
        self.assertFalse(result["partial"])

    async def test_account_and_pagination_limits_are_reported(self):
        seen = []
        def handler(req):
            seen.append(str(req.url))
            if req.url.path.endswith("/auth"):
                return response({"token": "t"})
            if req.url.path.endswith("/accounts"):
                return response({"accounts": [
                    {"walletId": 1, "currency": "CLP", "balance": 0},
                    {"walletId": 2, "currency": "USD", "balance": 99},
                ]})
            return response({"movements": [], "totalPages": 4})
        with patch.dict(os.environ, {**ENV, "GLOBAL66_MAX_ACCOUNTS": "1", "GLOBAL66_MAX_MOVEMENT_PAGES": "1"}, clear=True):
            result = await read_snapshot("FUNDACION", _transport=httpx.MockTransport(handler))
        self.assertTrue(result["partial"])
        self.assertEqual(len(result["accounts"]), 1)
        self.assertEqual(len(seen), 3)
        self.assertNotIn("/movements/2", " ".join(seen))

    async def test_optional_movement_fields_are_unknown_not_zero(self):
        def handler(req):
            if req.url.path.endswith("/auth"):
                return response({"token": "t"})
            if req.url.path.endswith("/accounts"):
                return response({"accounts": [{"walletId": 1, "currency": "EUR", "balance": 0}]})
            return response({"movements": [{}], "totalPages": 1})
        with patch.dict(os.environ, ENV, clear=True):
            result = await read_snapshot("FUNDACION", _transport=httpx.MockTransport(handler))
        self.assertIsNone(result["movements"][0]["amount"])
        self.assertIsNone(result["movements"][0]["id"])
        self.assertEqual(result["movements"][0]["direction"], "unknown")

    async def test_provider_errors_do_not_disclose_body_or_credentials(self):
        private = "PRIVATE_RESPONSE_WITH_TOKEN_OR_SECRET"
        def handler(_):
            return response({"message": private, "secret": ENV["GLOBAL66_FUNDACION_CLIENT_SECRET"]}, 403)
        with patch.dict(os.environ, ENV, clear=True):
            with self.assertRaises(IntegrationUnavailable) as cm:
                await read_snapshot("FUNDACION", _transport=httpx.MockTransport(handler))
        self.assertEqual(cm.exception.code, "access_rejected")
        self.assertNotIn(private, str(cm.exception))
        self.assertNotIn("test-only-foundation-secret", repr(cm.exception))

    async def test_unexpected_auth_schema_fails_closed(self):
        def handler(_):
            return response({"access_token": "not-the-documented-field"})
        with patch.dict(os.environ, ENV, clear=True):
            with self.assertRaises(IntegrationUnavailable) as cm:
                await read_snapshot("FUNDACION", _transport=httpx.MockTransport(handler))
        self.assertEqual(cm.exception.code, "invalid_auth_response")

    async def test_redirect_does_not_forward_secret_to_another_host(self):
        seen = []
        def handler(req):
            seen.append(req.url.host)
            return httpx.Response(302, headers={"Location": "https://example.invalid/capture"})
        with patch.dict(os.environ, ENV, clear=True):
            with self.assertRaises(IntegrationUnavailable) as cm:
                await read_snapshot("FUNDACION", _transport=httpx.MockTransport(handler))
        self.assertEqual(cm.exception.code, "request_rejected")
        self.assertEqual(seen, ["api.global66.com"])

    async def test_tenant_code_cannot_be_path_or_env_injection(self):
        for invalid in ["../FUNDACION", "fundacion", "A-B", "", "A/../B"]:
            with self.subTest(invalid=invalid):
                with self.assertRaises(IntegrationUnavailable) as cm:
                    config_status(invalid)
                self.assertEqual(cm.exception.code, "invalid_tenant")


if __name__ == "__main__":
    unittest.main()
