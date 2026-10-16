/**
 * Wordmark oficial sicr3p/ — Manual de marca v1.0 (oct 2026).
 * Base: Azul Profundo #0F1B3D · Acento: Violeta SICR3P #6B5CF6 en «3/».
 */
const VIOLET = '#6B5CF6';
const NAVY = '#0F1B3D';

const SIZE = {
  sm: { text: 'text-2xl', tag: 'text-[10px]', gap: 'gap-1' },
  md: { text: 'text-3xl', tag: 'text-[11px]', gap: 'gap-1.5' },
  lg: { text: 'text-5xl', tag: 'text-sm', gap: 'gap-2' },
};

export default function SicrLogo({
  size = 'md',
  contrast = 'dark',
  compact = false,
  variant = 'full',
  className = '',
  showTagline = !compact,
}) {
  const s = SIZE[size] || SIZE.md;
  const inverse = contrast === 'light';
  const base = inverse ? '#FFFFFF' : NAVY;
  const accent = VIOLET;

  if (variant === 'isotype') {
    return (
      <span
        className={`sicr-logo inline-flex items-baseline font-bold tracking-tight leading-none ${s.text} ${className}`.trim()}
        aria-label="sicr3p"
        style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}
      >
        <span style={{ color: accent }}>3</span>
        <span style={{ color: inverse ? '#FFFFFF' : NAVY }}>/</span>
      </span>
    );
  }

  const word =
    variant === 'mono' ? (
      <>
        <span style={{ color: base }}>sicr</span>
        <span style={{ color: base }}>3</span>
        <span style={{ color: base }}>p/</span>
      </>
    ) : (
      <>
        <span style={{ color: base }}>sicr</span>
        <span style={{ color: accent }}>3</span>
        <span style={{ color: base }}>p</span>
        <span style={{ color: accent }}>/</span>
      </>
    );

  return (
    <div
      className={`sicr-logo flex flex-col ${s.gap} leading-none ${className}`.trim()}
      style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}
    >
      <div className={`${s.text} font-bold tracking-tight flex items-baseline`} aria-label="sicr3p/">
        {word}
      </div>
      {showTagline ? (
        <p
          className={`${s.tag} font-medium tracking-wide`}
          style={{ color: inverse ? 'rgba(255,255,255,0.72)' : '#5B6578' }}
        >
          Desarrollamos empresas. Acercamos soluciones.
        </p>
      ) : null}
    </div>
  );
}

export const SICR_BRAND = {
  navy: NAVY,
  violet: VIOLET,
  green: '#00B67A',
  blueSoft: '#E6F0FF',
  gray: '#F4F5F9',
};
