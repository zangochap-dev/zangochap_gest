import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["172.20.10.2", "localhost:3000", "russel-unclinging-incalculably.ngrok-free.dev"],
    },
  },
  allowedDevOrigins: ["russel-unclinging-incalculably.ngrok-free.dev", "172.20.10.2"],
};

export default nextConfig;
