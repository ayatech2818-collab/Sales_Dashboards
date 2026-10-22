import type { ReactNode } from "react";
import type { SmScope } from "@/data/sm";
import { inr, inrShort, percent } from "@/lib/format";
import { STATUS, VIEW_TAG, plural, type SmAnalysis } from "./model";
import { PANEL, Ring, Star } from "./parts";

function Kpi({
  label,
  tag,
  tagClass = "text-fog",
  gap = "gap-1",
  wide = false,
  children,
}: {
  label: string;
  tag: string;
  tagClass?: string;
  gap?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-[20px] p-3.5 ${gap} ${PANEL} ${
        wide ? "col-span-full" : "min-h-30"
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[13px] font-semibold text-steel">{label}</span>
        <span className={`text-[10.5px] font-bold tracking-widest ${tagClass}`}>{tag}</span>
      </div>
      {children}
    </div>
  );
}

const VALUE = "text-[26px] font-extrabold leading-[1.1] text-navy";
const NOTE = "text-[12.5px] text-pewter";

function sparkline(daily: number[]): { line: string; area: string } | null {
  const n = daily.length;
  if (n < 2) return null;
  const smooth = daily.map((v, i) => (v + (daily[i - 1] || 0) + (daily[i + 1] || 0)) / 3);
  const max = Math.max(...smooth, 1);
  const line = smooth
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (n - 1)) * 120).toFixed(1)} ${(28 - (v / max) * 24).toFixed(1)}`
    )
    .join(" ");
  return { line, area: `${line} L120 30 L0 30 Z` };
}

export function KpiGrid({
  scope,
  an,
  className = "",
}: {
  scope: SmScope;
  an: SmAnalysis;
  className?: string;
}) {
  const { view, range, totals: A, so, csdo, inViewSos } = an;
  const tag = VIEW_TAG[view];
  const hasTarget = A.target > 0;
  const spark = sparkline(A.daily);
  const delta =
    range.prev && A.prevSales > 0 ? (A.sales - A.prevSales) / A.prevSales : null;

  const directCount = inViewSos.filter((m) => m.isDirect).length;

  // CSDO health metrics
  const csdosExcellent = an.csdos.filter((c) => c.status === "excellent").length;
  const csdosOnTrack = an.csdos.filter((c) => c.status === "on").length;
  const csdosRisk = an.csdos.filter((c) => c.status === "risk" || c.status === "needs").length;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {/* 1. Total Sales with Sparkline */}
      <Kpi label="Total sales" tag={tag}>
        <span className={VALUE}>{inrShort(A.sales)}</span>
        {delta !== null && (
          <span
            className={`text-[12.5px] font-semibold ${
              delta >= 0 ? "text-pine" : "text-brick"
            }`}
          >
            {delta >= 0 ? "▲ " : "▼ "}
            {Math.abs(Math.round(delta * 100))}% vs {range.prevLabel}
          </span>
        )}
        {spark && (
          <svg viewBox="0 0 120 30" className="mt-auto block h-auto w-full">
            <path d={spark.area} fill="#E0F2FE" />
            <path
              d={spark.line}
              fill="none"
              stroke="#0284C7"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}
      </Kpi>

      {/* 2. Total Target & Expected */}
      <Kpi label="Total target" tag={tag}>
        <span className={VALUE}>{inrShort(A.target)}</span>
        <span className={NOTE}>Due by today: {inrShort(A.expected)}</span>
        <div className="relative mt-auto h-2 rounded-full bg-well">
          <div
            className="h-full rounded-full bg-[#38bdf8]"
            style={{ width: `${Math.min(range.elapsed, 1) * 100}%` }}
          />
        </div>
        <span className="text-[11.5px] text-fog">
          {range.open
            ? `${Math.round(range.elapsed * 100)}% of period elapsed`
            : "Period closed"}
        </span>
      </Kpi>

      {/* 3. Target Achievement */}
      <Kpi label="Target achievement" tag={tag} gap="gap-1.5">
        <div className="flex items-center gap-2.5">
          <Ring
            size={56}
            stroke={4}
            track="#EFEDE8"
            color={A.status ? STATUS[A.status].dot : "#C9CED8"}
            value={A.ach}
          >
            <span className="text-[13.5px] font-extrabold text-navy">
              {hasTarget ? percent(A.ach) : "—"}
            </span>
          </Ring>
          <span className="text-[12.5px] leading-[1.3] text-pewter">
            {hasTarget
              ? `${percent(A.pace)} of pace due · ${A.status ? STATUS[A.status].label : ""}`
              : "No target in view"}
          </span>
        </div>
      </Kpi>

      {/* 4. Earnings Distributed */}
      <Kpi label="Earnings distributed" tag={tag}>
        <span className={VALUE}>{inrShort(A.earn)}</span>
        <span className={`mt-auto flex items-center gap-2 ${NOTE}`}>
          <span className="flex size-6.5 flex-none items-center justify-center rounded-lg bg-[#fff3dc] text-[14px] font-extrabold text-bronze">
            ₹
          </span>
          {view === "so"
            ? "Reported for this SO"
            : `Across ${plural(A.n, "SO")} in view`}
        </span>
      </Kpi>

      {/* 5. Detail / Demographic Breakdown */}
      {so ? (
        <>
          <Kpi label="Enrolments" tag="INDIVIDUAL SO">
            <span className={VALUE}>{so.count}</span>
            <span className={`mt-auto ${NOTE}`}>
              {so.count
                ? `Avg ${inr(so.sales / so.count)} per enrolment`
                : "No enrolments this period"}
            </span>
          </Kpi>
          <Kpi label="Performance score" tag="INDIVIDUAL SO">
            <span className={`flex items-baseline gap-1 ${VALUE}`}>
              {so.rating.toFixed(1)}
              <span className="text-[14px] font-semibold text-pewter">/ 5</span>
            </span>
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  color={so.rating >= i - 0.25 ? "#F5B829" : "#ECE9E2"}
                />
              ))}
            </span>
            <span className={`mt-auto ${NOTE}`}>
              Rank #{an.soRank} of {an.allSos.length} in zone
            </span>
          </Kpi>
        </>
      ) : csdo ? (
        <>
          <Kpi label="Regional SOs" tag="CSDO REGION" gap="gap-1.5">
            <span className={VALUE}>
              {csdo.n}
              <span className="text-[14px] font-semibold text-pewter"> total SOs</span>
            </span>
            <div className="mt-auto flex flex-col gap-0.5 text-[12.5px]">
              <span className="flex justify-between text-iris">
                <span>CSDO Direct</span>
                <b>{csdo.directSos.length}</b>
              </span>
              <span className="flex justify-between text-plum">
                <span>Across {csdo.sdos.length} SDOs</span>
                <b>{csdo.allSos.length - csdo.directSos.length}</b>
              </span>
            </div>
          </Kpi>
          <Kpi label="Avg SO achievement" tag="CSDO REGION" gap="gap-1.5">
            <div className="flex items-center gap-2.5">
              <Ring size={56} stroke={4} track="#EFEDE8" color="#E08A1E" value={csdo.avgAch}>
                <span className="text-[13.5px] font-extrabold text-navy">
                  {csdo.n ? percent(csdo.avgAch) : "—"}
                </span>
              </Ring>
              <span className="text-[12.5px] leading-[1.3] text-pewter">
                Unweighted mean target % across this region
              </span>
            </div>
          </Kpi>
        </>
      ) : (
        <>
          <Kpi label="Workforce deployed" tag={tag} gap="gap-1.5">
            <span className={VALUE}>
              {A.n}
              <span className="text-[14px] font-semibold text-pewter"> active SOs</span>
            </span>
            <div className="mt-auto flex flex-col gap-0.5 text-[12.5px]">
              <span className="flex justify-between text-[#15803D]">
                <span>CSDO Regions</span>
                <b>{scope.csdos.length}</b>
              </span>
              <span className="flex justify-between text-plum">
                <span>SDO Field Teams</span>
                <b>{scope.sdos.length}</b>
              </span>
              <span className="flex justify-between text-iris">
                <span>CSDO-Direct SOs</span>
                <b>{directCount}</b>
              </span>
            </div>
          </Kpi>

          <Kpi label="CSDO Regional Health" tag="EXECUTIVE" gap="gap-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className={VALUE}>{csdosOnTrack + csdosExcellent}</span>
              <span className="text-[14px] font-semibold text-pewter">
                of {scope.csdos.length} regions on track
              </span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full mt-1">
              <span
                style={{ width: `${(csdosExcellent / scope.csdos.length) * 100}%` }}
                className="bg-leaf"
                title="Excellent"
              />
              <span
                style={{ width: `${(csdosOnTrack / scope.csdos.length) * 100}%` }}
                className="bg-[#2F80ED]"
                title="On Track"
              />
              <span
                style={{ width: `${(csdosRisk / scope.csdos.length) * 100}%` }}
                className="bg-[#E5484D]"
                title="Needs attention / at risk"
              />
            </div>
            <span className="mt-auto text-[11.5px] text-pewter">
              {csdosRisk > 0
                ? `${csdosRisk} CSDO region requires attention`
                : "All CSDO regions performing healthy"}
            </span>
          </Kpi>
        </>
      )}
    </div>
  );
}

export function CoachingCard({ an }: { an: SmAnalysis }) {
  if (an.visitsDue <= 0 || an.view === "so") return null;

  return (
    <div
      className={`flex flex-col justify-between gap-2.5 rounded-[22px] p-4 ${PANEL}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-steel">
          Field coaching compliance
        </span>
        <span className="rounded-full bg-plum-soft px-2.5 py-0.75 text-[10.5px] font-bold tracking-wider text-plum">
          STATE COMPLIANCE
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-extrabold leading-[1.1] text-navy">
            {an.visitsDone}
          </span>
          <span className="text-[13.5px] font-semibold text-pewter">
            of {an.visitsDue} scheduled visits completed
          </span>
        </div>
        <span className="text-[13.5px] font-extrabold text-plum">
          {an.visitsDue ? percent(an.visitsDone / an.visitsDue) : "0%"}
        </span>
      </div>

      <div className="h-2 rounded-full bg-well">
        <div
          className="h-full rounded-full bg-plum transition-all"
          style={{
            width: `${an.visitsDue ? Math.min(an.visitsDone / an.visitsDue, 1) * 100 : 0}%`,
          }}
        />
      </div>

      <span className="text-[12px] text-pewter leading-snug">
        Mandated supervisory coaching: 3 field visits per week per SDO. Tracks direct mentoring
        of frontline sales organizers.
      </span>
    </div>
  );
}
