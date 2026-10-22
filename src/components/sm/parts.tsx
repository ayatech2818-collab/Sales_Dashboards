import type { CSSProperties, ReactNode } from "react";
import { LuStar } from "react-icons/lu";
import { avatar } from "./model";

/** Shared executive white card surface with border and elevation shadow */
export const PANEL = "border border-[#ece9e2] bg-white shadow-panel";

export function Avatar({
  person,
  ring,
  className = "",
  style,
}: {
  person: { id: string; name: string };
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
          ? `0 0 0 ${ring.gap}px #FFFFFF, 0 0 0 ${ring.gap + ring.width}px ${ring.color}`
          : undefined,
        ...style,
      }}
    >
      {a.initials}
    </span>
  );
}

export function IdPill({ id }: { id: string }) {
  return (
    <span className="rounded-full bg-pill px-2 py-0.75 font-mono text-[11px] font-medium text-[#5b6070]">
      {id}
    </span>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-[11px] font-bold tracking-[.12em] text-fog ${className}`}>
      {children}
    </span>
  );
}

export function CardTitle({ title, sub }: { title: ReactNode; sub: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col leading-tight">
      <h2 className="text-[19px] font-extrabold text-navy">{title}</h2>
      <span className="text-pretty text-[13.5px] text-pewter">{sub}</span>
    </div>
  );
}

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
    <span
      className={`rounded-full font-bold ${className}`}
      style={{ background: bg, color: ink }}
    >
      {children}
    </span>
  );
}

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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function Star({ size, color = "#F5B829" }: { size: number; color?: string }) {
  return <LuStar size={size} fill={color} color={color} strokeWidth={0} className="flex-none" />;
}

export function chipClass(active: boolean): string {
  return active ? "border-navy bg-navy text-white" : "border-seam bg-white text-graphite";
}

export function segmentClass(active: boolean): string {
  return active
    ? "bg-white font-bold text-navy shadow-[0_1px_3px_rgba(29,35,52,.12)]"
    : "bg-transparent font-semibold text-pewter";
}
