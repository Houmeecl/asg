# Manual de marca SICR3P v1.0

Identidad visual oficial (octubre 2026).

| Superficie | Dónde |
|------------|--------|
| Página viva | [`/marca`](../app/marca/page.js) → `https://sicr3p.cl/marca` |
| Kit SVG | [`public/brand/logos/`](../public/brand/logos/) · UI `/marca#kit` |
| Componente React | [`app/components/SicrLogo.js`](../app/components/SicrLogo.js) |
| Tokens CSS | [`app/brand.css`](../app/brand.css) |
| Tipografía | Inter en [`app/layout.js`](../app/layout.js) (`--font-body`) |
| Referencia visual | [`public/brand/manual-marca-v1.jpg`](../public/brand/manual-marca-v1.jpg) |
| Mock landing | [`public/brand/manual-landing-ref.jpg`](../public/brand/manual-landing-ref.jpg) |

---

## 1. Logo

### Reglas

- Wordmark en **minúsculas**: `sicr3p/`
- Acento **violeta** solo en `3/`
- No alterar proporciones, no recolorear fuera de las variantes oficiales
- Slogan: *Desarrollamos empresas. Acercamos soluciones.*

### Variantes (`SicrLogo`)

| `variant` | Uso |
|-----------|-----|
| `full` (default) | Wordmark navy + violeta en `3/` |
| `mono` | Una sola tinta (navy o blanco según `contrast`) |
| `isotype` | Solo `3/` |

Props: `size` (`sm` \| `md` \| `lg`), `contrast` (`dark` \| `light`), `compact` / `showTagline`.

```jsx
import SicrLogo from '@/app/components/SicrLogo';

<SicrLogo size="sm" contrast="dark" compact />
<SicrLogo size="lg" contrast="light" variant="mono" />
<SicrLogo size="lg" contrast="dark" variant="isotype" />
```

### Kit SVG (descarga)

Archivos estáticos en `public/brand/logos/` (servidos en `/brand/logos/…`):

| Archivo | Variante | Fondo típico |
|---------|----------|--------------|
| `sicr3p-primary.svg` | Primario (navy + violeta) | Claro |
| `sicr3p-inverse.svg` | Inverso | Navy `#0F1B3D` |
| `sicr3p-mono.svg` | Monocromo navy | Claro |
| `sicr3p-mono-inverse.svg` | Monocromo blanco | Navy |
| `sicr3p-isotype.svg` | Isotipo `3/` | Claro |
| `sicr3p-isotype-inverse.svg` | Isotipo sobre navy | Navy |

Índice del kit: [`public/brand/logos/README.md`](../public/brand/logos/README.md).

```bash
# Local
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/brand/logos/sicr3p-primary.svg
# Abrir galería + descargas
open http://127.0.0.1:3001/marca#kit
```

---

## 2. Paleta

| Nombre | Hex | Token CSS | Uso |
|--------|-----|-----------|-----|
| Azul Profundo | `#0F1B3D` | `--sicr-navy` | Texto, fondos oscuros, UI |
| Violeta SICR3P | `#6B5CF6` | `--sicr-violet` | Acento `3/`, CTAs, highlights |
| Verde Sostenible | `#00B67A` | `--sicr-green` | Impacto, finanzas sostenibles |
| Azul Claro | `#E6F0FF` | `--sicr-blue-soft` | Fondos suaves, chips |
| Gris Neutro | `#F4F5F9` | `--sicr-gray` | Fondos secundarios |

Fuente de verdad: `app/brand.css` (importado en `app/layout.js` antes de `globals.css`).

Aliases de compatibilidad: `--sicr-primary` → navy, `--sicr-accent` → violet, `--sicr-lime` → green.

En producto nuevo, preferir `var(--sicr-*)` frente a hex sueltos.

---

## 3. Tipografía

- Familia: **Inter** (300–700)
- Variable: `--font-body` (también usada como display en el manual)
- No mezclar Syne / serifs en superficies de marca

---

## 4. Uso en producto

1. Header / footer / login → `<SicrLogo />` (no PNGs sueltos ni wordmarks mock).
2. Partners / decks / PDF → SVG del kit o exportación desde `/marca#kit`.
3. Favicon / app icon → partir del isotipo (`sicr3p-isotype*.svg`).
4. Checklist del sitio: [`/docs/legal/checklist`](../app/docs/legal/checklist/page.js) (ítem logo apunta a `/marca`).

### No hacer

- Recolorear el `3/` fuera del violeta oficial (salvo mono)
- Estirar el wordmark
- Usar el antiguo grafismo “punto verde + molécula” en la `3`
- Inventar slogans distintos en lockups de logo

---

## 5. Entidad

- **Operadora:** SICR3P SpA  
- **Dueña:** Fundación Entretodos  
- Iniciativa de Proveedor Regional  

Textos legales: `/legal` · checklist: `/docs/legal/checklist`.
