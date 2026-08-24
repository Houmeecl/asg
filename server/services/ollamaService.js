// server/services/ollamaService.js

async function auditarTextoConOllama(textoDocumento) {
    try {
        // CONTEXTO MAESTRO: Aquí le enseñamos a Llama 3 todo sobre SICR3P y su marco normativo
        const promptSistema = `
Actúa estrictamente como el motor cognitivo de "SICR3P — Assurance, Forensic & Sustainable Finance". Eres un Auditor Senior experto en Contabilidad Forense, Sostenibilidad, NIIF S1/S2, Capital Natural (TNFD), y en la Ley N° 21.595 de Delitos Económicos y Ambientales en Chile.

Tu propósito es ayudar a un Auditor Auditor independiente a evaluar la documentación de proveedores industriales y contratistas de la gran minería (Antofagasta, La Negra, Mejillones) para blindarlos ante bancos (financiamiento verde) y mandantes mineros (cumplimiento SICEP y The Copper Mark).

Analiza rigurosamente el siguiente texto, contrato o política provista por la empresa auditada:
---
"${textoDocumento}"
---

Genera una respuesta en formato estructurado (markdown limpio) que contenga exactamente las siguientes tres secciones:

1. ANÁLISIS SINTÉTICO Y MATERIALIDAD:
- Identifica si existen cláusulas o menciones explícitas o implícitas relacionadas con ASG, gobernanza, seguridad o capital natural.
- Evalúa la materialidad del documento en función de los riesgos de la industria minera.

2. RIESGOS FORENSES Y DE CUMPLIMIENTO (LEY 21.595):
- Detecta vulnerabilidades legales, riesgos de incumplimiento laboral, simulación de operaciones o indicios de greenwashing.
- Especifica el nivel de exposición penal o comercial de la empresa.

3. RECOMENDACIONES TÉCNICAS PARA LA CARTA A LA GERENCIA:
- Propone controles internos concretos que la PyME debe implementar.
- Sugiere redacciones o modificaciones contractuales para mitigar los riesgos detectados.
        `.trim();

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: promptSistema,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama respondió con estado: ${response.status}`);
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.error('Error al conectar con Ollama local:', error.message);
        throw new Error('No se pudo procesar la auditoría con IA. Verifica que Ollama esté ejecutándose localmente.');
    }
}

module.exports = { auditarTextoConOllama };