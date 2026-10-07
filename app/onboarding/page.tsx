"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileWriter, useProgress } from "@/lib/progress/ProgressProvider";
import { ONBOARDING_KEY } from "@/components/OnboardingGate";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading } = useProgress();
  const writeProfile = useProfileWriter();
  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [school, setSchool] = useState("");
  const [faculty, setFaculty] = useState("");

  if (loading || !profile) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    writeProfile({
      displayName: name.trim() || preferredName.trim() || "Alex",
      preferredName: preferredName.trim() || name.trim() || "Alex",
      email: email.trim() || null,
      photoUrl: photoUrl.trim() || null,
      institution: school.trim() || null,
      school: school.trim() || null,
      faculty: faculty.trim() || null,
    });
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // The profile still remains available in memory when storage is blocked.
    }
    router.replace("/");
  };

  return (
    <main className="min-h-[100dvh] px-5 pb-10 pt-safe">
      <div className="mx-auto max-w-[520px] space-y-6 pt-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lumen">Welcome to LUMEN</p>
          <h1 className="text-[26px] font-bold leading-tight text-white">Set up your study profile</h1>
          <p className="text-[13px] leading-relaxed text-dim">These details stay on this device first and can sync when your account is available.</p>
        </div>
        <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-4">
          {[
            ["Full name", name, setName, "Your name"],
            ["Preferred name", preferredName, setPreferredName, "What should LUMEN call you?"],
            ["Email", email, setEmail, "name@example.com"],
            ["Profile photo URL", photoUrl, setPhotoUrl, "Optional image link"],
            ["School", school, setSchool, "University or school"],
            ["Faculty", faculty, setFaculty, "Faculty of Health Sciences"],
          ].map(([label, value, setter, placeholder]) => (
            <label key={label as string} className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-wide text-faint">{label as string}</span>
              <input
                value={value as string}
                onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                placeholder={placeholder as string}
                type={label === "Email" ? "email" : "text"}
                className="glass-input w-full rounded-xl border border-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none"
              />
            </label>
          ))}
          <button type="submit" className="w-full rounded-xl bg-lumen py-3 text-[13px] font-semibold text-canvas">Continue to LUMEN</button>
        </form>
      </div>
    </main>
  );
}
