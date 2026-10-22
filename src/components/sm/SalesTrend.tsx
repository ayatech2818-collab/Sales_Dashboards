import { dayLabel } from "@/lib/calendar";
import { inr, inrShort } from "@/lib/format";
import type { SmAnalysis } from "./model";
import { CardTitle, PANEL } from "./parts";

const W = 480;
const H = 170;
const PAD_TOP = 14;
const PAD_BOTTOM = 6;

export function SalesTrend({ an }: { an: SmAnalysis }) {
  const { range, totals: A } = an;
  const span = range.to - range.from + 1;

  const cumulative: number[] = [];
  for (const v of A.daily) cumulative.push((cumulative[cumulative.length - 1] ?? 0) + v);
  const cum = cumulative[cumulative.length - 1] ?? 0;
  const yMax = Math.max(A.target, cum, 1) * 1.1;
  const x = (i: number) => (span > 1 ? (i / (span - 1)) * W : 0);
  const y = (v: number) => H - PAD_BOTTOM - (v / yMax) * (H - PAD_TOP - PAD_BOTTOM);

  const line = cumulative.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = cumulative.length - 1;
  const area = cumulative.length
    ? `${line} L${x(last).toFixed(1)} ${H - PAD_BOTTOM} L0 ${H - PAD_BOTTOM} Z`
    : "";
  const targetY = y(A.target);
  const todayAt = x(last) / W;
  const gap = A.sales - A.expected;

  return (
    <section className={`flex flex-col gap-3 rounded-[22px] p-4 ${PANEL}`}>
      <div className="flex items-start justify-between gap-2">
        <CardTitle title="State sales trajectory" sub={`${range.label} · cumulative revenue vs pace due`} />
        <span
          className={`flex-none rounded-full px-2.5 py-0.75 text-[12.5px] font-bold ${
            gap >= 0 ? "bg-[#e7f6ee] text-pine" : "bg-[#fdecec] text-brick"
          }`}
        >
          {inrShort(Math.abs(gap))} {gap >= 0 ? "ahead" : "behind"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col rounded-[14px] bg-[#e0f2fe] px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0369a1]">
            <span className="h-1 w-3.5 rounded-xs bg-[#0284c7]" />
            Actual state revenue
          </span>
          <span className="text-[19px] font-extrabold text-[#0f172a]">{inr(A.sales)}</span>
        </div>
        <div className="flex flex-col rounded-[14px] bg-[#f4f3ef] px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-steel">
            <span className="w-3.5 border-t-[2.5px] border-dashed border-[#9aa0ae]" />
            {range.open ? "Target expected by today" : "Target"}
          </span>
          <span className="text-[19px] font-extrabold text-navy">{inr(A.expected)}</span>
        </div>
      </div>

      <div className="relative">
        <span
          className="absolute right-0 translate-y-[-120%] text-[11.5px] font-bold text-[#9a6a00]"
          style={{ top: `${((targetY / H) * 100).toFixed(1)}%` }}
        >
          Target {inrShort(A.target)}
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
          <line x1="0" x2={W} y1={targetY} y2={targetY} stroke="#E0A526" strokeWidth="1.5" strokeDasharray="6 6" />
          <line x1="0" x2={W} y1="164" y2="164" stroke="#ECE9E2" strokeWidth="1" />
          <path
            d={`M0 ${y(0).toFixed(1)} L${W} ${targetY.toFixed(1)}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          <path d={area} fill="#E0F2FE" />
          <path d={line} fill="none" stroke="#0284C7" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <line
            x1={x(last)}
            x2={x(last)}
            y1="0"
            y2="164"
            stroke="#C9C6BE"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle cx={x(last)} cy={y(cum)} r="9" fill="#0284C7" fillOpacity="0.18" />
          <circle cx={x(last)} cy={y(cum)} r="5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      </div>

      <div className="relative flex h-4 justify-between text-[12px] text-fog">
        <span>{dayLabel(range.from)}</span>
        {range.open && todayAt > 0.12 && todayAt < 0.88 && (
          <span
            className="absolute -translate-x-1/2 font-bold text-[#0284c7]"
            style={{ left: `${(todayAt * 100).toFixed(1)}%` }}
          >
            Today
          </span>
        )}
        <span>{dayLabel(range.to)}</span>
      </div>
    </section>
  );
}
