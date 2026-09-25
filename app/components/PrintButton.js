'use client';

export default function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded">Imprimir / guardar PDF</button>;
}
