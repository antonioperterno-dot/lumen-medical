import withPWAInit from "next-pwa";

/**
 * ===========================================================================
 * LUMEN — PWA wiring (next-pwa / Workbox)
 * ===========================================================================
 * Offline-first is the whole point of this app: a student in a Ugandan
 * teaching hospital must be able to open LUMEN in a basement with no bars of
 * signal and still read the lecture they opened yesterday.
 *
 * Caching strategy, by content type:
 *  - App shell / JS / CSS / fonts : precached, cache-first (instant launch).
 *  - Page navigations             : NetworkFirst with a long offline window.
 *  - /api/resources (Turso)       : NetworkFirst, cached for 30 days. This is
 *                                   the "offline library" — the catalogue is
 *                                   static study material, so stale is fine.
 *  - /api/progress, /api/quiz     : NetworkOnly. Per-user state must never be
 *                                   served stale to a second student on a
 *                                   shared ward iPad; the client keeps its own
 *                                   local mirror instead (lib/offline/*).
 *  - Icons / images               : StaleWhileRevalidate.
 *
 * A written-down 'document' fallback means a navigation that misses the cache
 * lands on /offline instead of Safari's dinosaur.
 */
const withPWA = withPWAInit({
  dest: "public",
  // next-pwa registers /sw.js for us on the client. skipWaiting + clientsClaim
  // mean a new build takes over on the next navigation, not in three weeks.
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  // Never run the service worker in `next dev`: it makes hot reload look broken.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: "/offline",
  },
  // Required for the App Router: this manifest is regenerated per request and
  // must never be precached.
  buildExcludes: [/app-build-manifest\.json$/, /middleware-manifest\.json$/],
  publicExcludes: ["!icons/**/*", "!manifest.json"],
  runtimeCaching: [
    {
      // The resources catalogue = the offline library.
      urlPattern: /^https?:\/\/[^/]+\/api\/resources.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "lumen-resources",
        networkTimeoutSeconds: 4,
        expiration: {
          maxEntries: 400,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // Per-user state: online only. The client mirrors it in localStorage.
      urlPattern: /^https?:\/\/[^/]+\/api\/(progress|quiz).*$/i,
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: /^https?:\/\/[^/]+\/(categories|resources|quiz|saved|profile).*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "lumen-pages",
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 14 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: ({ request }) => request.destination === "image",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "lumen-images",
        expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: ({ request }) =>
        ["style", "script", "worker", "font"].includes(request.destination),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "lumen-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Static export is intentionally NOT used: the API routes are the microservices.
  // We deploy to Firebase Hosting through Cloud Functions or Cloud Run.
  // or Vercel — see README.md.
  poweredByHeader: false,

  images: {
    // Medical illustrations may come from remote CDNs. Add your own hosts here.
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        // The service worker must never be cached by the browser, otherwise
        // users get stuck on an old precache manifest forever.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        // Resources are static study material: let the edge and the service
        // worker hold on to them for a while.
        source: "/api/resources/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=86400",
          },
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

export default withPWA(nextConfig);

