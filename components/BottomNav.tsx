"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkIcon,
  GridIcon,
  HomeIcon,
  QuizIcon,
  UserIcon,
  type IconProps,
} from "@/components/icons";
import { useProgress } from "@/lib/progress/ProgressProvider";

/**
 * ===========================================================================
 * BottomNav — blurred, iOS-style tab bar
 * ===========================================================================
 * Fixed to the bottom of the viewport with a translucent blur so content
 * scrolls underneath it, exactly like the native iOS bar.
 *
 * `--nav-height` in globals.css includes `env(safe-area-inset-bottom)`, and
 * every page pads against `.pb-nav`, so nothing is ever hidden behind the bar
 * on a notched device.
 */

type Tab = {
  href: string;
  label: string;
  Icon: (props: IconProps) => React.ReactElement;
};

const TABS: Tab[] = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/categories", label: "Browse", Icon: GridIcon },
  { href: "/quiz", label: "Quiz", Icon: QuizIcon },
  { href: "/saved", label: "Saved", Icon: BookmarkIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  // Badge: how many articles the student keeps offline for the ward round.
  const { savedCount } = useProgress();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10"
      style={{
        background: "rgba(10,10,10,0.72)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex w-full max-w-[520px] items-stretch px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="nav-item"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.1 : 1.7}
                  />
                  {href === "/saved" && savedCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lumen px-1 text-[9px] font-bold text-canvas">
                      {savedCount > 9 ? "9+" : savedCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

