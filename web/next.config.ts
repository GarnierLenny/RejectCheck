import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
  // Minimal, non-breaking CSP: block clickjacking (beyond X-Frame-Options),
  // plugin/object embeds, and <base> injection. These directives don't touch
  // script/style/connect, so they can't break Stripe, Supabase, Sentry or the
  // app's heavy inline styles. A full script-src/connect-src policy should be
  // rolled out in Content-Security-Policy-Report-Only and verified against the
  // live third-party flows before enforcing.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
];

const nextConfig: NextConfig = {
  // Tree-shake barrel-export libs so a page importing a few icons/utils doesn't
  // pull the whole package into its bundle.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-bootstrap-icons",
      "simple-icons",
      "@tanstack/react-table",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
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
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  // Session Replay is sampled at 0% (see instrumentation-client.ts), so its
  // worker/shadow-DOM/iframe code is dead weight in the (largest) Sentry chunk.
  // Excluding it is a pure byte win with zero behavior change. NOT excluding
  // tracing — tracesSampleRate is 0.1, so tracing is in use.
  bundleSizeOptimizations: {
    excludeReplayWorker: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeDebugStatements: true,
  },
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
