"""Regression tests for tenant isolation, delegated reads and session boundaries.

Run from the project root:
    python -m unittest discover -s tests -p 'test_isolation.py' -v

All credentials, webhook keys and financial data in this file are fictitious.
No test contacts Global66 or any external service.
"""
from __future__ import annotations

import atexit
import importlib
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient


_TEMP = tempfile.TemporaryDirectory(prefix='pr-isolation-')
atexit.register(_TEMP.cleanup)
_TEST_ROOT = Path(_TEMP.name)
os.environ['PR_MODE'] = 'demo'
os.environ['PR_DATABASE'] = str(_TEST_ROOT / 'seed.sqlite3')
main = importlib.import_module('app.main')
# Be robust if another suite imported app.main first in this same process.
main.MODE = 'demo'
main.COOKIE_SECURE = False
main.DB_PATH = _TEST_ROOT / 'seed.sqlite3'
main.init_db()
_SEED = main.DB_PATH
PASSWORD = 'DemoRegional2026!'


class IsolationTests(unittest.TestCase):
    def setUp(self):
        self.database = _TEST_ROOT / (self._testMethodName + '.sqlite3')
        shutil.copyfile(_SEED, self.database)
        main.DB_PATH = self.database
        main._login_attempts.clear()

    def client(self):
        client = TestClient(main.app, raise_server_exceptions=False)
        self.addCleanup(client.close)
        return client

    def login(self, who='empresa1'):
        client = self.client()
        response = client.post('/api/login', json={
            'email': f'{who}@demo.local', 'password': PASSWORD,
        })
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        return client, {'X-CSRF-Token': data['csrf_token']}, data['user']

    def grant(self, client, headers, duration=1):
        response = client.post('/api/grants', json={'duration_hours': duration}, headers=headers)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_private_endpoints_require_authentication(self):
        client = self.client()
        for path in ['/api/me', '/api/overview', '/api/companies', '/api/passport?company_id=2',
                     '/api/tasks', '/api/finance', '/api/grants', '/api/activity']:
            with self.subTest(path=path):
                self.assertEqual(client.get(path).status_code, 401)

    def test_login_cookie_and_response_do_not_expose_passwords(self):
        client, _, user = self.login()
        self.assertEqual(user['org_id'], 2)
        response = client.get('/api/me')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('password_hash', response.text)
        self.assertNotIn(PASSWORD, response.text)
        cookies = client.cookies
        self.assertTrue(cookies.get(main.COOKIE))
        # The only bearer session token is held in the HttpOnly cookie.
        fresh = self.client().post('/api/login', json={'email': 'empresa1@demo.local', 'password': PASSWORD})
        self.assertIn('httponly', fresh.headers['set-cookie'].lower())
        self.assertIn('samesite=strict', fresh.headers['set-cookie'].lower())
        self.assertNotIn('token', fresh.json())

    def test_invalid_credentials_are_generic(self):
        client = self.client()
        bad_password = client.post('/api/login', json={'email': 'empresa1@demo.local', 'password': 'incorrecta'})
        unknown = client.post('/api/login', json={'email': 'nadie@demo.local', 'password': 'incorrecta'})
        self.assertEqual(bad_password.status_code, 401)
        self.assertEqual(unknown.status_code, 401)
        self.assertEqual(bad_password.json(), unknown.json())

    def test_writes_require_csrf_and_same_origin(self):
        client, headers, _ = self.login()
        body = {'title': 'Actividad de prueba', 'due_date': '2026-11-05'}
        self.assertEqual(client.post('/api/tasks', json=body).status_code, 403)
        self.assertEqual(client.post('/api/tasks', json=body,
                                     headers={'X-CSRF-Token': 'inventado'}).status_code, 403)
        self.assertEqual(client.post('/api/tasks', json=body,
                                     headers={**headers, 'Origin': 'https://otro.example'}).status_code, 403)
        self.assertEqual(client.post('/api/tasks', json=body,
                                     headers={**headers, 'Origin': 'http://testserver'}).status_code, 201)

    def test_company_registry_and_passports_are_isolated(self):
        company, _, _ = self.login()
        listed = company.get('/api/companies').json()['items']
        self.assertEqual([row['id'] for row in listed], [2])
        own = company.get('/api/passport?company_id=2')
        self.assertEqual(own.status_code, 200)
        self.assertEqual(own.json()['company']['id'], 2)
        self.assertEqual(company.get('/api/passport?company_id=3').status_code, 403)
        foundation, _, _ = self.login('fundacion')
        self.assertEqual({row['id'] for row in foundation.get('/api/companies').json()['items']}, {2, 3})
        self.assertEqual(foundation.get('/api/passport?company_id=3').status_code, 200)

    def test_company_financial_read_isolation(self):
        company, _, _ = self.login()
        own = company.get('/api/finance')
        self.assertEqual(own.status_code, 200)
        self.assertEqual(own.json()['org']['id'], 2)
        self.assertEqual(company.get('/api/finance?org_id=3').status_code, 403)
        self.assertEqual(company.get('/api/finance?org_id=1').status_code, 403)
        # An irrelevant query argument cannot change the scope of overview.
        overview = company.get('/api/overview?org_id=3').json()
        self.assertEqual(overview['org']['id'], 2)
        self.assertEqual([row['id'] for row in overview['companies']], [2])

    def test_tasks_cannot_be_created_or_completed_in_another_tenant(self):
        company, headers, _ = self.login()
        other, other_headers, _ = self.login('empresa2')
        foreign_id = other.get('/api/tasks').json()['items'][0]['id']
        self.assertEqual(company.post(f'/api/tasks/{foreign_id}/complete', headers=headers).status_code, 404)
        body = {'title': 'Solo mi empresa', 'due_date': '2026-11-06', 'org_id': 3}
        created = company.post('/api/tasks', json=body, headers=headers)
        self.assertEqual(created.status_code, 422)
        body.pop('org_id')
        created = company.post('/api/tasks', json=body, headers=headers)
        self.assertEqual(created.status_code, 201)
        task_id = created.json()['id']
        self.assertIn(task_id, [x['id'] for x in company.get('/api/tasks').json()['items']])
        self.assertNotIn(task_id, [x['id'] for x in other.get('/api/tasks').json()['items']])
        self.assertEqual(other.post(f'/api/tasks/{task_id}/complete', headers=other_headers).status_code, 404)
        self.assertEqual(company.post(f'/api/tasks/{task_id}/complete', headers=headers).status_code, 200)

    def test_foundation_has_no_financial_access_without_grant(self):
        foundation, _, _ = self.login('fundacion')
        self.assertEqual(foundation.get('/api/finance').json()['org']['id'], 1)
        self.assertEqual(foundation.get('/api/finance?org_id=2').status_code, 403)
        self.assertEqual(foundation.get('/api/finance?org_id=3').status_code, 403)

    def test_delegation_allows_only_selected_company_and_records_receipt(self):
        owner, owner_headers, _ = self.login()
        foundation, _, _ = self.login('fundacion')
        grant = self.grant(owner, owner_headers)
        self.assertEqual(grant['scope'], 'finance:read')
        allowed = foundation.get('/api/finance?org_id=2')
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed.json()['org']['id'], 2)
        self.assertEqual(foundation.get('/api/finance?org_id=3').status_code, 403)
        receipt = owner.get('/api/activity').json()['items']
        self.assertTrue(any(row['action'] == 'Consulta financiera autorizada' for row in receipt))

    def test_revocation_blocks_future_requests_immediately(self):
        owner, owner_headers, _ = self.login()
        foundation, _, _ = self.login('fundacion')
        grant = self.grant(owner, owner_headers)
        self.assertEqual(foundation.get('/api/finance?org_id=2').status_code, 200)
        revoke = owner.post(f"/api/grants/{grant['id']}/revoke", headers=owner_headers)
        self.assertEqual(revoke.status_code, 200)
        self.assertEqual(foundation.get('/api/finance?org_id=2').status_code, 403)
        row = owner.get('/api/grants').json()['items'][0]
        self.assertFalse(row['active'])
        self.assertIsNotNone(row['revoked_at'])

    def test_expired_permission_does_not_authorize_read(self):
        owner, owner_headers, _ = self.login()
        foundation, _, _ = self.login('fundacion')
        grant = self.grant(owner, owner_headers)
        with main.db() as connection:
            connection.execute('UPDATE grants SET expires_at=? WHERE id=?',
                               ('2000-01-01T00:00:00+00:00', grant['id']))
        self.assertEqual(foundation.get('/api/finance?org_id=2').status_code, 403)
        self.assertFalse(owner.get('/api/grants').json()['items'][0]['active'])

    def test_permission_cannot_be_granted_or_revoked_by_unrelated_user(self):
        owner, owner_headers, _ = self.login()
        other, other_headers, _ = self.login('empresa2')
        foundation, foundation_headers, _ = self.login('fundacion')
        grant = self.grant(owner, owner_headers)
        self.assertEqual(other.post(f"/api/grants/{grant['id']}/revoke", headers=other_headers).status_code, 404)
        self.assertEqual(other.get('/api/grants').json()['items'], [])
        self.assertEqual(foundation.post('/api/grants', json={'duration_hours': 1},
                                         headers=foundation_headers).status_code, 403)
        self.assertEqual(owner.post('/api/grants', json={'duration_hours': 48},
                                    headers=owner_headers).status_code, 422)
        self.assertEqual(foundation.get('/api/finance?org_id=2').status_code, 200)

    def test_replacing_a_permission_revokes_previous_grant(self):
        owner, headers, _ = self.login()
        previous = self.grant(owner, headers, 1)
        current = self.grant(owner, headers, 24)
        grants = owner.get('/api/grants').json()['items']
        active = [g for g in grants if g['active']]
        self.assertEqual([g['id'] for g in active], [current['id']])
        self.assertIsNotNone(next(g for g in grants if g['id'] == previous['id'])['revoked_at'])

    def test_draft_is_scoped_to_owner_and_never_executes_money(self):
        owner, headers, _ = self.login()
        foundation, _, _ = self.login('fundacion')
        other, _, _ = self.login('empresa2')
        balances_before = owner.get('/api/finance').json()['accounts']
        response = owner.post('/api/payment-drafts', json={
            'beneficiary': 'Proveedor de prueba', 'amount': '200.50',
            'currency': 'USD', 'org_id': 3,
        }, headers=headers)
        self.assertEqual(response.status_code, 422)
        response = owner.post('/api/payment-drafts', json={
            'beneficiary': 'Proveedor de prueba', 'amount': '200.50',
            'currency': 'USD',
        }, headers=headers)
        self.assertEqual(response.status_code, 201)
        draft = response.json()
        self.assertEqual(draft['status'], 'Borrador no enviado')
        self.assertEqual(owner.get('/api/finance').json()['drafts'][0]['id'], draft['id'])
        self.grant(owner, headers)
        delegated = foundation.get('/api/finance?org_id=2')
        self.assertEqual(delegated.status_code, 200)
        self.assertEqual(delegated.json()['drafts'], [])
        self.assertEqual(other.get('/api/finance').json()['drafts'], [])
        self.assertEqual(foundation.get('/api/finance').json()['drafts'], [])
        self.assertEqual(owner.post('/api/payments/execute', headers=headers).status_code, 403)
        self.assertEqual(owner.get('/api/finance').json()['accounts'], balances_before)

    def test_payment_validation_and_demo_live_read_guard(self):
        owner, headers, _ = self.login()
        for amount, currency in [('0', 'USD'), ('-1', 'CLP'), ('1.50', 'CLP'), ('1.001', 'EUR')]:
            with self.subTest(amount=amount, currency=currency):
                response = owner.post('/api/payment-drafts', json={
                    'beneficiary': 'Prueba', 'amount': amount, 'currency': currency,
                }, headers=headers)
                self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(owner.post('/api/finance/sync-read', headers=headers).status_code, 409)

    def test_session_replacement_logout_and_expiry(self):
        client, old_headers, _ = self.login()
        old_token = client.cookies.get(main.COOKIE)
        replacement = client.post('/api/login', json={
            'email': 'empresa2@demo.local', 'password': PASSWORD,
        })
        self.assertEqual(replacement.status_code, 200)
        new_headers = {'X-CSRF-Token': replacement.json()['csrf_token']}
        stale = self.client()
        stale.cookies.set(main.COOKIE, old_token)
        self.assertEqual(stale.get('/api/me').status_code, 401)
        self.assertEqual(client.get('/api/me').json()['user']['org_id'], 3)
        self.assertEqual(client.post('/api/logout', headers=old_headers).status_code, 403)
        self.assertEqual(client.post('/api/logout', headers=new_headers).status_code, 200)
        self.assertEqual(client.get('/api/me').status_code, 401)
        client, _, _ = self.login()
        with main.db() as connection:
            connection.execute('UPDATE sessions SET expires_at=?', ('2000-01-01T00:00:00+00:00',))
        self.assertEqual(client.get('/api/me').status_code, 401)

    def test_viewer_cannot_mutate_but_can_logout(self):
        with main.db() as connection:
            connection.execute("UPDATE users SET role='viewer' WHERE id=2")
        viewer, headers, _ = self.login()
        self.assertEqual(viewer.get('/api/finance').status_code, 200)
        self.assertEqual(viewer.post('/api/tasks', json={
            'title': 'No permitido', 'due_date': '2026-11-05',
        }, headers=headers).status_code, 403)
        self.assertEqual(viewer.post('/api/grants', json={'duration_hours': 1}, headers=headers).status_code, 403)
        self.assertEqual(viewer.post('/api/logout', headers=headers).status_code, 200)
        self.assertEqual(viewer.get('/api/me').status_code, 401)

    def test_webhook_authentication_deduplication_and_tenant_boundary(self):
        client = self.client()
        payload = {'type': 'MONEY_RECEIVED', 'id': 'fictional-event-1', 'amount': '10'}
        with patch.object(main, 'MODE', 'pilot'), patch.dict(os.environ, {
            'GLOBAL66_EMPRESA1_WEBHOOK_KEY': 'fake-key-one',
            'GLOBAL66_EMPRESA2_WEBHOOK_KEY': 'fake-key-two',
        }):
            self.assertEqual(client.post('/api/webhooks/global66/UNKNOWN', json=payload).status_code, 404)
            self.assertEqual(client.post('/api/webhooks/global66/EMPRESA1', json=payload).status_code, 401)
            self.assertEqual(client.post('/api/webhooks/global66/EMPRESA2', json=payload,
                                         headers={'x-api-key': 'fake-key-one'}).status_code, 401)
            for _ in range(2):
                self.assertEqual(client.post('/api/webhooks/global66/EMPRESA1', json=payload,
                                             headers={'x-api-key': 'fake-key-one'}).status_code, 200)
            self.assertEqual(client.post('/api/webhooks/global66/EMPRESA2', json=payload,
                                         headers={'x-api-key': 'fake-key-two'}).status_code, 200)
            self.assertEqual(client.post('/api/webhooks/global66/EMPRESA1', json=[],
                                         headers={'x-api-key': 'fake-key-one'}).status_code, 400)
        with main.db() as connection:
            counts = dict(connection.execute('SELECT org_id,COUNT(*) FROM webhook_inbox GROUP BY org_id').fetchall())
            self.assertEqual(counts, {2: 1, 3: 1})
            self.assertEqual(connection.execute('SELECT COUNT(*) FROM movements').fetchone()[0], 9)

    def test_login_throttling_and_security_headers(self):
        client = self.client()
        for _ in range(10):
            self.assertEqual(client.post('/api/login', json={
                'email': 'empresa1@demo.local', 'password': 'incorrecta',
            }).status_code, 401)
        self.assertEqual(client.post('/api/login', json={
            'email': 'empresa1@demo.local', 'password': PASSWORD,
        }).status_code, 429)
        health = client.get('/api/health')
        self.assertFalse(health.json()['live_payments'])
        self.assertEqual(health.headers['cache-control'], 'no-store')
        self.assertEqual(health.headers['x-frame-options'], 'DENY')
        self.assertEqual(health.headers['x-content-type-options'], 'nosniff')


if __name__ == '__main__':
    unittest.main()
