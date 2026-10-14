"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import type { HomeData } from "@/data/home";
import { monotonePath, valueAt } from "@/lib/chart";
import { inr, inrShort } from "@/lib/format";
import { clamp } from "@/lib/utils";

// Plot geometry in px. The size is measured; the design draws it at 332 × 160.
const DESIGN_WIDTH = 332;
const DESIGN_HEIGHT = 160;
const X_INSET = 6;
/** Room above the plot, and below the baseline for the day labels. */
const TOP_INSET = 16;
const AXIS_HEIGHT = 28;
const TIP_WIDTH = 132;

interface EarningsCardProps {
  period: HomeData["period"];
  chart: HomeData["chart"];
  target: number;
  /** Where the figure settles. */
  earnings: number;
  /** The figure as currently animated. */
  shown: number;
  /** 0→1 entrance progress; grows last month's line in. */
  intro: number;
  /** Placement within the page layout. */
  className?: string;
}

export function EarningsCard({
  period,
  chart,
  target,
  earnings,
  shown,
  intro,
  className = "",
}: EarningsCardProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [{ width, height }, setSize] = useState({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
  });
  const [scrubDay, setScrubDay] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { days, today } = period;
  const xSpan = width - X_INSET * 2;
  const baselineY = height - AXIS_HEIGHT;
  const plotHeight = baselineY - TOP_INSET;
  // Leave headroom above the target line.
  const yMax = (target * 11) / 10;
  const xOf = (day: number) => X_INSET + (day / days) * xSpan;
  const yOf = (amount: number) =>
    baselineY - (Math.min(amount, yMax) / yMax) * plotHeight;

  // The current series was sampled at `sampled`; rescale it to the live figure.
  const sampled = chart.current[chart.current.length - 1][1];
  const previousPts = chart.previous.map(
    ([day, amount]) => [xOf(day), yOf(amount * intro)] as const,
  );
  const currentPts = chart.current.map(
    ([day, amount]) => [xOf(day), yOf((amount * shown) / sampled)] as const,
  );
  const currentPath = monotonePath(currentPts);
  const [lastX, lastY] = currentPts[currentPts.length - 1];
  const areaPath = `${currentPath} L${lastX.toFixed(1)} ${baselineY} L${currentPts[0][0].toFixed(1)} ${baselineY} Z`;

  const xToday = xOf(today);
  const previousToday = valueAt(chart.previous, today);
  const delta = earnings - previousToday;
  const ahead = delta >= 0;
  const TrendIcon = ahead ? MdTrendingUp : MdTrendingDown;

  const scrubX = scrubDay == null ? 0 : xOf(scrubDay);
  const scrubCurrent =
    scrubDay != null && scrubDay <= today
      ? (valueAt(chart.current, scrubDay) * earnings) / sampled
      : null;
  const scrubPrevious =
    scrubDay == null ? 0 : valueAt(chart.previous, scrubDay);

  const onScrub = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const x = e.clientX - rect.left;
    const day = Math.round(((x - X_INSET) / (rect.width - X_INSET * 2)) * days);
    setScrubDay(clamp(day, 1, days));
  };

  return (
    <section
      className={`flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(29,32,51,.05),0_10px_26px_-16px_rgba(29,32,51,.25)] ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-[19px] font-bold leading-[1.1]">
            Earnings
          </h2>
          <div className="text-[13px] font-medium leading-[1.2] text-subtle">
            {period.month} vs {period.previousMonth}
          </div>
        </div>
        <span
          className={`inline-flex flex-none items-center gap-[3px] rounded-full pb-[5px] pl-2 pr-2.5 pt-1.5 text-[12.5px] font-semibold leading-none ${
            ahead ? "bg-[#E3F8EE] text-forest" : "bg-[#FFF1D6] text-bronze"
          }`}
        >
          <TrendIcon size={16} className="flex-none" />
          {inr(Math.abs(delta))} {ahead ? "ahead" : "behind"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-[5px] rounded-[14px] bg-[#EFFAF5] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-forest">
            <span className="h-[3px] w-3.5 flex-none rounded-[2px] bg-leaf" />
            {period.month} · so far
          </div>
          <div className="font-display text-xl font-extrabold leading-[1.05]">
            {inr(shown)}
          </div>
        </div>
        <div className="flex flex-col gap-[5px] rounded-[14px] bg-[#F3F4F8] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-muted">
            <span className="h-0 w-3.5 flex-none border-t-[3px] border-dashed border-silver" />
            {period.previousMonth} · total
          </div>
          <div className="font-display text-xl font-extrabold leading-[1.05]">
            {inr(chart.previousTotal)}
          </div>
        </div>
      </div>

      <div
        ref={plotRef}
        onPointerMove={onScrub}
        onPointerDown={onScrub}
        onPointerLeave={() => setScrubDay(null)}
        className="relative h-40 cursor-crosshair touch-pan-y md:h-auto md:min-h-40 md:flex-1"
      >
        {/* Out of flow, so the measured height never feeds back into the layout. */}
        <svg
          width={width}
          height={height}
          className="absolute left-0 top-0 overflow-visible"
        >
          <line
            x1={0}
            x2={width}
            y1={yOf(target / 2)}
            y2={yOf(target / 2)}
            className="stroke-ink/8 stroke-1"
          />
          <line
            x1={0}
            x2={width}
            y1={baselineY}
            y2={baselineY}
            className="stroke-ink/14 stroke-1"
          />
          <line
            x1={0}
            x2={width}
            y1={yOf(target)}
            y2={yOf(target)}
            strokeDasharray="4 4"
            className="stroke-honey stroke-[1.5px]"
          />
          <line
            x1={xToday}
            x2={xToday}
            y1={10}
            y2={baselineY}
            strokeDasharray="3 3"
            className="stroke-ink/18 stroke-1"
          />
          <path d={areaPath} className="fill-mint/16" />
          <path
            d={monotonePath(previousPts)}
            strokeDasharray="5 5"
            strokeLinecap="round"
            className="fill-none stroke-silver stroke-[2.5px]"
          />
          <path
            d={currentPath}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="fill-none stroke-leaf stroke-[3px]"
          />
          <circle
            cx={xToday}
            cy={yOf(previousToday * intro)}
            r={4}
            className="fill-silver stroke-white stroke-2"
          />
          <circle
            cx={xToday}
            cy={lastY}
            r={10}
            className="origin-center animate-dot-pulse fill-mint/35 [transform-box:fill-box] motion-reduce:hidden"
          />
          <circle
            cx={xToday}
            cy={lastY}
            r={5}
            className="fill-leaf stroke-white stroke-[2.5px]"
          />
          {scrubDay != null && (
            <>
              <line
                x1={scrubX}
                x2={scrubX}
                y1={10}
                y2={baselineY}
                className="stroke-ink stroke-1"
              />
              <circle
                cx={scrubX}
                cy={yOf(scrubPrevious)}
                r={4}
                className="fill-white stroke-silver stroke-[2.5px]"
              />
              {scrubCurrent != null && (
                <circle
                  cx={scrubX}
                  cy={yOf(scrubCurrent)}
                  r={4.5}
                  className="fill-white stroke-leaf stroke-[3px]"
                />
              )}
            </>
          )}
        </svg>

        <div
          className="pointer-events-none absolute right-0 text-[11px] font-semibold leading-none text-bronze"
          style={{ top: yOf(target) - 15 }}
        >
          Target {inrShort(target)}
        </div>
        <div
          className="pointer-events-none absolute left-0 text-[11px] font-medium leading-none text-subtle"
          style={{ top: yOf(target / 2) - 15 }}
        >
          {inrShort(target / 2)}
        </div>
        {[...new Set([1, 8, 15, today, days])].map((day) => (
          <span
            key={day}
            className={`pointer-events-none absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none ${
              day === today ? "font-bold text-forest" : "font-medium text-subtle"
            }`}
            style={{ left: xOf(day) }}
          >
            {day === today ? "Today" : day}
          </span>
        ))}

        {scrubDay != null && (
          <div
            className="pointer-events-none absolute -top-2 w-[132px] rounded-xl bg-ink px-2.5 py-2 text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,.5)]"
            style={{
              left: clamp(scrubX - TIP_WIDTH / 2, 0, width - TIP_WIDTH),
            }}
          >
            <div className="text-[11px] font-semibold leading-[1.1] text-white/66">
              Day {scrubDay}
            </div>
            <div className="mt-[5px] flex justify-between text-[12.5px] font-semibold leading-[1.2]">
              <span className="text-mint">{period.monthShort}</span>
              <span>
                {scrubCurrent == null
                  ? "—"
                  : inr(Math.round(scrubCurrent / 100) * 100)}
              </span>
            </div>
            <div className="mt-0.5 flex justify-between text-[12.5px] font-semibold leading-[1.2]">
              <span className="text-[#B9BDCB]">{period.previousMonthShort}</span>
              <span>{inr(Math.round(scrubPrevious / 100) * 100)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
