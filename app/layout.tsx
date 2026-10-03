import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import OnboardingGate from "@/components/OnboardingGate";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import OfflineBanner from "@/components/OfflineBanner";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import { ProgressProvider } from "@/lib/progress/ProgressProvider";
import AccessGate from "@/components/AccessGate";

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
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  // Lock zoom so the app feels native rather than like a web page.
  maximumScale: 1,
  userScalable: false,
  // Required for the iPhone notch / Dynamic Island and the home indicator.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Tells iOS this app is web-app-capable when launched from the home screen. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
      </head>
      <body className="relative min-h-[100dvh] bg-canvas">
        {/* Ambient green glow behind all content. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 h-[420px] lumen-aurora"
        />

        <AuthProvider>
          <AccessGate>
            <ProgressProvider>
              <OnboardingGate />
              <OfflineBanner />
              <main className="relative mx-auto w-full max-w-[520px] pb-nav">
                {children}
              </main>
              <BottomNav />
            </ProgressProvider>
          </AccessGate>
        </AuthProvider>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
