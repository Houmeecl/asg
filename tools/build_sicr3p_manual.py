from pathlib import Path
from datetime import date
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = Path(__file__).resolve().parents[1] / 'deliverables'
OUT.mkdir(exist_ok=True)
FILE = OUT / 'Manual_Tecnico_Operativo_SICR3P_2026.docx'

NAVY = '123047'; TEAL = '147D7E'; COPPER = 'B56A3A'; PALE = 'EAF3F2'; GREY = '53616B'; LIGHT = 'F5F7F8'

def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr(); shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), color); tcPr.append(shd)

def borders(cell, color='D9E1E4'):
    tcPr = cell._tc.get_or_add_tcPr(); b = OxmlElement('w:tcBorders')
    for edge in ('top','left','bottom','right'):
        e=OxmlElement(f'w:{edge}'); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),'4'); e.set(qn('w:color'),color); b.append(e)
    tcPr.append(b)

def set_font(run, size=10.5, bold=False, color='263238', italic=False):
    run.font.name='Aptos'; run._element.rPr.rFonts.set(qn('w:ascii'),'Aptos'); run._element.rPr.rFonts.set(qn('w:hAnsi'),'Aptos')
    run.font.size=Pt(size); run.font.bold=bold; run.font.italic=italic; run.font.color.rgb=RGBColor.from_string(color)

def para(doc, text='', style=None, size=10.5, color='263238', bold=False, italic=False, align=None, after=6, before=0):
    p=doc.add_paragraph(style=style)
    p.paragraph_format.space_after=Pt(after); p.paragraph_format.space_before=Pt(before); p.paragraph_format.line_spacing=1.16
    if align is not None: p.alignment=align
    r=p.add_run(text); set_font(r,size,bold,color,italic); return p

def bullet(doc, text):
    p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(3); p.paragraph_format.line_spacing=1.1
    set_font(p.add_run(text),10.2); return p

def heading(doc, text, level=1):
    p=doc.add_paragraph(style=f'Heading {level}')
    p.paragraph_format.space_before=Pt(16 if level==1 else 10); p.paragraph_format.space_after=Pt(6); p.paragraph_format.keep_with_next=True
    r=p.add_run(text); set_font(r,16 if level==1 else 12.5,True,NAVY if level==1 else TEAL); return p

def table(doc, headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]; shade(c,NAVY); borders(c,NAVY); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        c.text=''; set_font(c.paragraphs[0].add_run(h),9,True,'FFFFFF'); c.paragraphs[0].paragraph_format.space_after=Pt(2)
        if widths: c.width=Inches(widths[i])
    for row in rows:
        cells=t.add_row().cells
        for i,val in enumerate(row):
            c=cells[i]; shade(c, 'FFFFFF' if len(t.rows)%2 else LIGHT); borders(c); c.text=''; c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.TOP
            p=c.paragraphs[0]; p.paragraph_format.space_after=Pt(3); p.paragraph_format.line_spacing=1.05; set_font(p.add_run(str(val)),8.7)
            if widths: c.width=Inches(widths[i])
    doc.add_paragraph().paragraph_format.space_after=Pt(2)
    return t

def page_break(doc): doc.add_page_break()

def add_cover(doc):
    para(doc,'SICR3P',size=13,color=COPPER,bold=True,align=WD_ALIGN_PARAGRAPH.CENTER,after=14)
    para(doc,'MANUAL TECNICO Y OPERATIVO',size=30,color=NAVY,bold=True,align=WD_ALIGN_PARAGRAPH.CENTER,after=8)
    para(doc,'Ecosistema de evidencia, abastecimiento y aseguramiento para PYMES, mandantes e instituciones financieras',size=14,color=GREY,align=WD_ALIGN_PARAGRAPH.CENTER,after=28)
    para(doc,'Edicion 1.0 | 03 de septiembre de 2026',size=10.5,color=GREY,align=WD_ALIGN_PARAGRAPH.CENTER,after=72)
    table(doc,['SOCIAL','AMBIENTAL','ECONOMICO'], [["Capital humano y proveedores locales", "Evidencia, trazabilidad y datos de sostenibilidad", "Licitaciones, abastecimiento y decisiones financieras"]],[2.15,2.15,2.15])
    para(doc,'Documento institucional de arquitectura y operacion. Define productos, flujos, responsabilidades, interfaces e informes. Los informes profesionales se emiten solamente tras revisión humana, evidencia suficiente y firma del profesional habilitado.',size=10.3,color=GREY,align=WD_ALIGN_PARAGRAPH.CENTER,after=0)
    page_break(doc)

