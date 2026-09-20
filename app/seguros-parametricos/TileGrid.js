import { ATRIBUCION, pixelMundial, tileUrl } from './satelite';

// Fondo satelital estático: compone teselas reales alrededor de un punto, sin librerías ni JS en el cliente.
// `cols`/`rows` son las teselas de 256 px que cubren el contenedor (elige un poco más que su tamaño).
// `escala` agranda el mosaico desde el centro para cubrir más área con menos teselas.
export default function TileGrid({ lat, lon, z = 12, cols = 6, rows = 4, escala = 1, atribuir = true, prioridad = false, className = '' }) {
  const c = pixelMundial(lat, lon, z);
  const x0 = Math.floor((c.x - (cols * 256) / 2) / 256), x1 = Math.floor((c.x + (cols * 256) / 2) / 256);
  const y0 = Math.floor((c.y - (rows * 256) / 2) / 256), y1 = Math.floor((c.y + (rows * 256) / 2) / 256);
  const max = 2 ** z;

  const tiles = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (ty < 0 || ty >= max) continue;
      const tx2 = ((tx % max) + max) % max;
      tiles.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${tx}-${ty}`}
          src={tileUrl(z, tx2, ty)}
          alt=""
          width={256}
          height={256}
          draggable={false}
          loading={prioridad ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute max-w-none select-none"
          style={{ left: `calc(50% + ${tx * 256 - c.x}px)`, top: `calc(50% + ${ty * 256 - c.y}px)` }}
        />,
      );
    }
  }

  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ transform: `scale(${escala})` }}>{tiles}</div>
      {atribuir && (
        <span className="absolute bottom-1 right-2 text-[9px] text-white/70 bg-black/40 rounded px-1.5 py-0.5 max-w-[80%] truncate">
          {ATRIBUCION}
        </span>
      )}
    </div>
  );
}
