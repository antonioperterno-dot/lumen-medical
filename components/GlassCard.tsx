import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 * GlassCard — the one surface the whole app is built from
 * ===========================================================================
 * Translucent white 10% + backdrop-blur + rounded-2xl + a hairline border that
 * reads as glass on a near-black canvas.
 *
 * Renders as: <Link> when `href` is set, <button> when `onClick` is set,
 * otherwise a plain <div>. Callers never hand-roll the glass classes.
 */

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Makes the whole card tappable (and gets iOS press feedback). */
  href?: string;
  onClick?: () => void;
  /** Extra blur + a brighter fill, for cards sitting over busy content. */
  strong?: boolean;
  /** Remove internal padding when the card hosts its own layout. */
  padded?: boolean;
  /** Green hairline used to mark the active/primary card. */
  accent?: boolean;
  ariaLabel?: string;
};

export default function GlassCard({
  children,
  className,
  href,
  onClick,
  strong = false,
  padded = true,
  accent = false,
  ariaLabel,
}: GlassCardProps) {
  const classes = cn(
    strong ? "glass-strong" : "glass",
    "rounded-2xl shadow-card",
    padded && "p-4",
    accent && "!border-lumen/40 shadow-glow",
    (href || onClick) && "glass-pressable block w-full text-left",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label={ariaLabel}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