def add_toc(doc):
    heading(doc,'Como usar este manual',1)
    para(doc,'Este manual organiza SICR3P como un ecosistema, no como una sola aplicación ni una firma contable tradicional. Cada área tiene su propio propósito, datos permitidos, responsables, entregables y límites de independencia.')
    table(doc,['PARTE','CONTENIDO'],[
        ('I. Arquitectura','Propósito, actores, principios y separación de funciones.'),
        ('II. Áreas y comunicación','Auditoría, licitaciones, abastecimiento, contabilidad, capital humano, CBAM/EUDR y ANTAI.'),
        ('III. Interfaz y datos','Módulos, permisos, expedientes, custodia y trazabilidad.'),
        ('IV. Informes oficiales','Modelos de reporte, firma, QR y estados de emisión.'),
        ('V. Flujos operativos','Del ingreso del cliente al cierre, venta y seguimiento.'),
        ('VI. Modelo comercial','Planes mensuales, servicios profesionales y costos operativos.'),
        ('VII. Gobierno','Calidad, independencia, seguridad y hoja de ruta.')
    ],[1.55,4.95])
    heading(doc,'Reglas de lenguaje institucional',2)
    bullet(doc,'SICR3P verifica evidencia y procedimientos dentro de un encargo definido; no declara cumplimiento total sin alcance, criterios, pruebas y firma profesional.')
    bullet(doc,'Un QR, adhesivo, hash o registro de plataforma acredita trazabilidad técnica del objeto registrado; no es por sí mismo una certificación estatal, ambiental o bancaria.')
    bullet(doc,'CBAM y EUDR se presentan como expediente de preparación, cálculo o revisión según corresponda. La verificación reglada se reserva para quien esté acreditado cuando la norma lo exija.')
    bullet(doc,'La actividad comercial, de consignación o comisión se declara y se separa de la conclusión independiente sobre la misma operación.')
    page_break(doc)

def add_architecture(doc):
    heading(doc,'I. Arquitectura SICR3P',1)
    para(doc,'SICR3P conecta tres decisiones: la empresa/proveedor demuestra, el mandante/minera confía y el banco/inversionista puede evaluar. Su valor no es reemplazar portales de compra, contabilidad, certificadores ni autoridades: coordina evidencia verificable entre ellos.')
    table(doc,['ACTOR','NECESIDAD','RESPUESTA SICR3P'],[
        ('Empresa / proveedor','Acceder a contratos y licitaciones sin reconstruir documentos cada vez.','Perfil verificable, expediente documental, brechas, licitador y stock custodiado.'),
        ('Mandante / minera','Reducir riesgo de proveedores y evaluar cumplimiento documentado.','Matriz de requisitos, panel de evidencia, alertas de vigencia e informes de revisión.'),
        ('Banco / inversionista','Tomar decisiones con información operacional trazable.','Paquete de evidencia, métricas, riesgos, consistencia y reporte profesional cuando corresponda.')
    ],[1.35,2.5,2.65])
    heading(doc,'Principios de diseño',2)
    for x in ['Una fuente de evidencia por documento, con hash, fecha de ingreso, origen y responsable.','Una sola ficha de proveedor reutilizable, con permisos específicos por mandante o portal.','Separación entre dato declarado, dato documentado, dato contrastado y conclusión profesional.','No se inventan datos ni se cierran expedientes incompletos.','La automatización prepara, alerta y ordena; el profesional revisa, decide y firma.'] : bullet(doc,x)
    heading(doc,'Mapa de líneas de servicio',2)
    table(doc,['LÍNEA','PRODUCTO','RESULTADO PRINCIPAL'],[
      ('SICR3P Evidence','Custodia, expedientes, QR, documentos y registros.','Evidencia trazable y compartible.'),
      ('SICR3P Tender Desk','Lectura de bases y factibilidad de licitación.','Matriz de cumplimiento y decisión de ofertar.'),
      ('SICR3P Supply Node','Consignación, disponibilidad, reserva y despacho.','Stock custodiado con visibilidad B2B.'),
      ('SICR3P Assurance','Revisión profesional de información y controles.','Informe firmado con alcance y conclusión.'),
      ('SICR3P Climate & Trade','CBAM, EUDR, emisiones y trazabilidad de comercio.','Expediente preparado para revisión externa.'),
      ('ANTAI [provisional]','Auditoría técnica ambiental industrial.','Hallazgos, plan de acción y evidencia industrial.'),
      ('Capital Humano','Evidencia laboral, competencias, capacitación y proveedores.','Matriz de capacidad y riesgos de personas.')
    ],[1.35,2.0,3.15])
    page_break(doc)

