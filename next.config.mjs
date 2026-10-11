/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 tiene un binario nativo — no debe pasar por el bundler de webpack.
  serverExternalPackages: ['better-sqlite3'],
  // El dev server escucha en 0.0.0.0; el navegador entra por 127.0.0.1/localhost.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
