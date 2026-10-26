"""Contract tests for the uploaded OpenAPI notification specification.

Synthetic payloads only. No test contacts Global66 or moves money.
Run: python -m unittest discover -s tests -p test_webhook_contract.py -v
"""
from __future__ import annotations

import atexit
import copy
import importlib
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

_TEMP = tempfile.TemporaryDirectory(prefix='pr-webhook-contract-')
atexit.register(_TEMP.cleanup)
_TEST_ROOT = Path(_TEMP.name)
os.environ['PR_MODE'] = 'demo'
os.environ['PR_DATABASE'] = str(_TEST_ROOT / 'seed.sqlite3')
main = importlib.import_module('app.main')
main.MODE = 'demo'
main.COOKIE_SECURE = False
main.DB_PATH = _TEST_ROOT / 'seed.sqlite3'
main.init_db()
_SEED = main.DB_PATH
PASSWORD = 'DemoRegional2026!'
KEYS = {
    'GLOBAL66_EMPRESA1_WEBHOOK_KEY': 'synthetic-tenant-one-key',
    'GLOBAL66_EMPRESA2_WEBHOOK_KEY': 'synthetic-tenant-two-key',
    'GLOBAL66_FUNDACION_WEBHOOK_KEY': 'synthetic-foundation-key',
}


def remittance(status='successful'):
    return {
        'event': 'RMT - Transaction',
        'payload': {
            'transactionId': 9007199254740993,
            'customerId': 'synthetic-customer-one',
            'originCurrencyCode': 'USD',
            'destinyCurrencyCode': 'CLP',
            'originAmount': 5000,
            'destinyAmount': 4990,
            'status': status,
            'createdAt': '2025-01-01T22:10:00Z',
            'accountNumberBeneficiary': 'SYNTHETIC-PRIVATE-ACCOUNT',
            'dniBeneficiary': 'SYNTHETIC-PRIVATE-DOCUMENT',
            'bank': 'Synthetic private bank',
        },
    }


def received(status='COMPLETED'):
    return {
        'event': 'WALLET - Founding status',
        'data': {
            'transactionId': 34567687,
            'customerId': 3456767,
            'originAmount': 150,
            'originAmountUSD"': 150,
            'originCurrencyCode': 'PEN',
            'originCountryCode': 'PE',
            'status': status,
            'thirdPartyClientName': 'SYNTHETIC-PRIVATE-COUNTERPARTY',
            'accountBranch': 'SYNTHETIC-PRIVATE-BRANCH',
            'type': 'DEPOSIT',
        },
    }


