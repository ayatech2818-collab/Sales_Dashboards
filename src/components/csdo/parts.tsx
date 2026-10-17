import type { CSSProperties, ReactNode } from "react";
import { LuStar } from "react-icons/lu";
import { avatar } from "./model";

/** White, bordered surface shared by the dashboard's cards; radius and padding vary per card. */
export const PANEL = "border border-rim bg-white shadow-panel";

/** Initials on the person's pastel tint; size and font size come from `className`. */
export function Avatar({
  person,
  ring,
  className = "",
  style,
}: {
  person: { id: string; name: string };
  /** Status colour drawn as a halo outside a white gap. */
  ring?: { gap: number; width: number; color: string };
  className?: string;
  style?: CSSProperties;
}) {
  const a = avatar(person);
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full font-extrabold ${className}`}
      style={{
        background: a.bg,
        color: a.ink,
        boxShadow: ring
          ? `0 0 0 ${ring.gap}px #FFFFFF,0 0 0 ${ring.gap + ring.width}px ${ring.color}`
          : undefined,
        ...style,
      }}
    >
      {a.initials}
    </span>
  );
}

/** Monospaced id chip: "SO-2101". */
export function IdPill({ id }: { id: string }) {
  return (
    <span className="rounded-full bg-pill px-2 py-0.75 font-mono text-[11px] font-medium text-[#5b6070]">
      {id}
    </span>
  );
}

/** Small uppercase label above a control group. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[11px] font-bold tracking-[.12em] text-fog ${className}`}>{children}</span>
  );
}

export function CardTitle({ title, sub }: { title: ReactNode; sub: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col leading-[1.25]">
      <h2 className="text-[19px] font-extrabold">{title}</h2>
      <span className="text-pretty text-[13.5px] text-pewter">{sub}</span>
    </div>
  );
}

/** Status or tag pill tinted by its style. */
export function Tint({
  bg,
  ink,
  className = "",
  children,
}: {
  bg: string;
  ink: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`rounded-full font-bold ${className}`} style={{ background: bg, color: ink }}>
      {children}
    </span>
  );
}

/** Donut progress on a 36-unit viewBox whose circumference is 100. */
export function Ring({
  size,
  stroke,
  track,
  color,
  value,
  children,
}: {
  size: number;
  stroke: number;
  track: string;
  color: string;
  /** 0–1; values past 1 draw a full ring. */
  value: number;
  children: ReactNode;
}) {
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" width={size} height={size} className="block -rotate-90">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(Math.min(value, 1) * 100).toFixed(1)} 100`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Solid star, as used for scores. */
export function Star({ size, color = "#F5B829" }: { size: number; color?: string }) {
  return <LuStar size={size} fill={color} color={color} strokeWidth={0} className="flex-none" />;
}

/** Pill toggle: dark when active. */
export function chipClass(active: boolean): string {
  return active ? "border-navy bg-navy text-white" : "border-seam bg-white text-graphite";
}

/** Option inside a segmented control: raised white when active. */
export function segmentClass(active: boolean): string {
  return active
    ? "bg-white font-bold text-navy shadow-[0_1px_3px_rgba(29,35,52,.12)]"
    : "bg-transparent font-semibold text-pewter";
}
