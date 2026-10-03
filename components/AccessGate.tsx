"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";

const REQUIRE_INVITE = process.env.NEXT_PUBLIC_REQUIRE_INVITE === "true";
const LOCAL_ACCESS_PREFIX = "lumen:invite-activated:";

export default function AccessGate({ children }: { children: ReactNode }) {
  const { user, loading, firebaseEnabled, getIdToken, signInForInvite } = useAuth();
  const [checking, setChecking] = useState(REQUIRE_INVITE);
  const [allowed, setAllowed] = useState(!REQUIRE_INVITE);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const checkAccess = useCallback(async () => {
    if (!REQUIRE_INVITE) return;
    if (!user) return;
    setChecking(true);
    const localKey = `${LOCAL_ACCESS_PREFIX}${user.uid}`;
    try {
      const token = await getIdToken();
      if (!token) throw new Error("offline");
      const response = await fetch("/api/access/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("unavailable");
      const result = (await response.json()) as { allowed?: boolean };
      if (result.allowed) {
        window.localStorage.setItem(localKey, "1");
        setAllowed(true);
      } else {
        window.localStorage.removeItem(localKey);
        setAllowed(false);
      }
      setMessage("");
    } catch {
      // A previously activated device can still open cached study material offline.
      const activated = window.localStorage.getItem(localKey) === "1";
      setAllowed(activated);
      setMessage(activated ? "Offline access is available on this device." : "Connect to the internet to check your invitation.");
    } finally {
      setChecking(false);
    }
  }, [getIdToken, user]);

  useEffect(() => {
    if (!REQUIRE_INVITE || loading) return;
    if (!firebaseEnabled) {
      setAllowed(false);
      setMessage("LUMEN access is not configured yet. Please contact the person who invited you.");
      setChecking(false);
      return;
    }
    if (user) {
      void checkAccess();
    } else {
      setMessage("Sign-in is not available yet. Connect to the internet and try again.");
      setChecking(false);
    }
  }, [checkAccess, firebaseEnabled, loading, user]);

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const inviteUser = user ?? await signInForInvite();
      const token = inviteUser ? await inviteUser.getIdToken() : await getIdToken();
      if (!token) throw new Error("Connect to the internet, then try again.");
      const response = await fetch("/api/access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as { allowed?: boolean; error?: string };
      if (!response.ok || !result.allowed) {
        throw new Error(result.error === "invalid_invite" ? "That code is invalid, expired, or already used." : "We couldn’t verify the code. Try again when you’re online.");
      }
      if (inviteUser) window.localStorage.setItem(`${LOCAL_ACCESS_PREFIX}${inviteUser.uid}`, "1");
      setAllowed(true);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t verify the code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!REQUIRE_INVITE || allowed) return <>{children}</>;

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[520px] items-center px-5 py-10">
      <section className="glass w-full space-y-5 rounded-3xl p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lumen">LUMEN · invited access</p>
          <h1 className="text-[26px] font-bold leading-tight text-white">Enter your invite code</h1>
          <p className="text-[13px] leading-relaxed text-dim">Ask the person who invited you for your one-use code. After activation, this device can keep your study materials available offline.</p>
        </div>
        {checking || loading ? (
          <p className="text-[13px] text-dim">Checking access…</p>
        ) : !firebaseEnabled ? (
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-[12px] leading-relaxed text-dim">{message}</p>
        ) : (
          <form onSubmit={redeem} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-wide text-faint">One-use code</span>
              <input
                autoComplete="one-time-code"
                autoCapitalize="characters"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={16}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 font-mono text-[16px] tracking-widest text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none"
              />
            </label>
            <button disabled={busy || checking || loading} type="submit" className="w-full rounded-xl bg-lumen py-3 text-[13px] font-semibold text-canvas disabled:opacity-50">
              {busy ? "Checking code…" : "Continue to LUMEN"}
            </button>
            {message && <p role="status" className="text-[12px] leading-relaxed text-dim">{message}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