class WebhookContractTests(unittest.TestCase):
    def setUp(self):
        self.database = _TEST_ROOT / (self._testMethodName + '.sqlite3')
        shutil.copyfile(_SEED, self.database)
        main.DB_PATH = self.database
        main.MODE = 'demo'
        main.COOKIE_SECURE = False
        main._login_attempts.clear()
        self.environment = patch.dict(os.environ, KEYS)
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.client = TestClient(main.app, raise_server_exceptions=False)
        self.addCleanup(self.client.close)

    def login(self, who='empresa1'):
        client = TestClient(main.app, raise_server_exceptions=False)
        self.addCleanup(client.close)
        result = client.post('/api/login', json={
            'email': who + '@demo.local', 'password': PASSWORD,
        })
        self.assertEqual(result.status_code, 200, result.text)
        return client, {'X-CSRF-Token': result.json()['csrf_token']}

    def post_event(self, payload, tenant='EMPRESA1', key=None, raw=None):
        with patch.object(main, 'MODE', 'pilot'):
            headers = {
                'x-api-key': key if key is not None else KEYS['GLOBAL66_' + tenant + '_WEBHOOK_KEY'],
                'Content-Type': 'application/json',
            }
            if raw is not None:
                return self.client.post('/api/webhooks/global66/' + tenant, content=raw, headers=headers)
            return self.client.post('/api/webhooks/global66/' + tenant, json=payload, headers=headers)

    def list_events(self, client):
        result = client.get('/api/financial-events')
        self.assertEqual(result.status_code, 200, result.text)
        return result.json()['items']

    def counts(self):
        with main.db() as c:
            return tuple(c.execute('SELECT COUNT(*) FROM ' + table).fetchone()[0]
                         for table in ('webhook_inbox', 'financial_events'))

    def test_key_validation_and_demo_guard_do_not_accept_bearer_alone(self):
        url = '/api/webhooks/global66/EMPRESA1'
        for headers in ({}, {'x-api-key': 'wrong'}, {'Authorization': 'Bearer synthetic-token'},
                        {'x-api-key': KEYS['GLOBAL66_EMPRESA2_WEBHOOK_KEY']}):
            with self.subTest(headers=list(headers)):
                response = self.client.post(url, json=remittance(), headers=headers)
                self.assertEqual(response.status_code, 401, response.text)
        response = self.client.post(url, json=remittance(), headers={
            'x-api-key': KEYS['GLOBAL66_EMPRESA1_WEBHOOK_KEY'],
        })
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.counts(), (0, 0))

    def test_remittance_payload_preserves_precision_and_large_identifier(self):
        payload = remittance()
        # Send a JSON number rather than a string without first rounding it as a float.
        raw = json.dumps(payload).replace('"originAmount": 5000', '"originAmount": 9876543210.123456')
        response = self.post_event(None, raw=raw)
        self.assertEqual(response.status_code, 200, response.text)
        owner, _ = self.login()
        event = self.list_events(owner)[0]
        self.assertEqual(event['event_type'], 'remittanceUpdate')
        self.assertEqual(event['transaction_id'], '9007199254740993')
        self.assertEqual(event['provider_status'], 'successful')
        self.assertEqual(event['amount'], '9876543210.123456')
        self.assertEqual(event['currency'], 'USD')
        self.assertEqual(event['source'], 'global66')
        self.assertEqual(event['state'], 'reported')
        self.assertTrue(event['received_at'])
        self.assertTrue(event['transaction_created_at'].startswith('2025-01-01T22:10:00'))

    def test_payment_received_accepts_documented_typos_without_rewriting_status(self):
        response = self.post_event(received('REJETED'))
        self.assertEqual(response.status_code, 200, response.text)
        owner, _ = self.login()
        event = self.list_events(owner)[0]
        self.assertEqual(event['event_type'], 'paymentReceived')
        self.assertEqual(event['provider_status'], 'REJETED')
        self.assertEqual(event['transaction_id'], '34567687')
        self.assertEqual(event['amount'], '150')
        self.assertEqual(event['currency'], 'PEN')
        self.assertIsNone(event['transaction_created_at'])
        self.assertNotEqual(event['state'], 'paid')

    def test_optional_and_unknown_payloads_are_saved_for_review_without_fake_zero(self):
        for payload in ({'event': 'RMT - Transaction', 'payload': {}},
                        {'event': 'WALLET - Founding status', 'data': {}},
                        {'event': 'unknown-event', 'unrecognized': {'value': 'x'}}):
            result = self.post_event(payload)
            self.assertEqual(result.status_code, 200, result.text)
        owner, _ = self.login()
        events = self.list_events(owner)
        self.assertEqual(len(events), 3)
        for event in events:
            self.assertEqual(event['state'], 'needs_review')
            self.assertIsNone(event['amount'])
            self.assertIsNone(event['currency'])
            self.assertIsNone(event['transaction_id'])
            self.assertIsNone(event['provider_status'])
            self.assertTrue(event['issues'])
        self.assertEqual(self.counts(), (3, 3))

    def test_duplicate_is_one_record_but_new_status_remains_a_new_event(self):
        payload = remittance('created')
        self.assertEqual(self.post_event(payload).status_code, 200)
        # JSON object order must not cause an otherwise identical event to duplicate.
        reversed_payload = dict(reversed(list(payload.items())))
        self.assertEqual(self.post_event(reversed_payload).status_code, 200)
        self.assertEqual(self.counts(), (1, 1))
        self.assertEqual(self.post_event(remittance('sent')).status_code, 200)
        self.assertEqual(self.post_event(remittance('successful')).status_code, 200)
        self.assertEqual(self.counts(), (3, 3))
        owner, _ = self.login()
        self.assertEqual({x['provider_status'] for x in self.list_events(owner)},
                         {'created', 'sent', 'successful'})

    def test_organization_boundaries_and_existing_grant_do_not_share_notifications(self):
        self.assertEqual(self.post_event(received()).status_code, 200)
        self.assertEqual(self.post_event(received(), tenant='EMPRESA2').status_code, 200)
        owner, owner_headers = self.login()
        other, _ = self.login('empresa2')
        foundation, _ = self.login('fundacion')
        self.assertEqual(len(self.list_events(owner)), 1)
        self.assertEqual(len(self.list_events(other)), 1)
        self.assertEqual(self.list_events(foundation), [])
        self.assertEqual(owner.get('/api/financial-events?org_id=3').status_code, 403)
        permission = owner.post('/api/grants', json={'duration_hours': 1}, headers=owner_headers)
        self.assertEqual(permission.status_code, 201)
        shared = foundation.get('/api/finance?org_id=2')
        self.assertEqual(shared.status_code, 200)
        self.assertIsNone(shared.json()['notifications'])
        self.assertEqual(self.list_events(foundation), [])
        own_data = owner.get('/api/finance').json()['notifications']
        self.assertEqual(len(own_data['items']), 1)

    def test_public_event_view_omits_bank_identity_and_raw_fields(self):
        self.assertEqual(self.post_event(remittance()).status_code, 200)
        self.assertEqual(self.post_event(received()).status_code, 200)
        owner, _ = self.login()
        text = owner.get('/api/financial-events').text
        for value in ('SYNTHETIC-PRIVATE-ACCOUNT', 'SYNTHETIC-PRIVATE-DOCUMENT',
                      'SYNTHETIC-PRIVATE-COUNTERPARTY', 'SYNTHETIC-PRIVATE-BRANCH',
                      'accountNumberBeneficiary', 'dniBeneficiary', 'thirdPartyClientName',
                      'remitterBankName', 'payload', 'customerId', 'x-api-key'):
            self.assertNotIn(value, text)

    def test_notifications_never_change_balances_or_ledger_movements(self):
        owner, _ = self.login()
        before = owner.get('/api/finance').json()
        self.assertEqual(self.post_event(remittance()).status_code, 200)
        self.assertEqual(self.post_event(received()).status_code, 200)
        after = owner.get('/api/finance').json()
        self.assertEqual(after['accounts'], before['accounts'])
        self.assertEqual(after['movements'], before['movements'])
        self.assertEqual(after['drafts'], before['drafts'])

    def test_database_failure_is_not_acknowledged_as_success(self):
        with main.db() as c:
            c.execute('''CREATE TRIGGER fail_test_notification BEFORE INSERT ON webhook_inbox
                BEGIN SELECT RAISE(FAIL, 'synthetic storage failure'); END''')
        response = self.post_event(received())
        self.assertNotEqual(response.status_code, 200)
        self.assertGreaterEqual(response.status_code, 500)
        self.assertNotIn('synthetic storage failure', response.text)
        self.assertEqual(self.counts(), (0, 0))

    def test_demo_simulation_is_authenticated_scoped_and_disabled_in_pilot(self):
        self.assertEqual(self.client.post('/api/demo/financial-events', json={
            'event_type': 'paymentReceived',
        }).status_code, 401)
        owner, headers = self.login()
        other, _ = self.login('empresa2')
        before = owner.get('/api/finance').json()['accounts']
        self.assertEqual(owner.post('/api/demo/financial-events', json={
            'event_type': 'paymentReceived',
        }).status_code, 403)
        self.assertEqual(owner.post('/api/demo/financial-events', json={
            'event_type': 'paymentReceived', 'org_id': 3,
        }, headers=headers).status_code, 422)
        self.assertEqual(owner.post('/api/demo/financial-events', json={
            'event_type': 'paymentReceived',
        }, headers=headers).status_code, 201)
        events = self.list_events(owner)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['source'], 'demo')
        self.assertEqual(self.list_events(other), [])
        self.assertEqual(owner.get('/api/finance').json()['accounts'], before)
        with patch.object(main, 'MODE', 'pilot'):
            response = owner.post('/api/demo/financial-events', json={
                'event_type': 'remittanceUpdate',
            }, headers=headers)
        self.assertIn(response.status_code, (403, 409))
        self.assertEqual(len(self.list_events(owner)), 1)
        # Invalid JSON/oversized bodies never become valid transaction records.
        response = self.post_event(None, raw='{')
        self.assertEqual(response.status_code, 400)
        response = self.post_event(None, raw='x' * 65537)
        self.assertEqual(response.status_code, 413)
        self.assertEqual(len(self.list_events(owner)), 1)


    def test_mismatched_expected_customer_does_not_expose_financial_details(self):
        from app.webhook_events import normalize_event
        result = normalize_event({'event':'RMT - Transaction','payload':{
            'transactionId':123456,'customerId':'other-customer',
            'originAmount':987,'originCurrencyCode':'USD','status':'sent',
            'createdAt':'2026-10-26T12:00:00Z'}}, expected_customer_id='expected-customer')
        self.assertEqual(result['state'],'needs_review')
        for field in ['transaction_id','provider_status','amount','currency','transaction_created_at']:
            self.assertIsNone(result[field])
        self.assertTrue(result['issues'])

if __name__ == '__main__':
    unittest.main()
