import type { ReactNode } from "react";
import { MdPayments, MdStar, MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { inrShort, shortName } from "@/lib/format";
import { dayTotal, type Period, type SoMetric, type Thresholds, type Totals } from "./model";

/** Circumference of the r=22 achievement ring. */
const RING = 138.23;
const SPARK_DAYS = 14;

function KpiCard({
  label,
  tag,
  className = "",
  children,
}: {
  label: ReactNode;
  tag: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-[22px] bg-white p-3.5 shadow-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-[1.25] text-sub">
          {label}
        </div>
        <div className="flex-none text-[10px] font-bold tracking-[.08em] text-hint">{tag}</div>
      </div>
      {children}
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return <div className="font-display text-[26px] font-bold leading-[1.15]">{children}</div>;
}

/** "/ 24" trailing a value. */
function OutOf({ children }: { children: ReactNode }) {
  return <div className="text-[15px] font-semibold text-hint">/ {children}</div>;
}

interface KpiGridProps {
  totals: Totals;
  period: Period;
  /** Whatever the KPIs describe: the selected organizer, or the filtered team. */
  scope: SoMetric[];
  selected: SoMetric | null;
  /** Ranked organizers, for the selected organizer's rank. */
  rankedCount: number;
  thresholds: Thresholds;
}

export function KpiGrid({ totals, period, scope, selected, rankedCount, thresholds }: KpiGridProps) {
  const tag = selected ? "SO" : "TEAM";

  // Daily sales over the last two weeks of the period.
  const daily: number[] = [];
  for (let i = Math.max(0, period.to - SPARK_DAYS + 1); i <= period.to; i++) {
    daily.push(dayTotal(scope, i));
  }
  const peak = Math.max(1, ...daily);
  const spark = daily
    .map((v, i) => {
      const x = ((i * 120) / Math.max(daily.length - 1, 1)).toFixed(1);
      const y = (30 - (v / peak) * 26).toFixed(1);
      return `${i ? "L" : "M"}${x} ${y}`;
    })
    .join(" ");

  const up = totals.sales >= totals.prev;
  const TrendIcon = up ? MdTrendingUp : MdTrendingDown;
  const delta = totals.prev
    ? `${up ? "+" : ""}${Math.round(((totals.sales - totals.prev) / totals.prev) * 100)}% vs ${period.prevLabel}`
    : `No data for ${period.prevLabel}`;

  const avg = selected ? selected.pace : totals.avgPct;
  const avgColor =
    avg * 100 >= thresholds.onTrackPace
      ? "#1f9d6b"
      : avg * 100 >= thresholds.attentionPace
        ? "#e0a127"
        : "#d14b4b";

  const rating = selected ? selected.so.rating : totals.avgRating;
  const filledStars = Math.round(rating);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
      <KpiCard label="Total sales" tag={tag}>
        <Value>{inrShort(totals.sales)}</Value>
        <svg viewBox="0 0 120 32" preserveAspectRatio="none" className="h-7 w-full">
          <path d={`${spark} L120 32 L0 32 Z`} fill="#e5f7ee" />
          <path
            d={spark}
            fill="none"
            stroke="#1f9d6b"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          className={`flex items-center gap-[3px] text-[12px] font-bold ${up ? "text-good" : "text-danger"}`}
        >
          <TrendIcon size={16} className="flex-none" />
          <span className="leading-[1.25]">{delta}</span>
        </div>
      </KpiCard>

      <KpiCard label="Total earnings" tag={tag}>
        <Value>{inrShort(totals.earnings)}</Value>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="flex size-[30px] flex-none items-center justify-center rounded-[10px] bg-sun-soft text-[#b07a00]">
            <MdPayments size={18} />
          </div>
          <div className="text-[12px] leading-[1.25] text-sub">
            {selected
              ? `Earnings for ${shortName(selected.so.name)} · INR`
              : `Sum across ${totals.count} SOs · INR`}
          </div>
        </div>
      </KpiCard>

      {selected ? (
        <KpiCard label="Team rank" tag="SO">
          <Value>{selected.rank ? `#${selected.rank}` : "—"}</Value>
          <div className="text-[12px] text-sub">
            {selected.rank
              ? `of ${rankedCount} ranked SOs · by sales`
              : `Not ranked · no sales ${period.when}`}
          </div>
        </KpiCard>
      ) : (
        <KpiCard label="Active SOs" tag="TEAM">
          <div className="flex items-baseline gap-1">
            <Value>{totals.active}</Value>
            <OutOf>{totals.count}</OutOf>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-well">
            <div
              className="h-full rounded-full bg-[#2f6fd6] transition-[width] duration-600"
              style={{ width: `${totals.count ? (totals.active / totals.count) * 100 : 0}%` }}
            />
          </div>
          <div className="text-[12px] text-sub">
            {totals.idle
              ? `${totals.idle} active with no sales ${period.when}`
              : "Everyone active has recorded sales"}
          </div>
        </KpiCard>
      )}

      <KpiCard label={selected ? "Pace vs expected" : "Avg achievement"} tag={tag}>
        <div className="flex items-center gap-2.5">
          <div className="relative size-14 flex-none">
            <svg viewBox="0 0 56 56" width="56" height="56" className="-rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#efede8" strokeWidth="7" />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={avgColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={(RING * (1 - Math.min(avg, 1))).toFixed(2)}
                className="transition-[stroke-dashoffset] duration-800"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display text-[14px] font-bold">
              {Math.round(avg * 100)}%
            </div>
          </div>
          <div className="min-w-0 flex-1 text-[12px] leading-[1.3] text-sub">
            {selected
              ? `Expected ${inrShort(selected.expected)} by today`
              : `Mean target % of ${totals.count} SOs`}
          </div>
        </div>
      </KpiCard>

      <KpiCard
        label={selected ? "Performance score" : "Team rating"}
        tag={tag}
        className="col-span-full"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-baseline gap-1">
            <Value>{rating.toFixed(1)}</Value>
            <OutOf>5</OutOf>
          </div>
          <div className="flex gap-px" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <MdStar key={i} size={22} color={i < filledStars ? "#f5b82e" : "#e6e3db"} />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-sun-soft px-2.5 py-[3px] text-[13px] font-bold text-[#8a5a00]">
            <MdStar size={16} className="text-sun" />
            <span className="whitespace-nowrap">
              {totals.stars.toLocaleString("en-IN")} stars earned
            </span>
          </div>
        </div>
        <div className="text-[12px] text-hint">
          {selected
            ? "Manager + customer score on a 1–5 scale"
            : `Average of ${totals.count} SOs on a 1–5 scale · 1 star earned per ₹1,000 sold`}
        </div>
      </KpiCard>
    </div>
  );
}