def add_areas(doc):
    heading(doc,'II. Áreas, equipo y comunicación',1)
    para(doc,'Cada área trabaja sobre el mismo expediente, pero con un permiso y una responsabilidad distinta. La plataforma evita que datos privados, documentos de precios o conclusiones de auditoría circulen sin necesidad.')
    table(doc,['ÁREA','RESPONSABLE','RECIBE','ENTREGA'],[
      ('Relación cliente','Account lead','Mandato, datos base, autorizaciones.','Plan de trabajo, responsables y calendario.'),
      ('Custodia documental','Analista de evidencia','XML, DTE, contratos, certificados, fotos y registros.','Registro, hash, vigencia, trazabilidad y brechas.'),
      ('Licitaciones','Licitador especialista','Bases, anexos y expediente del proveedor.','Factibilidad, matriz, checklist y recomendación.'),
      ('Abastecimiento','Coordinador comercial','Catálogo, stock, disponibilidad y OC.','Reserva, despacho, liquidación y trazabilidad.'),
      ('Contabilidad','Contador/a del cliente o equipo separado','DTE, conciliaciones, inventario y documentos de respaldo.','Registros y reportes contables acordados.'),
      ('Aseguramiento','Contador auditor independiente','Expediente congelado y criterios aplicables.','Informe profesional firmado o requerimiento de corrección.'),
      ('Especialistas','Ambiental, prevención, legal, comercio exterior','Hallazgos y evidencia sectorial.','Pronunciamientos técnicos dentro de su competencia.')
    ],[1.25,1.25,2.0,2.0])
    heading(doc,'Protocolo de comunicación entre áreas',2)
    for x in ['El Account lead abre el encargo y define el propósito, destinatario, plazo y permisos.','Custodia valida ingreso y clasifica el documento antes de que sea visible para una oferta o informe.','Licitaciones solo usa evidencia vigente y marca brechas, nunca altera el documento fuente.','Contabilidad accede a DTE y movimientos autorizados, sin modificar la evidencia de auditoría.','Aseguramiento recibe una versión congelada del expediente y registra cada procedimiento de revisión.','Comercial recibe solamente datos necesarios para vender o despachar; no accede a conclusiones confidenciales.'] : bullet(doc,x)
    heading(doc,'Muro de independencia',2)
    para(doc,'Cuando SICR3P participa como consignatario, recibe comisión, administra stock o recomienda proveedores, ese interés comercial debe declararse. La revisión de aseguramiento de la misma operación requiere salvaguardas: equipo distinto, revisión de independencia y, cuando corresponda, derivación a profesional externo.')
    page_break(doc)

