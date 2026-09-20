// Imágenes satelitales: Sentinel-2 "cloudless" (Copernicus) servidas por EOX.
//
// LICENCIA: EOxCloudless es gratuito solo para uso NO COMERCIAL (CC BY-NC-SA 4.0). Para un producto
// comercial hay que contratar la licencia comercial de EOX o cambiar de proveedor. Para cambiarlo sin
// tocar código, define NEXT_PUBLIC_SAT_TILES con una plantilla XYZ ({z}/{x}/{y}) y
// NEXT_PUBLIC_SAT_ATTRIBUTION con la atribución que exija el proveedor.
export const TILE_URL =
  process.env.NEXT_PUBLIC_SAT_TILES ||
  'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg';

export const ATRIBUCION =
  process.env.NEXT_PUBLIC_SAT_ATTRIBUTION ||
  'EOxCloudless cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024)';

export const tileUrl = (z, x, y) => TILE_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y);

// Píxel mundial (Web Mercator) de una coordenada a un zoom dado.
export function pixelMundial(lat, lon, z) {
  const s = 256 * 2 ** z;
  const r = (lat * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * s,
    y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s,
  };
}
