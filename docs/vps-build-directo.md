# Build directo en el VPS (plataforma limpia)

Sin ciclo “agente → push → PR → deploy”. El código productivo vive en el
Cloud Server; `main` en GitHub queda como referencia limpia.

## Una vez: levantar plataforma limpia

En **consola web DonWeb** o tu SSH (root), pegá:

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/BUILD-PLATAFORMA-LIMPIA-VPS.sh | bash
```

Eso clona/resetea `/var/www/sicr3p` a **`main`**, cablea
`https://supabase.sicr3p.cl`, nginx en `sicr3p.cl` → `:3000`, `npm ci` +
`build` + pm2.

## Día a día (programar en el VPS)

```bash
export NVM_DIR=$HOME/.nvm; . $NVM_DIR/nvm.sh
cd /var/www/sicr3p
# editá archivos (nano/vim o VS Code Remote SSH cuando 5757 esté abierto)
npm run build
pm2 restart sicr3p
```

No hace falta `git push` para que el sitio cambie. Si querés versionar
después, `git commit` desde el VPS cuando te convenga.

## Dominios

| Host | Rol |
|------|-----|
| `supabase.sicr3p.cl` | Supabase + cert del panel |
| `sicr3p.cl` | App Next (pm2) |
| `mail.sicr3p.cl` | Opcional (poste.io) — ver `docs/correo-selfhost.md` |

## Firewall

Panel DonWeb: `80`, `443`, `5757` (SSH). No `5432`.
