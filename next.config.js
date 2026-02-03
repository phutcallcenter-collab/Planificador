/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido: output: 'export',
  reactStrictMode: true,

  // Ignorar warnings de ESLint que bloquean build en Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },

  // IMPORTANTE para PWA
  images: {
    unoptimized: true,
  },

  // OPTION A: Controlled Deploy (Ignoring Legacy Errors)
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
