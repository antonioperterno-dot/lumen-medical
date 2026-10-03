/**
 * LUMEN icon set — hand-rolled inline SVGs.
 * No icon library ships with the app: every kilobyte matters on a 2G
 * connection, and these are the only 12 glyphs the UI needs.
 * They inherit `currentColor`, so the active tab turns green for free.
 */

export type IconProps = {
  className?: string;
  strokeWidth?: number;
};

function base(strokeWidth: number) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function HomeIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M3 10.2 12 3.5l9 6.7" />
      <path d="M5.5 9.4V20h13V9.4" />
      <path d="M9.8 20v-5.3h4.4V20" />
    </svg>
  );
}

export function GridIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

export function QuizIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M12 3.2 13.8 8l4.9.3-3.8 3.1 1.3 4.7L12 13.6 7.8 16.1l1.3-4.7L5.3 8.3 10.2 8Z" />
      <path d="M6 20.5h12" />
    </svg>
  );
}

export function QuizPaperIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M6.5 3.5h8l3.5 3.6v13.4H6.5z" />
      <path d="M14.5 3.8v4h3.2M9.2 12h5.6M9.2 15.5h5.6" />
      <path d="m8.8 9.1 1 1 1.7-1.8" />
    </svg>
  );
}

export function BookmarkIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M6.5 3.8h11v16.4l-5.5-3.9-5.5 3.9z" />
    </svg>
  );
}

export function UserIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <circle cx="12" cy="8.4" r="3.9" />
      <path d="M4.8 20.2c1.1-3.6 3.8-5.4 7.2-5.4s6.1 1.8 7.2 5.4" />
    </svg>
  );
}

export function SearchIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4 4" />
    </svg>
  );
}

export function ChevronRightIcon({
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="m9.5 5.5 7 6.5-7 6.5" />
    </svg>
  );
}

export function ChevronLeftIcon({
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="m14.5 5.5-7 6.5 7 6.5" />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5", strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="m5 12.6 4.6 4.4L19 6.8" />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5", strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function DownloadIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M12 4v10.5" />
      <path d="m7.8 10.6 4.2 4.2 4.2-4.2" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function RefreshIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4" />
      <path d="M19.8 4.5v4.4h-4.4" />
    </svg>
  );
}

export function OfflineIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M3 5.5 21 19" />
      <path d="M5.5 9.4a11 11 0 0 1 4.3-2.1" />
      <path d="M14.4 7.8a11 11 0 0 1 4.1 1.6" />
      <path d="M8.6 13a7 7 0 0 1 2.1-.8" />
      <path d="M14.9 13.1c.5.2 1 .4 1.4.7" />
      <circle cx="12" cy="17.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FlameIcon({ className = "h-5 w-5", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M12 3.5c2.6 2.4 2.1 4.4.9 5.6 1.6-.3 2.9.9 2.9 2.6 0 .9-.4 1.6-1 2.2.9.5 1.6 1.6 1.6 3 0 2.3-2.1 4.1-4.4 4.1s-4.4-1.7-4.4-4c0-2.6 2-4.4 3.3-6.2.6-.8.9-1.6 1-2.3" />
    </svg>
  );
}

export function ClockIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l3 1.8" />
    </svg>
  );
}

export function ShareIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M12 15.5V3.8" />
      <path d="m8.2 7.4 3.8-3.6 3.8 3.6" />
      <path d="M5.5 13v6.2h13V13" />
    </svg>
  );
}

export function PlusIcon({ className = "h-5 w-5", strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function SparkIcon({ className = "h-5 w-5", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <path d="M12 3.5v3.2M12 17.3v3.2M4.9 4.9l2.3 2.3M16.8 16.8l2.3 2.3M3.5 12h3.2M17.3 12h3.2M4.9 19.1l2.3-2.3M16.8 7.2l2.3-2.3" />
    </svg>
  );
}

export function VirusIcon({ className = "h-5 w-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="6.2" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
      <circle cx="10" cy="10" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FirstAidCaseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 6.5V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="6.5" width="18" height="14.5" rx="2.5" fill="#D93B42" stroke="#F07176" strokeWidth="1.2" />
      <path d="M10.2 9.5h3.6v2.7h2.7v3.6h-2.7v2.7h-3.6v-2.7H7.5v-3.6h2.7z" fill="white" />
    </svg>
  );
}
