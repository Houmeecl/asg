# SICR3P — Assurance, Forensic & Sustainable Finance

Plataforma tecnológica independiente de aseguramiento, contabilidad forense y cumplimiento ASG, diseñada para auditar la cadena de suministro industrial y minera (proveedores Tier 2/Tier 3) y el sector transporte/rent a car/leasing/maquinaria pesada, conectando la evidencia operacional con los requerimientos de mandantes (SICEP, *The Copper Mark*) e instituciones financieras (créditos verdes, NIIF S1/S2).

> Prototipo de demostración — no reemplaza al sistema de producción real en `sicr3p.cl`.

---

## Áreas de Práctica

1. **Sustainability Assurance:** auditoría de indicadores ASG, inventarios de emisiones (Alcance 1, 2 y 3), capital natural (estrés hídrico bajo marcos TNFD) y cadena de valor.
2. **Forensic & Investigations:** detección de *greenwashing*, análisis de integridad documental, trazabilidad transaccional e investigaciones de proveedores y anomalías de datos.
3. **Compliance & MPD Assurance:** evaluación independiente del Modelo de Prevención de Delitos (Ley N° 21.595 de Delitos Económicos y Ambientales), *testing* de controles, revisión de terceros y seguimiento de hallazgos.

## Módulos de la aplicación

- **Forense** — directorio de proveedores, expedientes SICR3P, ingesta de evidencia con hash SHA-256, y motor de auditoría cognitiva vía Ollama (Llama 3).
- **Flotas ASG** — rent a car / leasing / maquinaria pesada / transporte: empresa → cliente → activo (vehículo/maquinaria) → contrato → renovación periódica de adhesivo/QR con XML de uso (distancia/horómetro) y combustible → certificado con detección de discrepancia y CO2e por Alcance GHG (1 o 3) → informe agregado de flota.

## Arquitectura Tecnológica

- **Full-stack unificado en Next.js** (App Router) — UI en React (Tailwind CSS) + API routes como backend, sin servidor Express separado.
- **Base de datos:** SQLite local (`better-sqlite3`, modo WAL) en `data/sicr3p.db` — procesamiento 100% local, sin exponer datos a la nube pública.
- **Inmutabilidad forense:** hash SHA-256 calculado en memoria por cada evidencia/XML ingerido, para trazabilidad y cadena de custodia.
- **Motor cognitivo local:** integración con **Ollama (Llama 3)** ejecutándose localmente para análisis de contratos y redacción de borradores para Cartas a la Gerencia.

## Estructura de la base de datos

**Módulo forense** (esquema clásico, tres vértices Proveedor–Mandante–Banco):
`empresas_proveedoras`, `actores_interesados`, `expedientes_sicr3p`, `objetivo_expediente`, `evidencias_forenses`.

**Módulo flota:**
`flota_empresas`, `flota_clientes`, `flota_activos`, `flota_contratos`, `flota_renovaciones`.

## Despliegue y ejecución local

### Prerrequisitos
- Node.js 18+
- Ollama instalado y ejecutándose localmente con el modelo Llama 3 (`ollama run llama3`) — opcional; sin Ollama corriendo, el módulo forense muestra un error claro al intentar auditar con IA, el resto de la app funciona igual.

### Instalación

```bash
npm install
npm run dev
```

La interfaz web corre en [http://localhost:3000](http://localhost:3000).

## Pendientes conocidos (no simulables sin contratar servicios externos)

- Firma Electrónica Avanzada (FEA) acreditada para los certificados.
- Sellado de tiempo (TSA) acreditado para la cadena de custodia de evidencia.
- Verificación en vivo de documentos tributarios electrónicos contra el SII.

## Enfoque Metodológico

La contabilidad actúa como el motor metodológico y de trazabilidad subyacente para validar la materialidad de los datos, operando estrictamente como un servicio de aseguramiento independiente y dictamen técnico, ajeno a la teneduría de libros o asesoría tributaria tradicional.
