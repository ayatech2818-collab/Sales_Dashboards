import type { ReactNode } from "react";
import type { Scope } from "@/data/csdo";
import { inr, inrShort, percent } from "@/lib/format";
import { STATUS, VIEW_TAG, plural, type Analysis } from "./model";
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
  /** Span both columns at natural height. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-[20px] p-3.5 ${gap} ${PANEL} ${wide ? "col-span-full" : "min-h-30"}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[13px] font-semibold text-steel">{label}</span>
        <span className={`text-[10.5px] font-bold tracking-[.1em] ${tagClass}`}>{tag}</span>
      </div>
      {children}
    </div>
  );
}

const VALUE = "text-[26px] font-extrabold leading-[1.1]";
const NOTE = "text-[12.5px] text-pewter";

/** Sales smoothed over three days, as a 120×30 sparkline. */
function sparkline(daily: number[]): { line: string; area: string } | null {
  const n = daily.length;
  if (n < 2) return null;
  const smooth = daily.map((v, i) => (v + (daily[i - 1] || 0) + (daily[i + 1] || 0)) / 3);
  const max = Math.max(...smooth, 1);
  const line = smooth
    .map((v, i) => `${i ? "L" : "M"}${((i / (n - 1)) * 120).toFixed(1)} ${(28 - (v / max) * 24).toFixed(1)}`)
    .join(" ");
  return { line, area: `${line} L120 30 L0 30 Z` };
}

