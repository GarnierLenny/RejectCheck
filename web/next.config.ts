import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
