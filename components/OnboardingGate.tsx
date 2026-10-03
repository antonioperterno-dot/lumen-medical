"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "lumen:v1:onboarding-complete";

export default function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/onboarding") {
      setChecked(true);
      return;
    }

    try {
      if (window.localStorage.getItem(ONBOARDING_KEY) !== "1") {
        router.replace("/onboarding");
        return;
      }
    } catch {
      // Private browsing can deny storage; the app remains usable.
    }
    setChecked(true);
  }, [pathname, router]);

  if (!checked && pathname !== "/onboarding") return null;
  return null;
}

export { ONBOARDING_KEY };