export function KpiGrid({ scope, an }: { scope: Scope; an: Analysis }) {
  const { view, range, totals: A, so, inView } = an;
  const tag = VIEW_TAG[view];
  const hasTarget = A.target > 0;
  const spark = sparkline(A.daily);
  const delta = range.prev && A.prevSales > 0 ? (A.sales - A.prevSales) / A.prevSales : null;

  const directCount = inView.filter((m) => an.isDirect(m.id)).length;
  const sdoCount =
    view === "sdo"
      ? 1
      : view === "direct" || view === "so"
        ? 0
        : an.statusOn
          ? new Set(inView.filter((m) => !an.isDirect(m.id)).map((m) => an.sdoOf(m.id)!.id)).size
          : scope.sdos.length;

  const visitSdos = view === "sdo" ? [an.sdo!] : view === "sdos" ? an.sdos : [];
  const visitsDone = visitSdos.reduce((t, d) => t + d.visits, 0);
  const visitsDue = visitSdos.reduce((t, d) => t + d.visitsDue, 0);
  const showVisits = view === "sdo" || (view === "sdos" && an.sdos.length > 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Kpi label="Total sales" tag={tag}>
        <span className={VALUE}>{inrShort(A.sales)}</span>
        {delta !== null && (
          <span className={`text-[12.5px] font-semibold ${delta >= 0 ? "text-pine" : "text-brick"}`}>
            {delta >= 0 ? "▲ " : "▼ "}
            {Math.abs(Math.round(delta * 100))}% vs {range.prevLabel}
          </span>
        )}
        {spark && (
          <svg viewBox="0 0 120 30" className="mt-auto block h-auto w-full">
            <path d={spark.area} fill="#E3F8EE" />
            <path
              d={spark.line}
              fill="none"
              stroke="#1FA971"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}
      </Kpi>

      <Kpi label="Total sales target" tag={tag}>
        <span className={VALUE}>{inrShort(A.target)}</span>
        <span className={NOTE}>Due by today: {inrShort(A.expected)}</span>
        <div className="relative mt-auto h-2 rounded-full bg-well">
          <div
            className="h-full rounded-full bg-ash"
            style={{ width: `${Math.min(range.elapsed, 1) * 100}%` }}
          />
        </div>
        <span className="text-[11.5px] text-fog">
          {range.open ? `${Math.round(range.elapsed * 100)}% of the period elapsed` : "Period complete"}
        </span>
      </Kpi>

      <Kpi label="Target achievement" tag={tag} gap="gap-1.5">
        <div className="flex items-center gap-2.5">
          <Ring
            size={56}
            stroke={4}
            track="#EFEDE8"
            color={A.status ? STATUS[A.status].dot : "#C9CED8"}
            value={A.ach}
          >
            <span className="text-[13.5px] font-extrabold">{hasTarget ? percent(A.ach) : "—"}</span>
          </Ring>
          <span className="text-[12.5px] leading-[1.3] text-pewter">
            {hasTarget
              ? `${percent(A.pace)} of target due · ${A.status ? STATUS[A.status].label : ""}`
              : "No target in view"}
          </span>
        </div>
      </Kpi>

      <Kpi label="Earnings" tag={tag}>
        <span className={VALUE}>{inrShort(A.earn)}</span>
        <span className={`mt-auto flex items-center gap-2 ${NOTE}`}>
          <span className="flex size-6.5 flex-none items-center justify-center rounded-lg bg-[#fff3dc] text-[14px] font-extrabold text-[#8a5a00]">
            ₹
          </span>
          {view === "so" ? "As reported for this SO" : `Sum across ${plural(A.n, "SO")} · as reported`}
        </span>
      </Kpi>

      {so ? (
        <>
          <Kpi label="Enrolments" tag="SO">
            <span className={VALUE}>{so.count}</span>
            <span className={`mt-auto ${NOTE}`}>
              {so.count ? `Avg ${inr(so.sales / so.count)} per enrolment` : "No enrolments this period"}
            </span>
          </Kpi>
          <Kpi label="Performance score" tag="SO">
            <span className={`flex items-baseline gap-1 ${VALUE}`}>
              {so.rating.toFixed(1)}
              <span className="text-[14px] font-semibold text-pewter">/ 5</span>
            </span>
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} color={so.rating >= i - 0.25 ? "#F5B829" : "#ECE9E2"} />
              ))}
            </span>
            <span className={`mt-auto ${NOTE}`}>
              #{an.soRank} of {an.all.length} by target achievement
            </span>
          </Kpi>
        </>
      ) : (
        <>
          <Kpi label="Avg SO achievement" tag={tag} gap="gap-1.5">
            <div className="flex items-center gap-2.5">
              <Ring size={56} stroke={4} track="#EFEDE8" color="#E08A1E" value={A.avgAch}>
                <span className="text-[13.5px] font-extrabold">{A.n ? percent(A.avgAch) : "—"}</span>
              </Ring>
              <span className="text-[12.5px] leading-[1.3] text-pewter">
                Mean target % of {plural(A.n, "SO")} (unweighted)
              </span>
            </div>
          </Kpi>
          <Kpi label="People in view" tag={tag} gap="gap-1.5">
            <span className={VALUE}>
              {A.n}
              <span className="text-[14px] font-semibold text-pewter"> unique SOs</span>
            </span>
            <div className="mt-auto flex flex-col gap-0.5">
              {[
                { label: "Direct SOs", value: directCount, ink: "#4B3FC7" },
                { label: "SOs under SDOs", value: inView.length - directCount, ink: "#8E3479" },
                { label: "SDOs (not counted)", value: sdoCount, ink: "#646B7D" },
              ].map((r) => (
                <span
                  key={r.label}
                  className="flex justify-between gap-1.5 text-[12.5px]"
                  style={{ color: r.ink }}
                >
                  <span>{r.label}</span>
                  <b>{r.value}</b>
                </span>
              ))}
            </div>
          </Kpi>
        </>
      )}

      {showVisits && (
        <Kpi
          label="Field visits"
          tag="SDO-LEVEL KPI"
          tagClass="text-plum"
          gap="gap-2"
          wide
        >
          <div className="flex items-baseline gap-1.5">
            <span className={VALUE}>{visitsDone}</span>
            <span className="text-[14px] font-semibold text-pewter">of {visitsDue} due</span>
          </div>
          <div className="h-2 rounded-full bg-well">
            <div
              className="h-full rounded-full bg-plum"
              style={{ width: `${visitsDue ? Math.min(visitsDone / visitsDue, 1) * 100 : 0}%` }}
            />
          </div>
          <span className={NOTE}>
            {view === "sdo" ? `Own KPI for ${an.sdo!.name}` : `Across ${plural(visitSdos.length, "SDO")}`}{" "}
            · coaching visits to SOs, 3 per week. Not part of sales totals.
          </span>
        </Kpi>
      )}
    </div>
  );
}
