from __future__ import annotations

import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone, date
from decimal import Decimal, InvalidOperation
from typing import Literal

from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
MODE = os.getenv('PR_MODE', 'demo')
if MODE not in ('demo', 'pilot'):
    raise RuntimeError('PR_MODE debe ser demo o pilot.')
DB_PATH = Path(os.getenv('PR_DATABASE', str(ROOT / 'data' / f'{MODE}.sqlite3')))
COOKIE = 'pr_session'
SESSION_HOURS = 8
COOKIE_SECURE = MODE != 'demo'
app = FastAPI(title='Programa Proveedor Regional', version='0.2.0')
_login_attempts: dict[str, list[float]] = {}
_login_lock = threading.Lock()


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    try:
        DB_PATH.chmod(0o600)
    except OSError:
        pass
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600_000)
    return f'pbkdf2_sha256$600000${salt}${digest.hex()}'


def password_matches(password: str, encoded: str) -> bool:
    try:
        _, iterations, salt, expected = encoded.split('$')
        got = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(iterations))
        return hmac.compare_digest(got.hex(), expected)
    except (ValueError, TypeError):
        return False


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def audit(conn, org_id, user_id, action, detail):
    conn.execute('INSERT INTO audit(org_id,user_id,action,detail,created_at) VALUES(?,?,?,?,?)',
                 (org_id, user_id, action, detail, now()))


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with db() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS organizations (
          id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('foundation','company')),
          rut TEXT NOT NULL DEFAULT '', region TEXT NOT NULL DEFAULT 'Antofagasta',
          commune TEXT NOT NULL DEFAULT '', sales_uf INTEGER NOT NULL DEFAULT 0,
          profile TEXT NOT NULL DEFAULT 'Inicial', status TEXT NOT NULL DEFAULT 'En revisión');
        CREATE UNIQUE INDEX IF NOT EXISTS one_foundation ON organizations(kind) WHERE kind='foundation';
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id),
          name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin','viewer')));
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),
          csrf_token TEXT NOT NULL,expires_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY,org_id INTEGER NOT NULL REFERENCES organizations(id),
          title TEXT NOT NULL,due_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Pendiente');
        CREATE TABLE IF NOT EXISTS passport (
          org_id INTEGER PRIMARY KEY REFERENCES organizations(id),code TEXT NOT NULL,
          issued_at TEXT NOT NULL,expires_at TEXT NOT NULL,requirements_json TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY,org_id INTEGER NOT NULL REFERENCES organizations(id),
          currency TEXT NOT NULL,balance TEXT NOT NULL,masked_number TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS movements (
          id INTEGER PRIMARY KEY,org_id INTEGER NOT NULL REFERENCES organizations(id),
          date TEXT NOT NULL,description TEXT NOT NULL,amount TEXT NOT NULL,currency TEXT NOT NULL,
          direction TEXT NOT NULL,status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS payment_drafts (
          id INTEGER PRIMARY KEY,org_id INTEGER NOT NULL REFERENCES organizations(id),
          user_id INTEGER NOT NULL REFERENCES users(id),beneficiary TEXT NOT NULL,
          amount TEXT NOT NULL,currency TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Borrador no enviado',
          created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS grants (
          id INTEGER PRIMARY KEY,owner_org_id INTEGER NOT NULL REFERENCES organizations(id),
          grantee_org_id INTEGER NOT NULL REFERENCES organizations(id),
          scope TEXT NOT NULL CHECK(scope='finance:read'),expires_at TEXT NOT NULL,
          revoked_at TEXT,user_id INTEGER NOT NULL REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS audit (
          id INTEGER PRIMARY KEY,org_id INTEGER NOT NULL REFERENCES organizations(id),
          user_id INTEGER REFERENCES users(id),action TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS webhook_inbox (
          id INTEGER PRIMARY KEY,org_id INTEGER NOT NULL REFERENCES organizations(id),
          event_hash TEXT NOT NULL,payload TEXT NOT NULL,received_at TEXT NOT NULL,
          UNIQUE(org_id,event_hash));
        CREATE TABLE IF NOT EXISTS financial_events (
          id INTEGER PRIMARY KEY,inbox_id INTEGER UNIQUE NOT NULL REFERENCES webhook_inbox(id),
          org_id INTEGER NOT NULL REFERENCES organizations(id),event_type TEXT NOT NULL,
          transaction_id TEXT,provider_status TEXT,amount TEXT,currency TEXT,
          transaction_created_at TEXT,received_at TEXT NOT NULL,state TEXT NOT NULL,
          source TEXT NOT NULL CHECK(source IN ('demo','global66')),issues_json TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS events_by_org ON financial_events(org_id,id);
        ''')
        if MODE != 'demo' or c.execute('SELECT COUNT(*) FROM organizations').fetchone()[0]:
            return
        orgs = [
            (1,'FUNDACION','Fundación · Operación del programa','foundation','DEMO-FUNDACION','Antofagasta','Antofagasta',0,'Coordinación','Demo'),
            (2,'EMPRESA1','Servicios Desierto Azul','company','DEMO-EMPRESA-01','Antofagasta','Mejillones',3850,'En Desarrollo','Demo'),
            (3,'EMPRESA2','Taller Costa Norte','company','DEMO-EMPRESA-02','Antofagasta','Antofagasta',1800,'Inicial','Demo')]
        c.executemany('INSERT INTO organizations VALUES(?,?,?,?,?,?,?,?,?,?)',orgs)
        shared_hash = password_hash('DemoRegional2026!')
        c.executemany('INSERT INTO users VALUES(?,?,?,?,?,?)',[
            (1,1,'Coordinación del programa','fundacion@demo.local',shared_hash,'admin'),
            (2,2,'Administración Desierto Azul','empresa1@demo.local',shared_hash,'admin'),
            (3,3,'Administración Costa Norte','empresa2@demo.local',shared_hash,'admin')])
        for org_id in (1,2,3):
            tasks=[('Actualizar antecedentes del programa','2026-11-06'),('Revisar ruta de desarrollo','2026-11-12')] if org_id==1 else [('Completar carpeta de antecedentes','2026-11-05'),('Preparar flujo de caja','2026-11-10')]
            c.executemany('INSERT INTO tasks(org_id,title,due_date) VALUES(?,?,?)',[(org_id,t,d) for t,d in tasks])
            balances = [('CLP','2480000'),('USD','1250.50')] if org_id==1 else [('CLP','6850000'),('USD','3420.75')] if org_id==2 else [('CLP','1240000'),('USD','340.25')]
            c.executemany('INSERT INTO accounts(org_id,currency,balance,masked_number) VALUES(?,?,?,?)',[(org_id,cur,bal,f'DEMO •••• {1000+org_id}') for cur,bal in balances])
            c.executemany('INSERT INTO movements(org_id,date,description,amount,currency,direction,status) VALUES(?,?,?,?,?,?,?)',[
                (org_id,'2026-10-25','Ingreso ilustrativo · datos ficticios','450000','CLP','in','Simulado'),
                (org_id,'2026-10-24','Pago ilustrativo a proveedor','85000','CLP','out','Simulado'),
                (org_id,'2026-10-23','Transferencia ilustrativa','120','USD','out','Simulado')])
            audit(c,org_id,None,'Demostración preparada','Datos ficticios; ninguna cuenta real conectada.')
        requirements=[
            {'label':'Identidad y representación','status':'Ejemplo completo','source':'Datos ficticios de demostración'},
            {'label':'Casa matriz y operación regional','status':'Ejemplo completo','source':'Datos ficticios; sin consulta al SII'},
            {'label':'Propiedad y residencia regional','status':'Pendiente','source':'No verificado'},
            {'label':'Cumplimiento aplicable','status':'Pendiente','source':'No verificado'},
            {'label':'Formación y capacidades','status':'En preparación','source':'Ejemplo de ruta del programa'}]
        c.executemany('INSERT INTO passport VALUES(?,?,?,?,?)',[(org_id,f'PR-DEMO-{org_id:03}','2026-10-26','2027-10-26',json.dumps(requirements,ensure_ascii=False)) for org_id in (2,3)])
    try:
        DB_PATH.chmod(0o600)
    except OSError:
        pass


init_db()


@app.middleware('http')
async def headers(request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['X-Frame-Options']='DENY'
    response.headers['Referrer-Policy']='same-origin'
    response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
    if request.url.path.startswith('/api/'):
        response.headers['Cache-Control']='no-store'
    return response


@app.exception_handler(Exception)
async def unhandled(request, exc):
    return JSONResponse(status_code=500,content={'detail':'No se pudo completar la operación. Revisa el servicio local.'})


def user_view(row):
    return {k:row[k] for k in ('id','name','email','org_id','org_name','role','kind')}


def current_user(request: Request):
    token=request.cookies.get(COOKIE,'')
    if not token:
        raise HTTPException(401,'Inicia sesión para continuar.')
    with db() as c:
        row=c.execute('''SELECT u.*,o.name AS org_name,o.kind,o.code AS org_code,s.csrf_token
          FROM sessions s JOIN users u ON u.id=s.user_id JOIN organizations o ON o.id=u.org_id
          WHERE s.token_hash=? AND s.expires_at>?''',(digest(token),now())).fetchone()
    if not row:
        raise HTTPException(401,'La sesión expiró. Vuelve a ingresar.')
    return dict(row)


def csrf_user(request: Request,user=Depends(current_user)):
    sent=request.headers.get('x-csrf-token','')
    if not sent or not hmac.compare_digest(sent,user['csrf_token']):
        raise HTTPException(403,'No se pudo validar la solicitud. Actualiza la sesión.')
    origin=request.headers.get('origin')
    if origin and origin.rstrip('/')!=str(request.base_url).rstrip('/'):
        raise HTTPException(403,'Origen de solicitud no autorizado.')
    return user


def writer(user=Depends(csrf_user)):
    if user['role']!='admin':
        raise HTTPException(403,'Esta acción requiere administración de tu organización.')
    return user


class StrictBody(BaseModel):
    model_config = {'extra': 'forbid'}


class Login(StrictBody):
    email: str=Field(min_length=3,max_length=180)
    password: str=Field(min_length=1,max_length=256)


@app.get('/')
def index():
    return FileResponse(ROOT/'app/static/index.html')


@app.get('/api/health')
def health():
    return {'status':'ok','mode':MODE,'live_payments':False,'program':'Proveedor Regional'}


@app.post('/api/login')
def login(body:Login,request:Request,response:Response):
    origin=request.headers.get('origin')
    if origin and origin.rstrip('/')!=str(request.base_url).rstrip('/'):
        raise HTTPException(403,'Origen no autorizado.')
    ip=request.client.host if request.client else 'unknown'
    with _login_lock:
        stamp=time.monotonic()
        recent=[t for t in _login_attempts.get(ip,[]) if stamp-t<60]
        if len(recent)>=10:
            raise HTTPException(429,'Espera un minuto antes de volver a intentar.')
        _login_attempts[ip]=recent+[stamp]
    with db() as c:
        row=c.execute('''SELECT u.*,o.name AS org_name,o.kind FROM users u
           JOIN organizations o ON o.id=u.org_id WHERE u.email=?''',(body.email.strip().lower(),)).fetchone()
        # Do equivalent password work for unknown users, without exposing existence.
        encoded=row['password_hash'] if row else 'pbkdf2_sha256$600000$'+('00'*16)+'$'+('00'*32)
        good=password_matches(body.password,encoded)
        if not row or not good:
            raise HTTPException(401,'Correo o contraseña incorrectos.')
        token=secrets.token_urlsafe(36);csrf=secrets.token_urlsafe(32)
        c.execute('DELETE FROM sessions WHERE expires_at<=?',(now(),))
        # Replace the session presented by this browser; switching organizations never
        # leaves the previous browser token active.
        old=request.cookies.get(COOKIE)
        if old:c.execute('DELETE FROM sessions WHERE token_hash=?',(digest(old),))
        c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(digest(token),row['id'],csrf,(datetime.now(timezone.utc)+timedelta(hours=SESSION_HOURS)).isoformat(timespec='seconds')))
        audit(c,row['org_id'],row['id'],'Inicio de sesión','Acceso a espacio propio.')
    response.set_cookie(COOKIE,token,httponly=True,secure=COOKIE_SECURE,samesite='strict',max_age=SESSION_HOURS*3600,path='/')
    return {'user':user_view(row),'csrf_token':csrf}


@app.get('/api/me')
def me(user=Depends(current_user)):
    return {'user':user_view(user),'csrf_token':user['csrf_token']}


@app.post('/api/logout')
def logout(request:Request,response:Response,user=Depends(csrf_user)):
    with db() as c:
        c.execute('DELETE FROM sessions WHERE token_hash=?',(digest(request.cookies.get(COOKIE,'')),))
        audit(c,user['org_id'],user['id'],'Cierre de sesión','Sesión revocada.')
    response.delete_cookie(COOKIE,path='/')
    return {'ok':True}


def org(c,org_id):
    row=c.execute('SELECT * FROM organizations WHERE id=?',(org_id,)).fetchone()
    if not row:raise HTTPException(404,'Organización no encontrada.')
    return dict(row)


def company_rows(c,user):
    if user['kind']=='foundation':
        rows=c.execute("SELECT * FROM organizations WHERE kind='company' ORDER BY name").fetchall()
    else:rows=c.execute('SELECT * FROM organizations WHERE id=?',(user['org_id'],)).fetchall()
    return [dict(x) for x in rows]


@app.get('/api/overview')
def overview(user=Depends(current_user)):
    with db() as c:
        companies=company_rows(c,user)
        tasks=[dict(x) for x in c.execute('SELECT id,title,due_date,status FROM tasks WHERE org_id=? ORDER BY due_date,id',(user['org_id'],))]
        activity=[dict(x) for x in c.execute('SELECT action,detail,created_at FROM audit WHERE org_id=? ORDER BY id DESC LIMIT 6',(user['org_id'],))]
        passport_count=c.execute('SELECT COUNT(*) FROM passport'+('' if user['kind']=='foundation' else ' WHERE org_id=?'),() if user['kind']=='foundation' else (user['org_id'],)).fetchone()[0]
        return {'org':org(c,user['org_id']),'stats':{'companies':len(companies),'passports':passport_count,'tasks':len(tasks),'pending_tasks':sum(x['status']=='Pendiente' for x in tasks)},'companies':companies,'tasks':tasks,'activity':activity}


@app.get('/api/companies')
def companies(user=Depends(current_user)):
    with db() as c:return {'items':company_rows(c,user)}


@app.get('/api/passport')
def passport(company_id:int|None=None,user=Depends(current_user)):
    target=company_id if company_id is not None else user['org_id']
    if user['kind']!='foundation' and target!=user['org_id']:
        raise HTTPException(403,'Solo puedes consultar tu propio Pasaporte.')
    with db() as c:
        company=org(c,target)
        p=c.execute('SELECT * FROM passport WHERE org_id=?',(target,)).fetchone()
        if not p:raise HTTPException(404,'Esta organización aún no tiene un Pasaporte de demostración.')
        return {'company':company,'passport':{'id':p['code'],'profile':company['profile'],'issued_at':p['issued_at'],'expires_at':p['expires_at'],'verification':'demo','requirements':json.loads(p['requirements_json'])}}


@app.get('/api/tasks')
def tasks(user=Depends(current_user)):
    with db() as c:return {'items':[dict(x) for x in c.execute('SELECT id,title,due_date,status FROM tasks WHERE org_id=? ORDER BY due_date,id',(user['org_id'],))]}


class TaskBody(StrictBody):
    title:str=Field(min_length=1,max_length=180)
    due_date:date


@app.post('/api/tasks',status_code=201)
def add_task(body:TaskBody,user=Depends(writer)):
    title=body.title.strip()
    if not title:raise HTTPException(422,'Escribe una actividad.')
    with db() as c:
        cur=c.execute('INSERT INTO tasks(org_id,title,due_date) VALUES(?,?,?)',(user['org_id'],title,body.due_date.isoformat()))
        audit(c,user['org_id'],user['id'],'Actividad creada',title)
        return {'id':cur.lastrowid,'title':title,'due_date':body.due_date.isoformat(),'status':'Pendiente'}


@app.post('/api/tasks/{task_id}/complete')
def finish_task(task_id:int,user=Depends(writer)):
    with db() as c:
        row=c.execute('SELECT * FROM tasks WHERE id=? AND org_id=?',(task_id,user['org_id'])).fetchone()
        if not row:raise HTTPException(404,'Actividad no encontrada en tu espacio.')
        c.execute("UPDATE tasks SET status='Completada' WHERE id=? AND org_id=?",(task_id,user['org_id']))
        audit(c,user['org_id'],user['id'],'Actividad completada',row['title'])
    return {'ok':True}


def finance_access(c,user,target):
    if target==user['org_id']:return
    if user['kind']!='foundation':raise HTTPException(403,'No tienes acceso a las finanzas de otra empresa.')
    grant=c.execute("SELECT id FROM grants WHERE owner_org_id=? AND grantee_org_id=? AND scope='finance:read' AND revoked_at IS NULL AND expires_at>?",(target,user['org_id'],now())).fetchone()
    if not grant:raise HTTPException(403,'La empresa debe autorizar primero la consulta temporal de sus finanzas.')


@app.get('/api/finance')
def finance(org_id:int|None=None,user=Depends(current_user)):
    target=org_id if org_id is not None else user['org_id']
    with db() as c:
        finance_access(c,user,target)
        organization=org(c,target)
        if target!=user['org_id']:
            audit(c,target,user['id'],'Consulta financiera autorizada','La fundación consultó con permiso temporal de lectura.')
            audit(c,user['org_id'],user['id'],'Consulta financiera','Consulta autorizada: '+organization['name'])
        try:
            from .global66 import config_status
            connection=config_status(organization['code'])
        except ImportError:connection={'configured':False,'live_reads_enabled':False}
        # Demo always returns synthetic records; it never makes a remote call.
        return {'org':organization,'mode':MODE,'data_source':'demo' if MODE=='demo' else 'local',
            'accounts':[dict(x) for x in c.execute('SELECT currency,balance,masked_number FROM accounts WHERE org_id=?',(target,))],
            'movements':[dict(x) for x in c.execute('SELECT id,date,description,amount,currency,direction,status FROM movements WHERE org_id=? ORDER BY date DESC,id DESC',(target,))],
            'connection':connection,
            'notifications':{'items':event_rows(c,target),'configured':bool(os.getenv('GLOBAL66_'+organization['code']+'_WEBHOOK_KEY',''))} if target==user['org_id'] else None,
            'drafts':[dict(x) for x in c.execute('SELECT id,beneficiary,amount,currency,status,created_at FROM payment_drafts WHERE org_id=? ORDER BY id DESC',(target,))] if target==user['org_id'] else []}


class PaymentBody(StrictBody):
    beneficiary:str=Field(min_length=2,max_length=160)
    amount:Decimal=Field(gt=0,max_digits=16,decimal_places=2)
    currency:Literal['CLP','USD','EUR']


@app.post('/api/payment-drafts',status_code=201)
def payment_draft(body:PaymentBody,user=Depends(writer)):
    beneficiary=body.beneficiary.strip()
    if len(beneficiary)<2:raise HTTPException(422,'Indica el beneficiario.')
    if body.currency=='CLP' and body.amount!=body.amount.to_integral_value():
        raise HTTPException(422,'Los montos en CLP deben expresarse en pesos enteros.')
    amount=str(body.amount.quantize(Decimal('0.01')))
    with db() as c:
        stamp=now()
        cur=c.execute('INSERT INTO payment_drafts(org_id,user_id,beneficiary,amount,currency,created_at) VALUES(?,?,?,?,?,?)',(user['org_id'],user['id'],beneficiary,amount,body.currency,stamp))
        audit(c,user['org_id'],user['id'],'Borrador creado',f'{body.currency} {amount} · No enviado a Global66.')
        return {'id':cur.lastrowid,'beneficiary':beneficiary,'amount':amount,'currency':body.currency,'status':'Borrador no enviado','created_at':stamp}


@app.post('/api/payments/execute')
def execute_disabled(user=Depends(writer)):
    raise HTTPException(403,'La ejecución de pagos reales no está habilitada en esta versión.')


@app.post('/api/finance/sync-read')
async def sync_read(user=Depends(writer)):
    if MODE=='demo':raise HTTPException(409,'La demostración no consulta cuentas reales. Configura un piloto separado con credenciales propias.')
    from .global66 import read_snapshot, IntegrationUnavailable
    try:
        snapshot=await read_snapshot(user['org_code'])
    except IntegrationUnavailable as exc:
        raise HTTPException(409,str(exc)) from None
    with db() as c:audit(c,user['org_id'],user['id'],'Consulta Global66','Lectura propia; sin ejecución de pagos.')
    # Deliberately return a separate live snapshot; never relabel demo/local entries as real.
    return snapshot


@app.get('/api/grants')
def grants(user=Depends(current_user)):
    with db() as c:
        rows=c.execute('''SELECT g.*,o.name AS owner_name FROM grants g JOIN organizations o ON o.id=g.owner_org_id
            WHERE g.owner_org_id=? OR g.grantee_org_id=? ORDER BY g.id DESC''',(user['org_id'],user['org_id'])).fetchall()
        items=[]
        for row in rows:
            item=dict(row);item['active']=not item['revoked_at'] and item['expires_at']>now();items.append(item)
        return {'items':items,'can_grant':user['kind']=='company' and user['role']=='admin'}


class GrantBody(StrictBody):
    duration_hours:Literal[1,24]=1


@app.post('/api/grants',status_code=201)
def add_grant(body:GrantBody,user=Depends(writer)):
    if user['kind']!='company':raise HTTPException(403,'La empresa titular es quien concede el permiso.')
    with db() as c:
        foundation=c.execute("SELECT id FROM organizations WHERE kind='foundation'").fetchone()
        if not foundation:raise HTTPException(409,'No hay una fundación destinataria configurada.')
        stamp=now();expiry=(datetime.now(timezone.utc)+timedelta(hours=body.duration_hours)).isoformat(timespec='seconds')
        c.execute('UPDATE grants SET revoked_at=? WHERE owner_org_id=? AND scope=? AND revoked_at IS NULL',(stamp,user['org_id'],'finance:read'))
        cur=c.execute('INSERT INTO grants(owner_org_id,grantee_org_id,scope,expires_at,user_id) VALUES(?,?,?,?,?)',(user['org_id'],foundation['id'],'finance:read',expiry,user['id']))
        audit(c,user['org_id'],user['id'],'Permiso concedido',f'Fundación: lectura de movimientos y saldos por {body.duration_hours} h. Sin facultad de pago.')
        audit(c,foundation['id'],user['id'],'Permiso recibido',user['org_name']+' autorizó lectura temporal de sus finanzas.')
        return {'id':cur.lastrowid,'scope':'finance:read','expires_at':expiry,'active':True}


@app.post('/api/grants/{grant_id}/revoke')
def revoke_grant(grant_id:int,user=Depends(writer)):
    with db() as c:
        row=c.execute('SELECT * FROM grants WHERE id=? AND owner_org_id=?',(grant_id,user['org_id'])).fetchone()
        if not row:raise HTTPException(404,'Permiso no encontrado en tu organización.')
        c.execute('UPDATE grants SET revoked_at=? WHERE id=?',(now(),grant_id))
        audit(c,user['org_id'],user['id'],'Permiso revocado','Se retiró el acceso de la fundación a futuras consultas.')
        audit(c,row['grantee_org_id'],user['id'],'Permiso retirado',user['org_name']+' revocó su acceso financiero.')
    return {'ok':True}


@app.get('/api/activity')
def activity(user=Depends(current_user)):
    with db() as c:return {'items':[dict(x) for x in c.execute('SELECT action,detail,created_at FROM audit WHERE org_id=? ORDER BY id DESC LIMIT 60',(user['org_id'],))]}


def event_rows(c, org_id):
    rows = c.execute('SELECT * FROM financial_events WHERE org_id=? ORDER BY id DESC LIMIT 100', (org_id,)).fetchall()
    items = []
    for row in rows:
        item = {k: row[k] for k in ('id','event_type','transaction_id','provider_status','amount','currency','transaction_created_at','received_at','state','source')}
        item['issues'] = json.loads(row['issues_json'])
        items.append(item)
    return items


def store_event(c, organization, document, source, actor_id=None):
    from .webhook_events import normalize_event
    # Hash the full canonical document for deduplication, but persist only the
    # normalized minimum. Counterparty names, bank accounts and identity numbers
    # from the source document are neither stored nor exposed by this receiver.
    canonical = json.dumps(document, sort_keys=True, separators=(',',':'), ensure_ascii=False, default=str)
    fingerprint = digest(source + ':' + canonical)
    existing = c.execute('SELECT id FROM webhook_inbox WHERE org_id=? AND event_hash=?', (organization['id'],fingerprint)).fetchone()
    if existing:
        return False
    expected_customer = os.getenv('GLOBAL66_'+organization['code']+'_CUSTOMER_ID','') if source=='global66' else ''
    normalized = normalize_event(document, expected_customer_id=expected_customer or None)
    stamp = now()
    cursor = c.execute('INSERT OR IGNORE INTO webhook_inbox(org_id,event_hash,payload,received_at) VALUES(?,?,?,?)',
                       (organization['id'], fingerprint, json.dumps(normalized, ensure_ascii=False), stamp))
    if not cursor.rowcount:
        return False
    c.execute('''INSERT INTO financial_events(inbox_id,org_id,event_type,transaction_id,provider_status,amount,currency,transaction_created_at,received_at,state,source,issues_json)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)''', (cursor.lastrowid,organization['id'],normalized['event_type'],normalized['transaction_id'],normalized['provider_status'],normalized['amount'],normalized['currency'],normalized['transaction_created_at'],stamp,normalized['state'],source,json.dumps(normalized['issues'],ensure_ascii=False)))
    audit(c,organization['id'],actor_id,'Aviso simulado' if source=='demo' else 'Notificación recibida',
          'Registro de transacción guardado para revisión. No acredita saldo ni ejecuta pagos.')
    return True


@app.get('/api/financial-events')
def financial_events(org_id:int|None=None,user=Depends(current_user)):
    if org_id is not None and org_id!=user['org_id']:
        raise HTTPException(403,'Las notificaciones están reservadas a la organización titular; el permiso de lectura anterior no se amplía.')
    with db() as c:
        return {'items':event_rows(c,user['org_id'])}


class SimulationBody(StrictBody):
    event_type: Literal['remittanceUpdate','paymentReceived']


@app.post('/api/demo/financial-events',status_code=201)
def simulate_event(body:SimulationBody,user=Depends(writer)):
    if MODE!='demo':raise HTTPException(403,'La simulación solo está disponible en el entorno demo.')
    transaction_id = int(time.time_ns() // 1000)
    if body.event_type=='remittanceUpdate':
        document={'event':'RMT - Transaction','payload':{
            'transactionId':transaction_id,'customerId':'DEMO','originAmount':Decimal('250.50'),
            'originCurrencyCode':'USD','status':'sent','createdAt':now()}}
    else:
        document={'event':'WALLET - Founding status','data':{
            'transactionId':transaction_id,'customerId':0,'originAmount':Decimal('150000'),
            'originCurrencyCode':'CLP','status':'COMPLETED','type':'DEPOSIT'}}
    with db() as c:
        organization=org(c,user['org_id'])
        store_event(c,organization,document,'demo',user['id'])
        return {'items':event_rows(c,user['org_id'])}


@app.post('/api/webhooks/global66/{tenant_code}')
async def webhook(tenant_code:str,request:Request):
    with db() as c:
        tenant=c.execute('SELECT id,code FROM organizations WHERE code=?',(tenant_code,)).fetchone()
    if not tenant:raise HTTPException(404,'Integración no encontrada.')
    expected=os.getenv('GLOBAL66_'+tenant['code']+'_WEBHOOK_KEY','')
    sent=request.headers.get('x-api-key','')
    if not expected or not sent or not hmac.compare_digest(expected,sent):
        raise HTTPException(401,'Notificación no autorizada.')
    if MODE=='demo':
        raise HTTPException(409,'La demo no recibe avisos reales. Usa la simulación del portal o configura una instancia piloto separada.')
    # Bound the streamed body before allocating/parsing it.
    raw=bytearray()
    async for chunk in request.stream():
        raw.extend(chunk)
        if len(raw)>65536:raise HTTPException(413,'Notificación demasiado grande.')
    try:
        def no_constant(value):
            raise ValueError('Non-finite JSON number')
        document=json.loads(raw,parse_float=Decimal,parse_constant=no_constant)
    except (ValueError,UnicodeDecodeError,InvalidOperation):
        raise HTTPException(400,'JSON no válido.') from None
    if not isinstance(document,dict):raise HTTPException(400,'El evento debe ser un objeto.')
    try:
        with db() as c:
            store_event(c,dict(tenant),document,'global66')
        # The database transaction committed before this acknowledgement.
    except sqlite3.Error:
        raise HTTPException(503,'No fue posible guardar el aviso. No se confirmó su recepción.') from None
    return {'ok':True}
