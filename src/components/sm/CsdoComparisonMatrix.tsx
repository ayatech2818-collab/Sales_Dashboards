import { LuChevronRight, LuMapPin, LuUsers } from "react-icons/lu";
import { inrShort, percent } from "@/lib/format";
import { STATUS, byKey, rankStyle, type CsdoMetric, type SmAnalysis } from "./model";
import { Avatar, CardTitle, PANEL, Star, Tint } from "./parts";

interface CsdoComparisonMatrixProps {
  an: SmAnalysis;
  onOpenCsdo: (id: string) => void;
}

export function CsdoComparisonMatrix({ an, onOpenCsdo }: CsdoComparisonMatrixProps) {
  const sorted = an.csdos.slice().sort(byKey("ach"));

  return (
    <section className={`flex flex-col gap-3 rounded-[22px] p-4 ${PANEL}`}>
      <div className="flex items-start justify-between gap-2">
        <CardTitle
          title="CSDO Regional Performance Matrix"
          sub={`${an.range.label} · side-by-side comparative health of all CSDO divisions`}
        />
        <span className="flex-none rounded-full bg-[#f0fdf4] px-2.5 py-0.75 text-[11px] font-bold text-[#166534]">
          {sorted.length} REGIONS
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-3">
        {sorted.map((c: CsdoMetric, i: number) => {
          const S = c.status ? STATUS[c.status] : STATUS.on;
          const rank = rankStyle(i);
          const paceAt = `${Math.min(an.range.elapsed, 1) * 100}%`;

          return (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-[20px] border p-3.5 transition-all hover:border-[#cbd5e1] hover:shadow-sm"
              style={{
                background: i === 0 ? "linear-gradient(180deg,#FFFBEB 0%,#FFFFFF 65%)" : "#FFFFFF",
                borderColor: i === 0 ? "#FDE68A" : "#E2E8F0",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-7 flex-none items-center justify-center rounded-lg text-[12px] font-extrabold"
                    style={{ background: rank.badgeBg, color: rank.badgeInk }}
                  >
                    #{i + 1}
                  </span>
                  <Avatar
                    person={c}
                    ring={{ gap: 2, width: 2, color: S.dot }}
                    className="size-10.5 text-[14px]"
                  />
                  <div className="flex min-w-0 flex-col leading-[1.2]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold text-navy truncate">{c.name}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-steel">
                      <LuMapPin size={12} className="text-[#0284c7]" />
                      {c.region}
                    </span>
                  </div>
                </div>

                <Tint bg={S.bg} ink={S.ink} className="px-2 py-0.5 text-[11px]">
                  {S.label}
                </Tint>
              </div>

              {/* Numbers */}
              <div className="flex items-baseline justify-between border-y border-[#f1f5f9] py-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-fog">SALES ACHIEVED</span>
                  <span className="text-[19px] font-extrabold text-navy">{inrShort(c.sales)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-semibold text-fog">TARGET DUE</span>
                  <span className="text-[14px] font-bold text-pewter">
                    of {inrShort(c.target)}
                  </span>
                </div>
              </div>

              {/* Progress bar with pace needle */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-fog">Progress to target</span>
                  <b style={{ color: S.ink }}>{percent(c.ach)}</b>
                </div>
                <div className="relative h-2 rounded-full bg-well">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(c.ach, 1) * 100}%`, background: S.dot }}
                  />
                  <span
                    title="Target due pace"
                    className="absolute -top-0.75 h-3.5 w-0.5 rounded-[1px] bg-navy"
                    style={{ left: paceAt }}
                  />
                </div>
              </div>

              {/* Subordinates & Health Chips */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11.5px]">
                <div className="flex items-center gap-1 text-steel">
                  <LuUsers size={13} className="text-plum" />
                  <span>
                    <b>{c.sdos.length}</b> SDOs · <b>{c.n}</b> SOs ({c.directSos.length} direct)
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold text-navy">
                  <Star size={13} />
                  <span>{c.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Drill-down button */}
              <button
                type="button"
                onClick={() => onOpenCsdo(c.id)}
                className="mt-auto flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[12.5px] font-bold text-navy transition hover:bg-navy hover:text-white"
              >
                <span>Drill down into {c.name}&rsquo;s region</span>
                <LuChevronRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
