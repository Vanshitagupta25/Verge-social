/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  allowedDevOrigins: ['10.153.32.220'],
  
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}           

export default nextConfig
