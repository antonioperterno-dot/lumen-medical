import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnNavigation: true,
  exclude: [/app-build-manifest\.json$/, /middleware-manifest\.json$/],
  additionalPrecacheEntries: [{ url: "/offline", revision: null }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep secrets out of the serverless bundle: Next's output tracer was
  // pulling .env.local into filePathMap (verified in .vc-config.json), which
  // ships API keys inside the deployed function files. At runtime Vercel
  // injects env vars from the project settings instead.
  outputFileTracingExcludes: {
    "*": [".env.local", ".env.*.local"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        source: "/api/resources/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
