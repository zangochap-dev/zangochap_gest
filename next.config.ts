import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // On garde la vérification TS pour la sécurité
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-df10dc36e7674fbbb14169cd4db04453.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: [
        "172.20.10.2", 
        "localhost:3000", 
        "russel-unclinging-incalculably.ngrok-free.dev",
        "zangochap.in",
        "*.zangochap.in"
      ],
    },
  },
};

export default nextConfig;
