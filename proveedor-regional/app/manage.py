"""Provisionamiento local, sin contraseñas en argumentos o registros."""
import argparse
import getpass
import re
from .main import db, MODE, password_hash, init_db


def main():
    parser=argparse.ArgumentParser(description='Administración local del portal Proveedor Regional')
    sub=parser.add_subparsers(dest='command',required=True)
    create=sub.add_parser('create-organization')
    create.add_argument('--kind',choices=['foundation','company'],required=True)
    create.add_argument('--code',required=True)
    create.add_argument('--name',required=True)
    create.add_argument('--email',required=True)
    create.add_argument('--person',required=True)
    args=parser.parse_args()
    if MODE!='pilot':parser.error('Usa PR_MODE=pilot para provisionar; demo ya incluye usuarios ficticios.')
    if not re.fullmatch(r'[A-Z][A-Z0-9_]{0,31}',args.code):parser.error('Código inválido: usa letras mayúsculas, números y guion bajo.')
    if '@' not in args.email or len(args.email)>180:parser.error('Correo inválido.')
    password=getpass.getpass('Contraseña inicial (no se mostrará): ')
    if len(password)<14:parser.error('Usa una contraseña de al menos 14 caracteres.')
    if password!=getpass.getpass('Repite la contraseña: '):parser.error('Las contraseñas no coinciden.')
    init_db()
    with db() as c:
        cur=c.execute('INSERT INTO organizations(code,name,kind) VALUES(?,?,?)',(args.code,args.name,args.kind))
        c.execute('INSERT INTO users(org_id,name,email,password_hash,role) VALUES(?,?,?,?,?)',(cur.lastrowid,args.person,args.email.strip().lower(),password_hash(password),'admin'))
    print('Organización creada. No se han conectado cuentas, emitido pasaportes ni realizado operaciones financieras.')


if __name__=='__main__':main()
