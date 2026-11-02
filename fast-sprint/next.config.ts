import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/companies": ["./content/companies/*.json"],
    "/companies/*": ["./content/companies/*.json"],
    "/dsa": ["./content/collections/*.manifest.json"],
    "/core/*": ["./content/collections/*.manifest.json"],
    "/resources/*": ["./content/collections/*.manifest.json"],
  },
};

export default nextConfig;
