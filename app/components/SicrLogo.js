// Wordmark real de sicr3p (versión "triple impacto"): "sicr3p" en minúsculas,
// punto verde sobre la "i", y la "3" con el grafismo de red/molécula de 3 nodos
// verdes conectados. Colores de marca: navy #0f1f2e / green #28a745, adaptado
// a texto claro para el tema oscuro interno.
export default function SicrLogo({ size = 'md' }) {
  const textSize = size === 'lg' ? 'text-6xl' : size === 'sm' ? 'text-2xl' : 'text-3xl';
  const dotOffset = size === 'lg' ? '-top-3' : '-top-2';
  const dotSize = size === 'lg' ? 'w-2 h-2' : 'w-[5px] h-[5px]';

  return (
    <div className="flex flex-col gap-1 leading-none">
      <div className={`${textSize} font-bold tracking-tight text-white flex items-baseline`}>
        <span>s</span>
        <span className="relative inline-block">
          i
          <span aria-hidden="true" className={`absolute ${dotOffset} left-1/2 -translate-x-1/2 ${dotSize} rounded-full`} style={{ background: '#28a745' }} />
        </span>
        <span>cr</span>
        <span className="relative inline-block">
          3
          <svg aria-hidden="true" viewBox="0 0 20 30" className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="14" y1="7" x2="7" y2="15" stroke="#28a745" strokeWidth="1.4" />
            <line x1="7" y1="15" x2="14" y2="23" stroke="#28a745" strokeWidth="1.4" />
            <circle cx="14" cy="7" r="2.3" fill="#28a745" />
            <circle cx="7" cy="15" r="2.3" fill="#28a745" />
            <circle cx="14" cy="23" r="2.3" fill="#28a745" />
          </svg>
        </span>
        <span>p</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-px w-3" style={{ background: '#28a745' }} />
        <span className="text-[10px] font-bold tracking-widest text-white uppercase">triple impacto</span>
        <span className="h-px w-3" style={{ background: '#28a745' }} />
      </div>
      <div className="text-[9px] text-slate-400 flex items-center gap-1">
        <span>social</span><span style={{ color: '#28a745' }}>·</span>
        <span>ambiental</span><span style={{ color: '#28a745' }}>·</span>
        <span>económico</span>
      </div>
    </div>
  );
}
