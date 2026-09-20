// Wordmark de sicr3p para fondos claros (navy #0f1f2e, verde #28a745).
// Copia local a propósito: este sitio no importa nada del resto de la app.
export default function Wordmark({ className = 'text-2xl' }) {
  return (
    <span className={`${className} font-bold tracking-tight text-[#0f1f2e] inline-flex items-baseline leading-none`} aria-label="sicr3p">
      <span>s</span>
      <span className="relative inline-block">
        i
        <span aria-hidden="true" className="absolute -top-2 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#28a745]" />
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
    </span>
  );
}
