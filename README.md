# SICR3P — Assurance, Forensic & Sustainable Finance

Plataforma tecnológica independiente de aseguramiento, contabilidad forense y cumplimiento ASG, diseñada específicamente para auditar la cadena de suministro industrial y minera (Proveedores Tier 2 / Tier 3), conectando la evidencia operacional con los requerimientos de mandantes (SICEP, *The Copper Mark*) e instituciones financieras (Créditos Verdes, NIIF S1/S2).

---

## 🏛️ Áreas de Práctica

La plataforma estructura sus servicios en tres grandes pilares metodológicos:
1. **Sustainability Assurance:** Auditoría de indicadores ASG, inventarios de emisiones (Alcance 1, 2 y 3), capital natural (estrés hídrico bajo marcos TNFD) y cadena de valor.
2. **Forensic & Investigations:** Detección de *greenwashing*, análisis de integridad documental, trazabilidad transaccional e investigaciones de proveedores y anomalías de datos.
3. **Compliance & MPD Assurance:** Evaluación independiente del Modelo de Prevención de Delitos (Ley N° 21.595 de Delitos Económicos y Ambientales), *testing* de controles, revisión de terceros y seguimiento de hallazgos.

---

## 🛠️ Arquitectura Tecnológica

El sistema opera bajo un enfoque de **confidencialidad total y procesamiento local**, evitando la exposición de datos financieros sensibles en la nube pública:
* **Frontend:** React + Vite (Diseño responsivo en modo oscuro optimizado para auditoría en terreno).
* **Backend:** Node.js con Express y SQLite como base de datos local basada en archivos (`sicr3p_core.db`).
* **Inmutabilidad Forense:** Generación automática de huellas criptográficas **Hash SHA-256** por cada archivo o evidencia ingerida para garantizar la cadena de custodia documental.
* **Motor Cognitivo Local:** Integración nativa con **Ollama (Llama 3)** ejecutándose de forma local para el análisis de contratos, detección de riesgos normativos y redacción de borradores para Cartas a la Gerencia.

---

## 📂 Estructura de la Base de Datos

El motor relacional modela el ecosistema corporativo en tres vértices (Proveedor - Mandante - Banco):
* `empresas_proveedoras`: Directorio de clientes auditados.
* `actores_interesados`: Registro de mandantes mineros e instituciones financieras.
* `expedientes_sicr3p`: Encargos profesionales segmentados por área de práctica y estado de auditoría.
* `evidencias_forenses`: Repositorio centralizado con metadatos y hashes de inmutabilidad criptográfica.

---

## 🚀 Despliegue y Ejecución Local

### Prerrequisitos
* Node.js instalado en el equipo.
* Ollama instalado y ejecutándose localmente con el modelo Llama 3 (`ollama run llama3`).

### 1. Configuración del Backend (`server`)
```bash
cd server
npm install
node index.js

2. Configuración del Frontend (client)
Bash
cd client
npm install
npm run dev
(La interfaz web correrá en http://localhost:5173)

⚖️ Enfoque Metodológico
La contabilidad actúa como el motor metodológico y de trazabilidad subyacente para validar la materialidad de los datos,
operando estrictamente como un servicio de aseguramiento independiente y dictamen técnico, ajeno a la teneduría de libros o asesoría tributaria tradicional.
