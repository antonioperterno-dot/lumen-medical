import type { UserProfile } from "@/lib/types";
import { todayKey } from "@/lib/utils";

/**
 * ===========================================================================
 * The profile LUMEN falls back to when Firebase is not configured
 * ===========================================================================
 * A fresh clone, an offline first launch, or an institute that runs LUMEN
 * without a Firebase project still has to show a working profile screen. This
 * is that profile: a plausible student at a plausible institution, so every
 * screen has something honest to render instead of a blank card.
 *
 * The type comes from the shared wire contract in `@/lib/types` — this module
 * adds no fields of its own, so it can never drift from what the API returns.
 */

export const DEMO_PROFILE: UserProfile = {
  uid: "local-demo-user",
  displayName: "Anthony Pillie",
  preferredName: "Pillie",
  email: null,
  photoUrl: null,
  badge: "PRO",
  institution: "MHPC",
  school: "MHPC",
  faculty: "PHD",
  yearOfStudy: 1,
  createdAt: new Date(0).toISOString(),
  streakDays: 12,
  lastActiveOn: todayKey(),
};
