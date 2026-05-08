import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: [
        "172.20.10.2", 
        "localhost:4000", 
        "russel-unclinging-incalculably.ngrok-free.dev",
        "*.traefik.me",
        "72-62-45-245.traefik.me"
      ],
    },
  },
  allowedDevOrigins: [
    "russel-unclinging-incalculably.ngrok-free.dev", 
    "172.20.10.2",
    "*.traefik.me"
  ],
};

export default nextConfig;
