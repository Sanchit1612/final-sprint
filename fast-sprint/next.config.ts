import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/dsa": ["./content/collections/*.manifest.json"],
    "/core/*": ["./content/collections/*.manifest.json"],
    "/resources/*": ["./content/collections/*.manifest.json"],
  },
};

export default nextConfig;
