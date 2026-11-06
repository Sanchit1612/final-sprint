import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      ],
    }];
  },
  outputFileTracingIncludes: {
    "/*": ["./content/collections/*.manifest.json"],
    "/analytics": ["./content/companies/*.json"],
    "/companies": ["./content/companies/*.json"],
    "/companies/*": ["./content/companies/*.json"],
    "/dsa": ["./content/collections/*.manifest.json"],
    "/core/*": ["./content/collections/*.manifest.json"],
    "/resources/*": ["./content/collections/*.manifest.json"],
  },
};

export default nextConfig;