def add_interface(doc):
    heading(doc,'III. Interfaz y modelo de datos',1)
    para(doc,'La interfaz debe ser simple en la superficie y rigurosa detrás. Todo usuario ve una próxima acción, un estado de evidencia y un plazo; la complejidad normativa se abre solo cuando es necesaria.')
    table(doc,['ROL','INICIO DE SESIÓN','VISTAS PRINCIPALES','ACCIÓN PERMITIDA'],[
      ('Proveedor PYME','Panel de empresa','Mi perfil, documentos, licitaciones, stock y facturación.','Carga, confirma, corrige, autoriza y factura.'),
      ('Licitador','Mesa de oportunidades','Bases, matriz, brechas y calendario.','Evalúa factibilidad y emite recomendación.'),
      ('Mandante','Portal comprador','Requisitos, proveedores invitados, comparador e informes.','Publica requerimiento, revisa y adjudica.'),
      ('Auditor','Bandeja de revisión','Expedientes congelados, procedimientos y borradores.','Revisa, observa, aprueba o firma.'),
      ('Bodega / nodo','Operación física','Ingresos, QR, reservas, despachos y devoluciones.','Custodia y registra movimientos.'),
      ('Administrador','Gobierno','Usuarios, permisos, factores, plantillas y bitácora.','Administra sin alterar evidencia original.')
    ],[1.05,1.3,2.45,1.45])
    heading(doc,'Estados obligatorios de evidencia',2)
    table(doc,['ESTADO','SIGNIFICADO','USO EN INFORME'],[
      ('Declarado','La empresa entregó un dato sin respaldo suficiente.','Solo contexto; no conclusión.'),
      ('Documentado','Existe archivo o registro fuente recibido.','Puede ser sujeto a prueba.'),
      ('Contrastado','Se comparó contra una fuente o regla definida.','Puede alimentar hallazgos.'),
      ('Validado','Un revisor competente aceptó la evidencia dentro del alcance.','Puede sustentar conclusión limitada.'),
      ('Observado','Existe inconsistencia, caducidad, omisión o reserva.','Debe aparecer como hallazgo.'),
      ('Cerrado','Expediente completo según lista de control.','Habilita emisión, no elimina responsabilidades.')
    ],[1.25,3.1,1.9])
    heading(doc,'Objetos trazables',2)
    bullet(doc,'Empresa, persona autorizada, sitio, proyecto, activo, vehículo, maquinaria, producto, lote, documento, movimiento, requisito, hallazgo, informe y firma.')
    bullet(doc,'Cada objeto relevante registra identificador único, creador, fecha/hora, versión, relación con evidencia y bitácora inalterable.')
    page_break(doc)

def add_workflows(doc):
    heading(doc,'IV. Flujos operativos',1)
    heading(doc,'A. Alta de proveedor y expediente base',2)
    table(doc,['PASO','DUEÑO','CONTROL DE SALIDA'],[
      ('1. Mandato y consentimiento','Account lead','Objeto del encargo, datos permitidos y responsable definidos.'),
      ('2. Perfil de empresa','Proveedor','RUT, giro, contacto, capacidades y sedes confirmadas.'),
      ('3. Ingesta documental','Custodia','Archivo original, hash, tipo, vencimiento y origen registrados.'),
      ('4. Matriz de brechas','Analista','Documento vigente / faltante / observado por requisito.'),
      ('5. Revisión de preparación','Licitador o especialista','Perfil apto para ser invitado o plan de cierre de brechas.'),
      ('6. Compartición controlada','Proveedor + plataforma','Mandante recibe solo el paquete autorizado.')
    ],[0.85,1.55,4.05])
    heading(doc,'B. Licitador: revisión de bases y factibilidad',2)
    para(doc,'El licitador no promete adjudicación ni presenta automáticamente una oferta. Es un rol experto que decide si vale la pena ofertar y qué falta para hacerlo con seriedad.')
    for x in ['Importar bases, anexos, calendario, preguntas y criterios de evaluación.','Extraer requisitos habilitantes, técnicos, contractuales, ambientales, laborales, financieros y logísticos.','Cruzar cada requisito con evidencia vigente y capacidad real de la PYME o del multiproveedor.','Clasificar: Apta; Apta con brechas subsanables; No recomendable.','Emitir matriz, costo estimado de cumplir, responsable, plazo y decisión sugerida.'] : bullet(doc,x)
    heading(doc,'C. Stock custodiado en consignación',2)
    para(doc,'La PYME conserva propiedad de las unidades no vendidas. SICR3P recibe custodia y visibilidad comercial según contrato, manteniendo trazabilidad de ingreso, reserva, despacho, devolución y facturación.')
    table(doc,['EVENTO','REGISTRO MÍNIMO','CONTROL'],[
      ('Ingreso','Guía, lote/serie, fotos, cantidad, ubicación y acta de recepción.','QR único + confirmación física.'),
      ('Reserva','Comprador, cantidad, precio autorizado y vencimiento.','No se sobrevende stock.'),
      ('Despacho','Orden, guía, transportista, receptor y evidencia de entrega.','Cambio de estado y acuse.'),
      ('Venta','Documento de venta, comisión/margen y referencia a guías.','Conciliación comercial y tributaria.'),
      ('Devolución / merma','Motivo, evidencia, responsable y documento de retorno.','Aprobación de la PYME y bitácora.')
    ],[1.15,3.15,1.65])
    page_break(doc)

