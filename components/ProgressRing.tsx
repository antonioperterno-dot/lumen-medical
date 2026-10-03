import { clampPercent, cn } from "@/lib/utils";

/**
 * ===========================================================================
 * ProgressRing — the SVG ring on every resource card
 * ===========================================================================
 * Deliberately an SVG rather than a conic-gradient: SVG renders identically in
 * iOS Safari 15 (which many of our students' second-hand iPhones run) and gives
 * us a precise, animatable arc.
 *
 * 0%      shows a faint dashed track ("not started")
 * 1–99%   shows a green arc from 12 o'clock, clockwise
 * 100%    shows a solid ring and a check mark
 */
export default function ProgressRing({
  percent,
  size = 56,
  stroke = 4,
  className,
  label,
  showValue = true,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  className?: string;
  /** Small caption under the number, e.g. "read". */
  label?: string;
  showValue?: boolean;
}) {
  const value = clampPercent(percent);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  const complete = value >= 100;
  const started = value > 0;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {/* Track. Dashes when nothing has been read yet. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={started ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.16)"}
          strokeWidth={stroke}
          strokeDasharray={started ? undefined : "2 5"}
          strokeLinecap="round"
        />
        {started && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#39FF88"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            style={{
              transition: "stroke-dasharray 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              filter: complete ? "drop-shadow(0 0 6px rgba(57,255,136,0.55))" : undefined,
            }}
          />
        )}
      </svg>

      {showValue && (
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center leading-none",
            complete ? "text-lumen" : started ? "text-white" : "text-faint",
          )}
          style={{ fontSize: size <= 44 ? 10 : 12 }}
        >
          <span className="font-semibold tabular-nums">{value}%</span>
          {label && (
            <span className="mt-0.5 text-[8px] uppercase tracking-wide text-faint">
              {label}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
