import { dayLabel } from "@/lib/calendar";
import { inr } from "@/lib/format";
import type { Range, SoMetric } from "./model";
import { CardTitle, PANEL } from "./parts";

export function RecentEnrolments({ so, range }: { so: SoMetric; range: Range }) {
  const recent = so.enrolments
    .slice()
    .sort((a, b) => b.day - a.day || (a.id < b.id ? 1 : -1))
    .slice(0, 6);

  return (
    <section className={`flex flex-col gap-2.5 rounded-[22px] p-4 ${PANEL}`}>
      <CardTitle
        title="Recent enrolments"
        sub={`${range.label} · individual booking amounts and commissions`}
      />
      {recent.length ? (
        <div className="flex flex-col">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 border-t border-[#f1efea] py-2.25">
              <span className="w-14 flex-none text-[13px] font-bold text-navy">
                {dayLabel(t.day)}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-fog">
                {t.id}
              </span>
              <span className="flex-none text-[14px] font-extrabold text-navy">
                {inr(t.amount)}
              </span>
              <span className="min-w-16 flex-none text-right text-[12.5px] font-semibold text-pine">
                +{inr(t.earning)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="py-2 text-[13.5px] text-pewter">No enrolments recorded in this period.</span>
      )}
    </section>
  );
}
