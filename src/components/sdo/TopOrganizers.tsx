"use client";

import { useEffect, useRef } from "react";
import { MdChevronLeft, MdChevronRight, MdEmojiEvents, MdMilitaryTech, MdStar } from "react-icons/md";
import { inr, inrShort, percent, shortName } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/utils";
import type { Period, SoMetric } from "./model";
import { CARD, SoAvatar } from "./parts";

const TOP_COUNT = 10;
/** One card plus the gap between cards. */
const CARD_STRIDE = 176;
const AUTO_SLIDE_MS = 3800;

interface MedalStyle {
  card: string;
  border: string;
  chip: string;
  chipText: string;
  ring: string;
}

const MEDALS: Record<number, MedalStyle> = {
  1: {
    card: "linear-gradient(180deg,#fff1c9,#fffaf0)",
    border: "#f3d27a",
    chip: "#f5b82e",
    chipText: "#4a3300",
    ring: "linear-gradient(135deg,#f5b82e,#ffe08a)",
  },
  2: {
    card: "linear-gradient(180deg,#eceff5,#fafbfd)",
    border: "#d5dae3",
    chip: "#c9ced8",
    chipText: "#2f3447",
    ring: "linear-gradient(135deg,#aeb5c2,#e3e7ee)",
  },
  3: {
    card: "linear-gradient(180deg,#fde4d2,#fff8f3)",
    border: "#efc2a0",
    chip: "#d98b52",
    chipText: "#fff",
    ring: "linear-gradient(135deg,#d98b52,#f6c9a4)",
  },
};

const PLAIN: MedalStyle = {
  card: "#fff",
  border: "#ece9e2",
  chip: "#f1efe9",
  chipText: "#4a4f63",
  ring: "#e6e3db",
};

interface TopOrganizersProps {
  /** Active organizers with sales, best first. */
  ranked: SoMetric[];
  selected: SoMetric | null;
  period: Period;
  /** Let the strip advance on its own while nobody is touching it. */
  autoplay: boolean;
  onPick: (person: string) => void;
}

export function TopOrganizers({ ranked, selected, period, autoplay, onPick }: TopOrganizersProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef(false);

  // Step one card at a time, bouncing between the ends.
  useEffect(() => {
    if (!autoplay || prefersReducedMotion()) return;
    let direction = 1;
    const timer = setInterval(() => {
      const el = stripRef.current;
      if (!el || holdRef.current) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 4) return;
      if (el.scrollLeft >= max - 4) direction = -1;
      else if (el.scrollLeft <= 4) direction = 1;
      el.scrollBy({ left: direction * CARD_STRIDE, behavior: "smooth" });
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [autoplay]);

  const slide = (direction: number) =>
    stripRef.current?.scrollBy({
      left: direction * CARD_STRIDE * 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

  const ahead = selected?.rank && selected.rank > 1 ? ranked[selected.rank - 2] : null;

  return (
    <section className={`${CARD} flex flex-col gap-3.5 py-4.5`}>
      <div className="flex items-center gap-3 px-4.5">
        <div className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-[linear-gradient(160deg,#ffd45e,#f5ad1f)] text-[#4a3300]">
          <MdEmojiEvents size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[20px] font-bold leading-[1.1]">Top 10 organizers</h2>
          <div className="text-[14px] text-dim">
            {period.label} · ranked by sales achieved · team-wide
          </div>
        </div>
        <div className="flex flex-none gap-1.5">
          {[
            { direction: -1, label: "Previous", Icon: MdChevronLeft },
            { direction: 1, label: "Next", Icon: MdChevronRight },
          ].map(({ direction, label, Icon }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => slide(direction)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#e2dfd8] bg-white text-night"
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={stripRef}
        onMouseEnter={() => (holdRef.current = true)}
        onMouseLeave={() => (holdRef.current = false)}
        onTouchStart={() => (holdRef.current = true)}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-4.5 gap-3 overflow-x-auto px-4.5 pb-2.5 pt-1.5"
      >
        {ranked.slice(0, TOP_COUNT).map((m) => {
          const medal = (m.rank && MEDALS[m.rank]) || PLAIN;
          const isSelected = selected?.so.id === m.so.id;
          return (
            <button
              key={m.so.id}
              type="button"
              onClick={() => onPick(m.so.id)}
              className="relative flex w-[164px] flex-none cursor-pointer snap-start flex-col items-center gap-1 rounded-[22px] border-[1.5px] px-2.5 pb-3 pt-3.5"
              style={{
                background: medal.card,
                borderColor: isSelected ? "#3ecf8e" : medal.border,
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(62,207,142,.35)"
                  : "0 4px 14px rgba(30,32,50,.05)",
              }}
            >
              <div
                className="absolute left-2.5 top-2.5 flex size-[26px] items-center justify-center rounded-full font-display text-[14px] font-bold"
                style={{ background: medal.chip, color: medal.chipText }}
              >
                {m.rank}
              </div>
              {m.rank === 1 && (
                <MdMilitaryTech size={22} className="absolute right-2.5 top-2 text-sun" />
              )}
              <div className="mt-1 size-[74px] rounded-full p-[3px]" style={{ background: medal.ring }}>
                <SoAvatar so={m.so} className="size-full border-[3px] border-white text-[22px]" />
              </div>
              <div className="mt-1 text-[15px] font-semibold text-body">{shortName(m.so.name)}</div>
              <div className="font-display text-[22px] font-extrabold leading-none text-ink">
                {inrShort(m.sales)}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="flex items-center gap-0.5 text-[13px] font-bold text-body">
                  <MdStar size={17} className="text-sun" />
                  {m.stars}
                </span>
                <span className="rounded-lg bg-good-soft px-[7px] py-px text-[13px] font-bold text-good-ink">
                  {percent(m.pct)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mx-4.5 flex items-center gap-3 rounded-[20px] border-[1.5px] border-[#9be3c0] bg-[#effaf4] px-3.5 py-2.5">
          <div className="flex-none rounded-xl bg-night px-2.5 py-1.5 font-display text-[18px] font-extrabold text-spring">
            {selected.rank ? `#${selected.rank}` : "—"}
          </div>
          <SoAvatar so={selected.so} className="size-10 border-2 border-white text-[14px]" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[16px] font-bold leading-[1.1]">{selected.so.name}</div>
            <div className="text-[13px] font-semibold text-good-ink">
              {!selected.rank
                ? `Not ranked · no sales ${period.when}`
                : ahead
                  ? `↑ ${inr(ahead.sales - selected.sales + 50)} to reach #${selected.rank - 1}`
                  : "Leading the team"}
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="font-display text-[17px] font-bold">{inr(selected.sales)}</div>
            <div className="text-[12px] text-dim">
              {percent(selected.pct)} · ★ {selected.stars}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
