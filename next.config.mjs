/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 tiene un binario nativo — no debe pasar por el bundler de webpack.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
