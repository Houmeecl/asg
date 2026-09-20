'use client';

export default function BotonImprimir() {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-[#0f1f2e] text-[#5ce08a] px-5 py-2.5 text-sm font-semibold hover:bg-[#1a3247]">
      Imprimir / guardar PDF
    </button>
  );
}
