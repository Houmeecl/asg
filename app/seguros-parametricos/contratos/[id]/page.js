import { notFound, redirect } from 'next/navigation';
import { BASE, clp } from '../../data';
import { INDICES } from '@/lib/oraculo/indices';
import { obtenerUsuarioSeguros, esAdmin } from '@/lib/segurosAuth';
import { obtenerContrato } from '@/lib/contratos';
import { AVISO_BORRADOR, AVISO_CONTRATO, AVISO_SIMULADO, TERMINOS as T } from '../../producto';
import BotonImprimir from './BotonImprimir';

export const metadata = { title: 'Borrador de contrato — SICR3P', robots: { index: false } };

const Cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const Clausula = ({ n, titulo, children }) => (
  <section className="mt-6 break-inside-avoid">
    <h2 className="font-semibold">{n}. {titulo}</h2>
    <div className="mt-1 text-sm leading-relaxed text-[#0f1f2e]/85 flex flex-col gap-2">{children}</div>
  </section>
);

export default async function Page({ params }) {
  const usuario = await obtenerUsuarioSeguros();
  if (!usuario) redirect(`${BASE}/ingresar`);
  if (!esAdmin(usuario)) notFound(); // contiene datos de la PYME: solo administradores

  const { id } = await params;
  const c = obtenerContrato(Number(id));
  const indice = c && INDICES[c.indice_id];
  if (!c || !indice) notFound();

  const empresa = process.env.EMPRESA_NOMBRE || '[Razón social de la Empresa]';
  const empresaRut = process.env.EMPRESA_RUT || '[RUT de la Empresa]';
  const sentido = indice.dir === 'menor' ? 'por debajo de' : 'por encima de';
  const simulado = c.modo === 'SIMULADO';
  const cambio = (v) => `${v} ${indice.unidad}`;

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-[#0f1f2e] print:bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 print:py-0">
        <div className="flex items-center justify-between print:hidden">
          <a href={`${BASE}/admin`} className="text-sm underline">← Volver al admin</a>
          <BotonImprimir />
        </div>

        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm font-semibold">{AVISO_BORRADOR}</div>
        {simulado && <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">{AVISO_SIMULADO}</div>}

        <article className="mt-8 rounded-2xl bg-white border border-[#0f1f2e]/10 p-8 print:border-0 print:p-0">
          <h1 className="text-2xl font-semibold tracking-tight">{T.contrato}</h1>
          <p className="mt-1 text-sm text-[#0f1f2e]/60">N.º {String(c.id).padStart(4, '0')} · {c.modo === 'REAL' ? 'Modo real' : 'Modo simulación'}</p>

          <Clausula n={1} titulo="Partes">
            <p><b>{empresa}</b>, RUT {empresaRut} (en adelante, «{T.empresa}»).</p>
            <p><b>{c.pyme}</b>, RUT {c.rut} (en adelante, «{T.cliente}»).</p>
          </Clausula>

          <Clausula n={2} titulo="Objeto y exposición operacional">
            <p>{Cap(T.empresa)} otorga a {T.cliente} una cobertura financiera por variación del índice descrito en la cláusula 3, contra el pago del {T.cargo} de la cláusula 5.</p>
            <p><b>Exposición declarada por {T.cliente}:</b> {c.exposicion}</p>
          </Clausula>

          <Clausula n={3} titulo="Índice y fuente de datos">
            <p><b>{indice.nombre}</b>, medido en {indice.unidad}, con periodicidad {indice.periodicidad} y agregación «{indice.agregacion}» por periodo.</p>
            <p>Fuente: {indice.fuente} Las lecturas se registran en una cadena de hashes auditable y solo cuentan si superan las validaciones del oráculo (rango, frescura, consistencia y, cuando corresponda, fuentes independientes).</p>
            {!indice.verificado && <p className="text-red-700"><b>Pendiente:</b> confirmar la fuente exacta, su publicación y periodicidad antes de firmar.</p>}
          </Clausula>

          <Clausula n={4} titulo="Umbral y tabla de pago">
            <p>Se activa el pago cuando el índice del periodo queda {sentido} {cambio(c.umbral)}. El pago crece linealmente hasta alcanzar el monto máximo cuando el índice llega a {cambio(c.salida)}.</p>
            <p>Monto máximo por periodo: <b>{clp(c.monto_max)}</b>. Fracción pagada = |valor − umbral| ÷ |{c.salida} − {c.umbral}|, acotada entre 0 % y 100 %.</p>
          </Clausula>

          <Clausula n={5} titulo="Cargo y vigencia">
            <p>{Cap(T.cliente)} pagará un {T.cargo} de <b>{clp(c.cargo_mensual)}</b>. Vigencia: del {c.inicio} al {c.fin}.</p>
          </Clausula>

          <Clausula n={6} titulo="Liquidación">
            <p>Al cierre de cada mes se calcula la {T.liquidacion} con el valor del índice del periodo, informando las lecturas usadas y sus hashes. Si no hay datos válidos suficientes, <b>no se genera pago</b> y el periodo queda «sin datos»; las partes podrán acordar una fuente alternativa por escrito.</p>
          </Clausula>

          <Clausula n={7} titulo="Sin prueba de daño">
            <p>El pago depende únicamente del valor del índice; {T.cliente} no debe acreditar pérdidas y, recíprocamente, el pago no se ajusta por el daño efectivamente sufrido.</p>
          </Clausula>

          <Clausula n={8} titulo="Disputas">
            <p>Cualquiera de las partes puede objetar una lectura o liquidación dentro de [plazo por definir]. Mientras la objeción esté pendiente, la {T.liquidacion} queda congelada.</p>
          </Clausula>

          <Clausula n={9} titulo="Capacidad de pago">
            <p>Los pagos se respaldan con la reserva declarada por {T.empresa} [monto y forma por definir según el asesor legal]. {Cap(T.cliente)} declara conocer que este respaldo no es un seguro.</p>
          </Clausula>

          <Clausula n={10} titulo="Ley aplicable y jurisdicción">
            <p>[Por definir con el asesor legal.]</p>
          </Clausula>

          <div className="mt-8 rounded-xl border border-[#0f1f2e]/20 px-4 py-3 text-sm font-semibold">{AVISO_CONTRATO}</div>
          <div className="mt-12 grid grid-cols-2 gap-10 text-sm print:mt-20">
            <div className="border-t border-[#0f1f2e] pt-2">{empresa}</div>
            <div className="border-t border-[#0f1f2e] pt-2">{c.pyme}</div>
          </div>
        </article>
      </div>
    </div>
  );
}
