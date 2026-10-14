import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { TODAY } from "@/data/sdo";
import { inr, inrShort, shortName } from "@/lib/format";
import { WEEKDAYS, dayLabel, dayTotal, type Period, type SoMetric, type Totals } from "./model";
import { CARD, CardHeading } from "./parts";

// Chart geometry, in viewBox units.
const W = 340;
const X0 = 8;
const XW = 324;
const BASE = 160;
const HEIGHT = 146;

/** [point index, text, highlighted] */
type Tick = [number, string, boolean?];

interface Series {
  current: number[];
  previous: number[];
  /** Slots on the x axis; the current series may stop short of the end. */
  slots: number;
  target: number;
  ticks: Tick[];
  sub: string;
  currentLabel: string;
  previousLabel: string;
  currentValue: number;
  previousValue: number;
  /** How far the current series is ahead of the previous one at the same point. */
  lead: number;
}

/** Month and week compare running totals; today and custom ranges plot daily sales. */
function buildSeries(scope: SoMetric[], period: Period, totals: Totals): Series {
  if (period.key === "month" || period.key === "week") {
    const isMonth = period.key === "month";
    const current: number[] = [];
    let sum = 0;
    for (let i = period.from; i <= period.to; i++) current.push((sum += dayTotal(scope, i)));
    const previous: number[] = [];
    sum = 0;
    const prevEnd = isMonth ? period.from - 1 : period.prevFrom + 6;
    for (let i = period.prevFrom; i <= prevEnd; i++) previous.push((sum += dayTotal(scope, i)));

    const today = period.elapsed - 1;
    const ticks: Tick[] = isMonth
      ? [
          ...[0, 6, 21, period.length - 1]
            .filter((i) => Math.abs(i - today) > 2)
            .map((i): Tick => [i, String(i + 1)]),
          [today, "Today", true],
        ]
      : WEEKDAYS.map((day, i): Tick => [i, day, i === today]);
    const last = current[current.length - 1] ?? 0;
    return {
      current,
      previous,
      slots: period.length,
      target: totals.target,
      ticks,
      sub: isMonth
        ? `${period.label} vs ${period.prevName} · cumulative`
        : "This week vs last week · cumulative",
      currentLabel: isMonth ? `${period.label} · so far` : "This week · so far",
      previousLabel: `${period.prevName} · total`,
      currentValue: last,
      previousValue: previous[previous.length - 1] ?? 0,
      lead: last - (previous[current.length - 1] || 0),
    };
  }

  // Today shows the last two weeks for context.
  const from = period.key === "today" ? TODAY - 13 : period.from;
  const to = period.to;
  const slots = to - from + 1;
  const current: number[] = [];
  for (let i = from; i <= to; i++) current.push(dayTotal(scope, i));
  const end = to === TODAY ? "Today" : dayLabel(to);
  const mid = Math.floor((slots - 1) / 2);
  return {
    current,
    previous: [],
    slots,
    target: scope.reduce((sum, m) => sum + m.so.target, 0) * (period.targetShare / period.length),
    ticks:
      slots === 1
        ? [[0, end, true]]
        : [
            [0, dayLabel(from)],
            [mid, dayLabel(from + mid)],
            [slots - 1, end, true],
          ],
    sub: period.key === "today" ? "Daily sales · last 14 days" : `Daily sales · ${period.label}`,
    currentLabel: period.key === "today" ? "Today" : "Selected range",
    previousLabel: period.prevName,
    currentValue: totals.sales,
    previousValue: totals.prev,
    lead: totals.sales - totals.prev,
  };
}

interface SalesTrendProps {
  scope: SoMetric[];
  period: Period;
  totals: Totals;
  selected: SoMetric | null;
}

