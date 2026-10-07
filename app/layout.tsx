import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import OnboardingGate from "@/components/OnboardingGate";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import OfflineBanner from "@/components/OfflineBanner";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import { ProgressProvider } from "@/lib/progress/ProgressProvider";

/**
 * Inter is loaded through next/font so it is self-hosted and available
 * offline — critical when a student opens LUMEN in a hospital basement
 * with no data connection.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LUMEN | Medical Education",
  description:
    "Offline-first medical education for students in Uganda. Cardiology, Neurology, Physiology, Anatomy, First Aid, Journals and Clinical Guidelines.",

  manifest: "/manifest.json",
  applicationName: "LUMEN",

  // ---------------------------------------------------------------------
  // iOS "Add to Home Screen" support. Safari ignores the web manifest for
  // the install prompt, so these tags are what actually make it standalone.
  // ---------------------------------------------------------------------
  appleWebApp: {
    capable: true,
    title: "LUMEN",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/icons/icon-192.png"],
  },
  openGraph: {
    title: "LUMEN | Medical Education",
    description: "Offline-first medical education for students in Uganda.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#091321",
  width: "device-width",
  initialScale: 1,
  // Never lock zoom: low-vision students must be able to pinch-zoom drug tables.
  maximumScale: 5,
  // Required for the iPhone notch / Dynamic Island and the home indicator.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Tells iOS this app is web-app-capable when launched from the home screen. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
        {/* Apply the saved theme before first paint so there is no dark-flash on
            reload. `system` (or unset) means: follow prefers-color-scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("lumen:v1:theme");var m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches;var e=t==="light"||(!t||t==="system")&&m?"light":"dark";if(e==="light")document.documentElement.dataset.theme="light";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative min-h-[100dvh] bg-canvas">
        {/* Ambient green glow behind ALL content — the backdrop the glass
            cards refract. Full-viewport so the effect reaches every screen. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 lumen-aurora"
        />

        <AuthProvider>
          <ProgressProvider>
            <OnboardingGate />
            <OfflineBanner />
            <main className="relative mx-auto w-full max-w-[520px] pb-nav">
              {children}
            </main>
            <BottomNav />
          </ProgressProvider>
        </AuthProvider>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
