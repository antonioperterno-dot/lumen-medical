"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { ShareIcon } from "@/components/icons";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { formatBytes } from "@/lib/utils";

/**
 * ===========================================================================
 * InstallPrompt — "Add to Home Screen" for iPhone
 * ===========================================================================
 * Safari on iOS gives us no `beforeinstallprompt` event: the only way to
 * install a PWA is the Share sheet. So instead of a fake install button, we
 * teach the gesture — and we only show it when it is actually useful:
 *
 *   - never when LUMEN is already running standalone;
 *   - never before the student has saved something offline (an install prompt
 *     on a first visit is noise);
 *   - dismissible, and the dismissal is remembered.
 */

const DISMISS_KEY = "lumen:v1:install-dismissed";

export default function InstallPrompt() {
  const { savedCount, storageBytes } = useProgress();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari only exposes this on navigator.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }

    if (!standalone && !dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: the prompt simply reappears next time */
    }
  };

  return (
    <GlassCard className="animate-fade-in-up" padded={false}>
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-lumen/30 bg-lumen/10 text-lumen">
            <ShareIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-semibold text-white">
              Keep LUMEN on your home screen
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-dim">
              Installed apps open without Safari&apos;s bars, launch instantly, and keep
              working when the network drops. On iPhone: tap{" "}
              <span className="text-white">Share</span>, then{" "}
              <span className="text-white">Add to Home Screen</span>.
            </p>
            {savedCount > 0 && (
              <p className="mt-2 text-[11px] text-lumen">
                {savedCount} resource{savedCount === 1 ? "" : "s"} saved offline ·{" "}
                {formatBytes(storageBytes)} on this device
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-[12px] font-medium text-faint active:text-white"
        >
          Got it
        </button>
      </div>
    </GlassCard>
  );
}
