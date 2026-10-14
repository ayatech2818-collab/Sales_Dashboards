import { inrShort, percent } from "@/lib/format";
import {
  CATEGORIES,
  PERF_FILTER,
  type Category,
  type CategoryStyle,
  type PerfFilter,
  type Period,
  type SoMetric,
  type Totals,
} from "./model";
import { CARD, CardHeading } from "./parts";

/** Bars top out at this share of target, so 100% sits two thirds up. */
const BAR_CEILING = 1.5;

interface TeamBreakdownProps {
  totals: Totals;
  period: Period;
  /** Organizers passing the current filters. */
  filtered: SoMetric[];
  cats: Record<Category, CategoryStyle>;
  perf: PerfFilter;
  isFiltered: boolean;
  /** Toggle a performance filter from its category tile. */
  onPerf: (perf: PerfFilter) => void;
  onPick: (person: string) => void;
}

export function TeamBreakdown({
  totals,
  period,
  filtered,
  cats,
  perf,
  isFiltered,
  onPerf,
  onPick,
}: TeamBreakdownProps) {
  const pct = totals.pct * 100;
  const paceShare = period.elapsed / period.length;
  const bars = filtered.slice().sort((a, b) => b.pct - a.pct);

  return (
    <section className={`${CARD} flex flex-col gap-4 p-4.5`}>
      <CardHeading
        title="Team performance"
        sub={`${period.label} · ${totals.count} SOs${isFiltered ? " (filtered)" : ""}`}
      />

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px] font-semibold text-sub">
          <span>Actual vs target</span>
          <span>
            <span className="font-bold text-ink">{inrShort(totals.sales)}</span> /{" "}
            {inrShort(totals.target)}
          </span>
        </div>
        <div className="relative h-3.5 rounded-full bg-well">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#1f9d6b,#3ecf8e)] transition-[width] duration-700"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
          {paceShare < 1 && (
            <div
              className="absolute -top-1 h-[22px] w-0.5 rounded-[2px] bg-night"
              style={{ left: `${paceShare * 100}%` }}
            />
          )}
        </div>
        <div className="text-[12px] text-hint">
          {paceShare < 1
            ? `Marker = expected pace today (${inrShort(totals.expected)}). Team is at ${Math.round(totals.pace * 100)}% of pace.`
            : `Period complete · ${Math.round(pct)}% of target achieved.`}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-well">
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="transition-[width] duration-600"
              style={{
                width: `${totals.count ? (totals.counts[cat] / totals.count) * 100 : 0}%`,
                background: cats[cat].color,
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const style = cats[cat];
            const filter = PERF_FILTER[cat];
            const on = perf === filter;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={on}
                onClick={() => onPerf(on ? "all" : filter)}
                className="flex cursor-pointer flex-col gap-0.5 rounded-2xl border-[1.5px] px-3 py-2.5 text-left"
                style={{ background: style.soft, borderColor: on ? style.color : "transparent" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="size-[9px] rounded-full" style={{ background: style.color }} />
                  <span className="text-[13px] font-bold" style={{ color: style.color }}>
                    {style.label}
                  </span>
                </div>
                <div className="font-display text-[24px] font-bold leading-[1.05] text-ink">
                  {totals.counts[cat]}{" "}
                  <span className="font-sans text-[13px] font-semibold text-dim">SOs</span>
                </div>
                <div className="text-[11px] text-dim">{style.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px] font-semibold text-sub">
          <span>Individual achievement</span>
          <span className="text-[12px] text-hint">tap a bar to open</span>
        </div>
        <div className="relative flex h-[110px] items-end gap-[3px] pt-1">
          <div className="absolute inset-x-0 bottom-[66.6%] border-t-[1.5px] border-dashed border-sun" />
          <div className="absolute bottom-[66.6%] right-0 -translate-y-0.5 text-[10px] font-bold text-[#b07a00]">
            100%
          </div>
          {bars.map((m) => {
            const title = `${m.so.name} · ${percent(m.pct)}`;
            return (
              <button
                key={m.so.id}
                type="button"
                title={title}
                aria-label={title}
                onClick={() => onPick(m.so.id)}
                className="min-w-1 flex-1 cursor-pointer rounded-[5px_5px_2px_2px] transition-[height] duration-600"
                style={{
                  height: `${Math.max(2, Math.min(m.pct / BAR_CEILING, 1) * 100)}%`,
                  background: cats[m.cat].color,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
