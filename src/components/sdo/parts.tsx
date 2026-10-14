import type { CSSProperties, ReactNode } from "react";
import type { SalesOrganizer } from "@/data/sdo";
import { initials } from "@/lib/format";
import { avatarColors } from "./model";

/** White, rounded surface shared by the dashboard's main cards. */
export const CARD = "rounded-[28px] bg-white shadow-card";

/** Initials on the organizer's pastel tint; size and font size come from `className`. */
export function SoAvatar({
  so,
  className = "",
  style,
}: {
  so: SalesOrganizer;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-bold ${className}`}
      style={{ ...avatarColors(so), ...style }}
    >
      {initials(so.name)}
    </div>
  );
}

/** Small uppercase label above a control group. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-bold tracking-[.08em] text-hint">{children}</div>
  );
}

export function CardHeading({ title, sub }: { title: ReactNode; sub: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-[20px] font-bold leading-[1.1]">{title}</h2>
      <div className="text-[14px] text-dim">{sub}</div>
    </div>
  );
}