def add_specialisms(doc):
    heading(doc,'V. Especialidades sin choque de roles',1)
    heading(doc,'Contabilidad y auditoría',2)
    para(doc,'Contabilidad puede convivir con SICR3P como servicio separado de registro, conciliación, inventario y soporte tributario. No debe alterar evidencia original ni convertir una conciliación automática en una conclusión de aseguramiento.')
    table(doc,['SERVICIO','PUEDE HACER','NO DEBE AFIRMAR'],[
      ('Contabilidad','Ordenar DTE, conciliaciones, inventario, cuentas y reportes de gestión.','Que una cifra está auditada sin encargo y revisión independiente.'),
      ('Auditoría / aseguramiento','Probar evidencia, evaluar criterios, documentar procedimientos y firmar conclusión.','Que garantiza ausencia absoluta de fraude, delito o incumplimiento.'),
      ('Asesoría','Diseñar controles, capacitar y preparar documentos.','Que su propio diseño fue verificado independientemente sin salvaguardas.')
    ],[1.35,2.75,1.85])
    heading(doc,'Capital humano',2)
    para(doc,'Capital humano se incorpora como evidencia de capacidad operacional y social: no como ranking de personas. Evalúa que el proveedor cuente con roles, competencias, capacitación, seguridad, continuidad y prácticas laborales documentadas.')
    for x in ['Matriz de cargos críticos, cobertura, reemplazos y habilitaciones.','Competencias, licencias, cursos, inducciones y vencimientos.','Indicadores agregados de contratación local, capacitación, accidentabilidad y rotación cuando el cliente autorice su uso.','Canal para documentar protocolos, capacitación MDP y acciones correctivas, sin exponer datos personales innecesarios.','Informe de capacidad humana por contrato o licitación, con minimización y segregación de datos personales.'] : bullet(doc,x)
    heading(doc,'CBAM y EUDR',2)
    para(doc,'SICR3P administra expedientes y revisiones de preparación para comercio internacional. CBAM opera en su régimen definitivo desde el 1 de enero de 2026; EUDR aplica, en general, desde el 30 de diciembre de 2026 para grandes y medianos operadores. El resultado SICR3P debe describir exactamente su nivel: recopilación, cálculo, contraste o revisión profesional.')
    table(doc,['MÓDULO','EVIDENCIA','ENTREGABLE'],[
      ('CBAM','Instalación, producto, producción, energía, combustibles, emisiones, metodología, declaración del operador y datos de comercio.','Expediente de datos de emisiones incorporadas y matriz de consistencia.'),
      ('EUDR','Producto, origen, proveedor, geolocalización, trazabilidad, legalidad y declaración de diligencia debida.','Expediente de diligencia debida y brechas de trazabilidad.'),
      ('ANTAI [provisional]','Permisos, monitoreos, residuos, agua, energía, emisiones, incidentes y controles industriales.','Informe de revisión técnica, hallazgos y plan de acción.')
    ],[1.35,3.0,1.6])

def add_reports(doc):
    heading(doc,'VI. Modelos de informes oficiales',1)
    para(doc,'Todo informe tiene código, versión, destinatario, período, criterios, alcance, fuentes, limitaciones, responsable de revisión, fecha de emisión, firma electrónica y QR de verificación. El QR abre una página pública mínima: número de informe, estado, emisor, fecha, vigencia y huella digital; jamás expone documentos privados.')
    table(doc,['INFORME','EMISOR','CONTENIDO MÍNIMO','ESTADO'],[
      ('Ficha de proveedor verificable','Sistema + responsable','Identidad, capacidades, documentos vigentes y fecha de corte.','Técnico; no certificación.'),
      ('Informe de factibilidad de licitación','Licitador','Requisitos, evidencia, brechas, costos, plazo y recomendación.','Profesional operativo.'),
      ('Acta de custodia / stock','Nodo SICR3P','Propietario, lote, condición, ubicación y movimientos.','Operacional y comercial.'),
      ('Informe de trazabilidad documental','Revisor','Documentos recibidos, hashes, contrastes y observaciones.','Revisión definida por alcance.'),
      ('Informe de aseguramiento','Contador auditor','Criterios, responsabilidades, procedimientos, hallazgos y conclusión.','Firmado; nivel limitado o razonable según encargo.'),
      ('Expediente CBAM/EUDR','Especialista + revisor','Datos, fuentes, metodología, brechas y trazabilidad.','Preparado para revisión / verificación aplicable.'),
      ('Informe ANTAI','Especialista competente','Alcance industrial, evidencia, hallazgos, riesgos y acciones.','Técnico; no permiso ni autorización estatal.')
    ],[1.4,1.2,2.65,1.05])
    heading(doc,'Estructura formal del informe de aseguramiento',2)
    for x in ['Título, destinatario, identificación de la información revisada y período.','Responsabilidades de la dirección, del profesional y de terceros que aportan evidencia.','Criterios aplicados, límites organizacionales/operacionales y nivel de aseguramiento.','Procedimientos relevantes, restricciones de evidencia y hallazgos.','Conclusión profesional con redacción consistente con el nivel de aseguramiento.','Declaración de independencia, competencia, control de calidad y conflicto de interés.','Firma electrónica del profesional habilitado y registro de emisión.'] : bullet(doc,x)
    heading(doc,'Estados de emisión',2)
    table(doc,['ESTADO','SIGNIFICADO'],[('Borrador','Uso interno; no firmado ni verificable públicamente.'),('En revisión','Procedimientos en curso; no distribuir como conclusión.'),('Emitido','Firmado y sellado; QR activo.'),('Reemplazado','Existe nueva versión; QR deriva a la versión vigente.'),('Revocado','El informe no debe ser usado; se mantiene registro de revocación.')],[1.4,5.1])
    page_break(doc)

