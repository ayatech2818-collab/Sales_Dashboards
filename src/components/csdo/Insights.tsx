import { useState } from "react";
import type { IconType } from "react-icons";
import { LuTrendingUp, LuTriangleAlert, LuTrophy, LuUsers } from "react-icons/lu";
import type { Insight, InsightIcon, InsightTone } from "./model";

const ICONS: Record<InsightIcon, IconType> = {
  trophy: LuTrophy,
  trend: LuTrendingUp,
  alert: LuTriangleAlert,
  users: LuUsers,
};

const TONES: Record<InsightTone, { bg: string; bd: string; tile: string; tileInk: string; ink: string }> = {
  gold: { bg: "#FFF7E1", bd: "#F6E3B4", tile: "#F5B829", tileInk: "#3B2A00", ink: "#8A5A00" },
  green: { bg: "#EAF7F0", bd: "#CBEBD9", tile: "#1FA971", tileInk: "#FFFFFF", ink: "#11734A" },
  orange: { bg: "#FFF2E4", bd: "#F8DDBF", tile: "#E08A1E", tileInk: "#FFFFFF", ink: "#9A5300" },
  plum: { bg: "#F8EEF6", bd: "#EBD3E5", tile: "#8E3479", tileInk: "#FFFFFF", ink: "#8E3479" },
  indigo: { bg: "#EFEFFC", bd: "#D9D7F6", tile: "#4B3FC7", tileInk: "#FFFFFF", ink: "#4B3FC7" },
  blue: { bg: "#EBF2FD", bd: "#CFE0FA", tile: "#2F80ED", tileInk: "#FFFFFF", ink: "#1F5FBF" },
};

/** Swipeable milestone and attention cards with a position indicator. */
export function Insights({ items }: { items: Insight[] }) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const current = Math.min(index, items.length - 1);

  return (
    <section aria-label="Milestones" className="flex flex-col gap-2">
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          if (!card) return;
          const i = Math.round(el.scrollLeft / (card.offsetWidth + 10));
          if (i !== index) setIndex(i);
        }}
        className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto p-px"
      >
        {items.map((m) => {
          const tone = TONES[m.tone];
          const Icon = ICONS[m.icon];
          return (
            <div
              key={m.kicker}
              className="flex flex-[0_0_86%] snap-start items-start gap-3 rounded-[20px] border p-3.5 md:flex-[0_0_calc((100%-20px)/3)]"
              style={{ background: tone.bg, borderColor: tone.bd }}
            >
              <span
                className="flex size-10 flex-none items-center justify-center rounded-xl"
                style={{ background: tone.tile, color: tone.tileInk }}
              >
                <Icon size={19} />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold tracking-[.1em]" style={{ color: tone.ink }}>
                  {m.kicker}
                </span>
                <span className="text-pretty text-[15px] font-bold leading-[1.3] text-navy">{m.title}</span>
                <span className="text-[13px] leading-[1.35] text-steel">{m.body}</span>
              </div>
            </div>
          );
        })}
      </div>
      {items.length > 1 && (
        <div className="flex justify-center gap-1.25">
          {items.map((m, i) => (
            <span
              key={m.kicker}
              className={`h-1.5 rounded-full transition-[width] ${i === current ? "w-4.5 bg-navy" : "w-1.5 bg-ash"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