export function SalesTrend({ scope, period, totals, selected }: SalesTrendProps) {
  const s = buildSeries(scope, period, totals);
  const cumulative = period.key === "month" || period.key === "week";
  const max = Math.max(s.target, ...s.current, ...s.previous, 1) * 1.1;
  const x = (i: number) => (s.slots === 1 ? X0 + XW / 2 : X0 + (i * XW) / (s.slots - 1));
  const y = (v: number) => BASE - (v / max) * HEIGHT;
  const line = (values: number[]) =>
    values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const last = s.current.length - 1;
  const currentPath = line(s.current);
  const area = s.current.length
    ? `${currentPath} L${x(last).toFixed(1)} ${BASE} L${x(0).toFixed(1)} ${BASE} Z`
    : "";
  const nowX = x(Math.max(last, 0)).toFixed(1);
  const nowY = y(s.current[last] || 0).toFixed(1);
  const targetY = y(s.target);
  const ahead = s.lead >= 0;
  const LeadIcon = ahead ? MdTrendingUp : MdTrendingDown;

  return (
    <section className={`${CARD} flex flex-col gap-3.5 p-4.5`}>
      <div className="flex items-start justify-between gap-2">
        <CardHeading
          title={`${selected ? shortName(selected.so.name) : "Team"} · Sales trend`}
          sub={s.sub}
        />
        <div
          className={`flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold ${
            ahead ? "bg-good-soft text-good-ink" : "bg-danger-soft text-[#b23a3a]"
          }`}
        >
          <LeadIcon size={17} />
          {inrShort(Math.abs(s.lead))} {ahead ? "ahead" : "behind"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[#eefaf3] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-good-ink">
            <span className="h-1 w-4 rounded-[2px] bg-good" />
            {s.currentLabel}
          </div>
          <div className="font-display text-[20px] font-bold">{inr(s.currentValue)}</div>
        </div>
        <div className="rounded-2xl bg-[#f2f2f5] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-sub">
            <span className="h-0 w-4 border-t-[3px] border-dashed border-[#a3a6b4]" />
            {s.previousLabel}
          </div>
          <div className="font-display text-[20px] font-bold">{inr(s.previousValue)}</div>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} 170`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={`${s.currentLabel}: ${inr(s.currentValue)}. ${s.previousLabel}: ${inr(s.previousValue)}.`}
        >
          <line x1={X0} x2={X0 + XW} y1={BASE} y2={BASE} stroke="#ecebe7" strokeWidth="1" />
          {s.target > 0 && (
            <>
              <line
                x1={X0}
                x2={X0 + XW}
                y1={targetY.toFixed(1)}
                y2={targetY.toFixed(1)}
                stroke="#f5b82e"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={X0 + XW}
                y={(targetY - 5).toFixed(1)}
                textAnchor="end"
                fontSize="11"
                fontWeight="700"
                fill="#b07a00"
                className="font-sans"
              >
                {cumulative ? "Target " : "Daily target "}
                {inrShort(s.target)}
              </text>
            </>
          )}
          <line
            x1={nowX}
            x2={nowX}
            y1="10"
            y2={BASE}
            stroke="#d9d7d0"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {s.previous.length > 0 && (
            <path
              d={line(s.previous)}
              fill="none"
              stroke="#a3a6b4"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinejoin="round"
            />
          )}
          <path d={area} fill="#1f9d6b" fillOpacity=".1" />
          <path
            d={currentPath}
            fill="none"
            stroke="#1f9d6b"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={nowX} cy={nowY} r="8" fill="#1f9d6b" fillOpacity=".2" />
          <circle cx={nowX} cy={nowY} r="4.5" fill="#1f9d6b" stroke="#fff" strokeWidth="2" />
        </svg>
        <div className="relative mt-1 h-[18px]" aria-hidden>
          {s.ticks.map(([i, text, strong]) => (
            <div
              key={`${i}-${text}`}
              className={`absolute -translate-x-1/2 whitespace-nowrap text-[12px] ${
                strong ? "font-bold text-good-ink" : "font-medium text-hint"
              }`}
              style={{ left: `${(x(i) / W) * 100}%` }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