def add_pricing(doc):
    heading(doc,'VII. Modelo comercial y costos',1)
    para(doc,'Los valores siguientes son una propuesta inicial en CLP, sin IVA, para validar con clientes ancla. Se cobra por complejidad, número de empresas, activos, documentos, licitaciones e informes; no por afirmar resultados de cumplimiento.')
    table(doc,['PLAN','PARA QUIÉN','INCLUYE','VALOR PROPUESTO'],[
      ('Base Evidencia','PYME que necesita orden documental.','1 empresa, perfil, hasta 25 documentos activos, alertas y carpeta compartible.','CLP 79.000 / mes'),
      ('Proveedor Preparado','PYME licitadora.','Base + matriz de brechas, hasta 2 bases/mes y soporte de preparación.','CLP 189.000 / mes'),
      ('Proveedor Industrial','Proveedor con contratos críticos.','Preparado + 3 usuarios, 100 documentos, capacidad humana y panel de requisitos.','CLP 390.000 / mes'),
      ('Mandante','Minera, contratista principal o comprador.','Matriz de requisitos, invitados, panel de evidencia, alertas y hasta 20 proveedores.','Desde CLP 1.200.000 / mes'),
      ('Nodo Supply','Consignación B2B.','Inventario visible, movimientos, QR, reserva y reportes.','Base CLP 250.000 + fee por movimiento'),
      ('Trade & Climate','Exportador / industrial.','Expediente CBAM o EUDR, flujos y control documental.','Desde CLP 490.000 / mes por expediente')
    ],[1.25,1.35,2.75,1.15])
    heading(doc,'Servicios profesionales adicionales',2)
    table(doc,['SERVICIO','UNIDAD','RANGO INICIAL'],[
      ('Revisión de una licitación','por base','CLP 180.000 - 650.000 según complejidad.'),
      ('Informe de factibilidad','por oportunidad','CLP 350.000 - 1.200.000.'),
      ('Informe profesional firmado','por encargo','Cotización según criterio, materialidad y evidencia.'),
      ('Implementación de proveedor','por empresa','CLP 250.000 - 900.000.'),
      ('Habilitación CBAM / EUDR','por expediente','CLP 900.000 - 4.500.000.'),
      ('Custodia física','por pallet, metro cúbico o activo','Tarifa logística separada + seguro + movimiento.')
    ],[2.3,1.25,2.95])
    heading(doc,'Costos que no deben ocultarse',2)
    for x in ['Firma electrónica avanzada, sellado de tiempo, almacenamiento seguro, respaldos y monitoreo.','Seguro de bodega, transporte, daños, responsabilidad civil y control físico de stock.','Especialistas ambientales, legales, prevencionistas y verificadores externos cuando el encargo lo requiera.','Integraciones con ERP, DTE, portales de compra y telemetría; cobrar implementación y soporte.','Costo de independencia: si existe comisión comercial, separar revisión profesional o contratar tercero externo.'] : bullet(doc,x)
    page_break(doc)

