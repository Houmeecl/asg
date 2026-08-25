'use client';

import { useState, useEffect, use } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, AlertTriangle, Printer, Gauge, Leaf, ShieldAlert } from 'lucide-react';
import SicrLogo from '../../components/SicrLogo';

export default function VerificarPage({ params }) {
  const { codigo } = use(params);
  const [dato, setDato] = useState(null);
  const [error, setError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    fetch(`/api/flota/verificar/${codigo}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setDato(data);
        const url = typeof window !== 'undefined' ? window.location.href : '';
        QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 200 }).then(setQrDataUrl);
      })
      .catch(() => setError('Error de conexión con el servidor.'));
  }, [codigo]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-300">{error}</p>
        <p className="text-xs text-slate-500 font-mono break-all">Código consultado: {codigo}</p>
      </div>
    );
  }

  if (!dato) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">Verificando certificado...</p>
      </div>
    );
  }

  const discrepanciaAlta = Math.abs(dato.discrepancia_pct) > 15;
  const firmado = dato.estado_firma === 'FIRMADO';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center gap-6 print:bg-white print:text-black">
      <div className="w-full max-w-2xl flex justify-between items-center print:hidden">
        <SicrLogo size="sm" />
        <button type="button" onClick={() => window.print()}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
          <Printer className="w-3.5 h-3.5" /> Descargar PDF
        </button>
      </div>

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col gap-6 print:border-slate-300 print:bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold">Pasaporte Digital — Certificado de Renovación</h1>
            <p className="text-xs text-slate-400 print:text-slate-600">{dato.numero_adhesivo}</p>
          </div>
          {firmado ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 rounded-full px-3 py-1 print:border-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/40 rounded-full px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Pendiente de firma
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[10px] uppercase text-slate-500">Activo</div>
            <div className="font-semibold">{dato.patente} — {dato.tipo_activo}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Empresa</div>
            <div className="font-semibold">{dato.empresa_razon_social}</div>
            <div className="text-xs text-slate-400">{dato.empresa_ciudad} · {dato.tipo_negocio}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Renovado</div>
            <div>{new Date(dato.fecha_renovacion).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Vence</div>
            <div>{new Date(dato.fecha_vencimiento).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-950 rounded-lg p-3 print:bg-slate-50 print:border print:border-slate-200">
            <div className="text-slate-500 flex items-center gap-1 text-xs"><Gauge className="w-3.5 h-3.5" /> Consumo</div>
            <div>{dato.lectura_combustible_litros} L declarados · {dato.lectura_uso} {dato.unidad_medida}</div>
            <div className="text-xs text-slate-500">Esperado: {dato.consumo_esperado_litros} L</div>
          </div>
          <div className={`rounded-lg p-3 print:border print:border-slate-200 ${discrepanciaAlta ? 'bg-amber-950/30 print:bg-amber-50' : 'bg-slate-950 print:bg-slate-50'}`}>
            <div className="text-slate-500 flex items-center gap-1 text-xs">
              {discrepanciaAlta && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />} Discrepancia
            </div>
            <div className={discrepanciaAlta ? 'text-amber-300 font-bold print:text-amber-700' : ''}>{dato.discrepancia_pct}%</div>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 print:bg-slate-50 print:border print:border-slate-200">
            <div className="text-slate-500 flex items-center gap-1 text-xs"><Leaf className="w-3.5 h-3.5" /> CO2e</div>
            <div>{dato.co2_kg} kg</div>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 print:bg-slate-50 print:border print:border-slate-200">
            <div className="text-slate-500 text-xs">Alcance GHG</div>
            <div>{dato.alcance_ghg.replace('_', ' ')}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-slate-800 print:border-slate-300 pt-4">
          {qrDataUrl && <img src={qrDataUrl} alt="QR de verificación" className="w-20 h-20 rounded bg-white p-1" />}
          <div className="text-[10px] text-slate-500 flex-1">
            <div>Hash de evidencia:</div>
            <div className="font-mono break-all">{dato.hash_evidencia}</div>
            {dato.auditor_firmante && <div className="mt-1">Firmado por: {dato.auditor_firmante}</div>}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 print:text-slate-600 italic">
          Certificado basado en información entregada por el cliente (alcance de auditoría limitado a datos suministrados,
          ISAE 3000 / futuro ISSA 5000). No reemplaza el inventario oficial HuellaChile ni constituye certificación
          ambiental primaria. Verificable en esta misma URL en cualquier momento.
        </p>
      </div>
    </div>
  );
}
