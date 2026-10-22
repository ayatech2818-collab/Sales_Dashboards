import { inrShort, percent } from "@/lib/format";
import {
  STATUS,
  STATUSES,
  byKey,
  plural,
  type StatusFilter,
  type SmAnalysis,
  type ViewKind,
} from "./model";
import { CardTitle, PANEL } from "./parts";

const TITLE: Record<ViewKind, string> = {
  zone: "Zone performance health",
  csdos: "CSDO regional performance health",
  csdo: "CSDO regional performance health",
  sdos: "SDO teams performance health",
  sdo: "Team performance health",
  direct: "Direct SOs performance health",
  sos: "Sales force performance health",
  so: "",
};

const BAR_CAP = 1.4;

interface StatusBreakdownProps {
  an: SmAnalysis;
  status: StatusFilter;
  onStatus: (status: StatusFilter) => void;
  onOpenSo: (id: string) => void;
  className?: string;
}

export function StatusBreakdown({
  an,
  status,
  onStatus,
  onOpenSo,
  className = "",
}: StatusBreakdownProps) {
  const { view, range, totals: A, baseTotals: B, inViewSos } = an;
  const hasTarget = A.target > 0;
  const paceAt = `${Math.min(range.elapsed, 1) * 100}%`;
  const bars = inViewSos.slice().sort(byKey("ach"));

  return (
    <section className={`flex h-full flex-col justify-between gap-3 rounded-[22px] p-4 ${PANEL} ${className}`}>
      <CardTitle
        title={TITLE[view]}
        sub={`${range.label} · ${plural(B.n, "sales organizer")}${
          view === "csdo"
            ? ` in ${an.csdo?.name}'s region`
            : view === "sdo"
              ? ` in ${an.sdo?.name}'s team`
              : " across zone"
        }`}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold text-pewter">Actual sales vs target</span>
          <b className="text-navy">
            {inrShort(A.sales)} / {inrShort(A.target)}
          </b>
        </div>
        <div className="relative h-3 rounded-full bg-well">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7,#38bdf8)]"
            style={{ width: `${Math.min(A.ach, 1) * 100}%` }}
          />
          <span
            title="Target expected to date"
            className="absolute -top-1 h-5 w-0.75 -translate-x-1/2 rounded-xs bg-navy shadow-xs"
            style={{ left: paceAt }}
          />
        </div>
        <span className="text-[12px] text-fog">
          Marker = target due by today ({inrShort(A.expected)}).{" "}
          {hasTarget ? `Tracking at ${percent(A.pace)} of pace due.` : ""}
        </span>
      </div>

      {B.n > 0 && (
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {STATUSES.filter((s) => B.counts[s]).map((s) => (
            <span
              key={s}
              style={{ width: `${(B.counts[s] / B.n) * 100}%`, background: STATUS[s].dot }}
              title={`${STATUS[s].label}: ${B.counts[s]} SOs`}
            />
          ))}
        </div>
      )}

      {/* Interactive status cards */}
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map((s) => {
          const S = STATUS[s];
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => onStatus(active ? "all" : s)}
              className="flex cursor-pointer flex-col rounded-2xl border-2 px-3 py-2.5 text-left leading-tight transition-all hover:scale-[1.01]"
              style={{ background: S.bg, borderColor: active ? S.dot : "transparent" }}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: S.ink }}>
                <span className="size-2 rounded-full" style={{ background: S.dot }} />
                {S.label}
              </span>
              <span className="text-[24px] font-extrabold text-navy">
                {B.counts[s]} <span className="text-[13px] font-semibold text-pewter">SOs</span>
              </span>
              <span className="text-[11.5px]" style={{ color: S.ink }}>
                {S.rule}
              </span>
            </button>
          );
        })}
      </div>

      {/* Individual achievement bars */}
      {bars.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="font-bold text-navy">Individual SO distribution</span>
            <span className="text-fog text-[12px]">tap a bar to inspect SO</span>
          </div>
          <div className="relative flex h-24 items-end gap-1 border-b border-rim pt-2">
            <span
              className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-[#e0a526]"
              style={{ bottom: `${100 / BAR_CAP}%` }}
            />
            <span
              className="pointer-events-none absolute right-0 text-[11px] font-bold text-[#9a6a00]"
              style={{ bottom: `calc(${100 / BAR_CAP}% + 2px)` }}
            >
              100%
            </span>
            {bars.map((m) => {
              const label = `${m.name} · ${percent(m.ach)} of target`;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOpenSo(m.id)}
                  title={label}
                  aria-label={label}
                  className="min-w-1.5 max-w-7 flex-1 cursor-pointer rounded-[6px_6px_2px_2px] p-0 transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-navy"
                  style={{
                    height: `${Math.max(Math.min(m.ach / BAR_CAP, 1) * 100, 3)}%`,
                    background: STATUS[m.status].dot,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
