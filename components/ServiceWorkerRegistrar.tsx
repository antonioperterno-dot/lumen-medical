"use client";

import { useEffect, useState } from "react";
import { RefreshIcon } from "@/components/icons";

/**
 * ===========================================================================
 * ServiceWorkerRegistrar — installs and updates the offline engine
 * ===========================================================================
 * next-pwa generates /public/sw.js at build time (see next.config.mjs). This
 * component is the ONLY place that registers it, which means we control the
 * update UX instead of hoping the browser gets around to it:
 *
 *   - registration happens after `load`, so it never competes with the first
 *     paint on a slow connection;
 *   - when a new build is waiting, we show a small "New content available"
 *     pill. Tapping it activates the new worker and reloads once.
 *
 * In `next dev` there is no sw.js (PWA is disabled in development), so this
 * component silently does nothing.
 */

export default function ServiceWorkerRegistrar() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let reloading = false;
    let registration: ServiceWorkerRegistration | undefined;

    const onLoad = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          registration = reg;

          if (reg.waiting && navigator.serviceWorker.controller) {
            setWaiting(reg.waiting);
          }

          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              // "installed" + an existing controller means this is an update,
              // not the very first install.
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setWaiting(installing);
              }
            });
          });
        })
        .catch(() => {
          /* Offline on first ever load: nothing to precache yet. */
        });
    };

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    window.addEventListener("load", onLoad);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    // A registration may already exist from a previous visit.
    if (document.readyState === "complete") onLoad();

    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      void registration?.update().catch(() => undefined);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <button
        type="button"
        onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
        className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-glow"
      >
        <RefreshIcon className="h-3.5 w-3.5 text-lumen" />
        New content available. Tap to update.
      </button>
    </div>
  );
}
