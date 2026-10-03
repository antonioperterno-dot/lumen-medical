"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { useProfileWriter, useProgress } from "@/lib/progress/ProgressProvider";

const THEME_KEY = "lumen:v1:theme";
type Theme = "system" | "light" | "dark";

export default function SettingsPage() {
  const { profile, storageBytes } = useProgress();
  const writeProfile = useProfileWriter();
  const [theme, setTheme] = useState<Theme>("system");
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? "");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const setThemeMode = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <div className="px-5">
      <ScreenHeader title="Settings" subtitle="Profile, appearance and device" back="/profile" />
      <div className="space-y-5 pt-1">
        <section className="glass space-y-4 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            {profile?.photoUrl ? <img src={profile.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lumen/10 text-lg font-bold text-lumen">{profile?.displayName.slice(0, 1).toUpperCase()}</span>}
            <div><h2 className="text-[15px] font-semibold text-white">Profile photo</h2><p className="text-[12px] text-dim">Use an image URL hosted outside LUMEN.</p></div>
          </div>
          <input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13px] text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none" />
          <button type="button" onClick={() => writeProfile({ photoUrl: photoUrl.trim() || null })} className="w-full rounded-xl bg-lumen py-2.5 text-[13px] font-semibold text-canvas">Save photo</button>
        </section>
        <section className="glass space-y-3 rounded-2xl p-4">
          <h2 className="text-[15px] font-semibold text-white">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            {(["system", "light", "dark"] as Theme[]).map((item) => <button key={item} type="button" onClick={() => setThemeMode(item)} className={theme === item ? "rounded-xl border border-lumen/50 bg-lumen/15 py-2 text-[12px] font-semibold text-lumen" : "rounded-xl border border-white/10 bg-white/5 py-2 text-[12px] text-white/70"}>{item[0].toUpperCase() + item.slice(1)}</button>)}
          </div>
          <p className="text-[12px] leading-relaxed text-dim">LUMEN keeps the clinical dark theme as its default. Light mode is available for bright environments.</p>
        </section>
        <section className="glass space-y-3 rounded-2xl p-4">
          <h2 className="text-[15px] font-semibold text-white">Device</h2>
          <p className="text-[12px] text-dim">Local offline data currently uses {Math.max(0, Math.round(storageBytes / 1024))} KB.</p>
          <Link href="/saved" className="block text-[12px] font-semibold text-lumen">Manage offline articles</Link>
        </section>
      </div>
    </div>
  );
}
