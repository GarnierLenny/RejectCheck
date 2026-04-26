import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const baseRewrites = [
      {
        source: "/analyse",
        destination: "/analyze",
      },
    ];
    if (process.env.NODE_ENV === "production") return { beforeFiles: baseRewrites };
    return {
      beforeFiles: [
        ...baseRewrites,
        {
          source: "/api/:path*",
          destination: "http://localhost:8888/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
