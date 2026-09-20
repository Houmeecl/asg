'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { ATRIBUCION, TILE_URL } from './satelite';

// Mapa satelital interactivo (Leaflet) con el predio asegurado y la estación de referencia.
// Leaflet toca `window`, por eso se importa dentro del efecto y no en el módulo.
export default function MapaInteractivo({ centro, zoom = 14, poligono, estacion, etiquetaPredio = 'Predio asegurado', etiquetaEstacion = 'Estación de referencia', className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    let mapa;
    let cancelado = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !ref.current) return;

      mapa = L.map(ref.current, { center: centro, zoom, minZoom: 9, maxZoom: 15, scrollWheelZoom: false, attributionControl: true });
      L.tileLayer(TILE_URL, { attribution: ATRIBUCION, maxNativeZoom: 14, maxZoom: 15 }).addTo(mapa);

      L.polygon(poligono, { color: '#5ce08a', weight: 3, fillColor: '#5ce08a', fillOpacity: 0.18 })
        .addTo(mapa).bindTooltip(etiquetaPredio, { permanent: true, direction: 'center', className: 'tooltip-predio' });

      const icono = L.divIcon({
        className: '',
        html: '<span class="pulso-estacion"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker(estacion, { icon: icono, keyboard: false }).addTo(mapa).bindTooltip(etiquetaEstacion, { direction: 'top', offset: [0, -10] });
    })();
    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [centro, zoom, poligono, estacion, etiquetaPredio, etiquetaEstacion]);

  return <div ref={ref} className={`isolate w-full h-full bg-[#0f1f2e] ${className}`} role="img" aria-label="Mapa satelital del predio asegurado" />;
}
