import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  allowedDevOrigins: [
    "russel-unclinging-incalculably.ngrok-free.dev", 
    "172.20.10.2",
    "zangochap.in",
    "*.zangochap.in"
  ],
};

export default nextConfig;