def add_governance(doc):
    heading(doc,'VIII. Gobierno, calidad y hoja de ruta',1)
    heading(doc,'Seguridad y privacidad',2)
    for x in ['Principio de mínimo acceso: cada rol ve solo lo necesario.','Separar información personal, datos comerciales y evidencia técnica; usar identificadores pseudonimizados cuando corresponda.','Mantener originales, hashes y bitácora append-only; nunca reemplazar silenciosamente una evidencia cargada.','Definir retención, devolución, eliminación y anonimización por tipo de dato y obligación aplicable.','Notificar observaciones críticas, incidentes de seguridad y conflictos de interés mediante un protocolo trazable.'] : bullet(doc,x)
    heading(doc,'Control de calidad',2)
    table(doc,['CONTROL','FRECUENCIA','EVIDENCIA'],[
      ('Revisión de permisos y usuarios','Mensual','Bitácora de accesos y cambios.'),
      ('Muestreo de expedientes','Mensual','Papeles de trabajo y hallazgos.'),
      ('Revisión de vigencias','Diaria automatizada','Alertas, confirmaciones y cierres.'),
      ('Independencia y conflicto','Antes de encargo e informe','Declaración y salvaguardas.'),
      ('Respaldo y recuperación','Semanal / trimestral','Prueba de restauración.'),
      ('Revisión metodológica','Trimestral','Control de versiones y aprobación profesional.')
    ],[2.4,1.25,2.85])
    heading(doc,'Hoja de ruta recomendada: 180 días',2)
    table(doc,['ETAPA','OBJETIVO','ENTREGABLE'],[
      ('0-30 días','Cerrar propuesta de valor y operación Antofagasta.','Panel proveedor, licitador, expediente y perfiles de rol.'),
      ('31-60 días','Piloto con 5-10 PYMES y un comprador ancla.','Matriz de licitación, expediente verificable y primer informe técnico.'),
      ('61-90 días','Activar nodo de stock custodiado limitado.','Contrato de consignación, ingreso QR, reserva, despacho y conciliación.'),
      ('91-120 días','Especialización industrial y comercial exterior.','Plantillas CBAM, EUDR y ANTAI; red de especialistas.'),
      ('121-180 días','Escalar con controles.','Programa mandante, indicadores, revisión de calidad y alianzas de portal.')
    ],[1.2,2.6,2.7])
    heading(doc,'Fuentes metodológicas prioritarias',2)
    para(doc,'Este manual debe mantenerse actualizado frente a normas y criterios aplicables. Referencias de trabajo: ISSA 5000 del IAASB; GHG Protocol; normativa y guías del SII; Reglamento CBAM de la Comisión Europea; Reglamento (UE) 2023/1115 y guías EUDR; Ley 20.393 y Ley 21.595 de Chile; Ley 19.799 sobre firma electrónica; Ley 21.719 sobre datos personales. La aplicación a cada cliente requiere revisión profesional y, cuando corresponda, asesoría jurídica o técnica especializada.',size=9.8,color=GREY)
    para(doc,'La aprobación de esta versión se registra en el repositorio metodológico SICR3P mediante control de versiones, responsable de calidad, fecha y firma del aprobador habilitado.',size=9.5,color=GREY,after=0)

def build():
    doc=Document(); sec=doc.sections[0]
    sec.top_margin=Inches(.82); sec.bottom_margin=Inches(.72); sec.left_margin=Inches(.85); sec.right_margin=Inches(.85)
    styles=doc.styles
    styles['Normal'].font.name='Aptos'; styles['Normal'].font.size=Pt(10.5)
    for s in ['Heading 1','Heading 2','Heading 3']:
        styles[s].font.name='Aptos'
    header=sec.header.paragraphs[0]; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT; set_font(header.add_run('SICR3P | Manual Técnico y Operativo'),8,True,GREY)
    footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER; set_font(footer.add_run('Documento institucional | Edición 1.0 | 2026'),8,False,GREY)
    add_cover(doc); add_toc(doc); add_architecture(doc); add_areas(doc); add_interface(doc); add_workflows(doc); add_specialisms(doc); add_reports(doc); add_pricing(doc); add_governance(doc)
    doc.core_properties.title='Manual Técnico y Operativo SICR3P 2026'; doc.core_properties.author='SICR3P'; doc.core_properties.subject='Arquitectura, operación e informes'
    doc.save(FILE); print(FILE)

if __name__=='__main__': build()
