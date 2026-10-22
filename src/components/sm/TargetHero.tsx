import { LuGift, LuStar, LuTarget, LuTimer, LuTrophy } from "react-icons/lu";
import { TODAY_DAY } from "@/data/sm";
import { inr, percent } from "@/lib/format";
import {
  MILESTONES,
  VIEW_TAG,
  firstName,
  nextMilestone,
  plural,
  type PeriodKey,
  type SmAnalysis,
  type ViewKind,
} from "./model";
import { Ring } from "./parts";

const NEEDS: Record<ViewKind, string> = {
  zone: "Zone operations need ",
  csdos: "All CSDO regions need ",
  csdo: "CSDO region needs ",
  sdos: "SDO teams need ",
  sdo: "Team needs ",
  direct: "Direct SO group needs ",
  sos: "Sales force needs ",
  so: "Just ",
};

export function TargetHero({
  an,
  period,
  className = "",
}: {
  an: SmAnalysis;
  period: PeriodKey;
  className?: string;
}) {
  const { view, range, totals: A } = an;
  const hasTarget = A.target > 0;
  const next = nextMilestone(A.ach);
  const paceAt = `${Math.min(range.elapsed, 1) * 100}%`;

  let pre: string;
  let amount = "";
  let post = "";

  if (!hasTarget) {
    pre =
      view === "csdo"
        ? `No sales organizers are active under CSDO ${firstName(an.csdo?.name || "")} yet.`
        : "No active targets match the current filters.";
  } else if (!next) {
    pre = "Target achieved · ";
    amount = inr(A.sales - A.target);
    post = " above target. Outstanding state performance!";
  } else {
    pre = NEEDS[view];
    amount = inr(next * A.target - A.sales);
    post = `${view === "so" ? " to reach the " : " more to unlock the "}${next * 100}% milestone`;
  }

  const days =
    period === "today"
      ? "Today"
      : range.to > TODAY_DAY
        ? `${plural(range.to - TODAY_DAY, "day")} left`
        : range.to === TODAY_DAY
          ? "Ends today"
          : "Closed";

  return (
    <section
      className={`relative flex flex-col justify-between gap-4 overflow-hidden rounded-[26px] bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_100%)] p-5 text-white shadow-[0_14px_30px_rgba(15,23,42,.32)] ${className}`}
    >
      {/* Background flare */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-sky-500/10 blur-2xl" />

      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[12px] font-bold tracking-[.12em] text-[#94a3b8]">
          <LuTarget size={16} strokeWidth={2.4} className="flex-none text-sky-400" />
          {view === "so"
            ? `${range.title} TARGET`
            : `${VIEW_TAG[view]} · ${range.title} TARGET`}
        </h2>
        <span className="flex h-7 flex-none items-center gap-1.5 rounded-full bg-white/10 px-3 text-[13px] font-semibold text-[#f1f5f9]">
          <LuTimer size={14} className="text-sky-300" />
          {days}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[38px] font-extrabold leading-[1.05] tracking-[-.01em]">
            {inr(A.sales)}
          </span>
          <span className="text-[14px] text-[#94a3b8]">
            achieved of <b className="text-white">{inr(A.target)}</b> target
          </span>
        </div>

        <Ring
          size={98}
          stroke={3.4}
          track="rgba(255,255,255,0.12)"
          color={A.ach >= 1 ? "#F5B829" : "#38BDF8"}
          value={A.ach}
        >
          <span className="text-[22px] font-extrabold leading-none text-white">
            {hasTarget ? percent(A.ach) : "—"}
          </span>
          <span className="text-[10px] font-bold tracking-[.12em] text-[#94a3b8]">
            ACHIEVED
          </span>
        </Ring>
      </div>

      {/* Milestone Track */}
      <div className="px-4 pt-1">
        <div className="relative h-14">
          <div className="absolute inset-x-0 top-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[repeating-linear-gradient(45deg,#38bdf8_0_8px,#60a5fa_8px_16px)]"
              style={{ width: `${Math.min(A.ach, 1) * 100}%` }}
            />
          </div>

          {/* Target due marker */}
          <span
            title="Expected pace to date"
            className="absolute top-1.25 h-6 w-0.75 -translate-x-1/2 rounded-xs bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ left: paceAt }}
          />

          {MILESTONES.map((at, i) => {
            const reached = hasTarget && A.ach >= at;
            const isNext = hasTarget && at === next;
            const Icon = i < 2 ? LuStar : i === 2 ? LuGift : LuTrophy;

            return (
              <div
                key={at}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
                style={{ left: `${at * 100}%` }}
              >
                <span
                  className="flex size-8.5 items-center justify-center rounded-full border-2 transition-transform"
                  style={{
                    background: reached ? "#F5B829" : "#1E293B",
                    borderColor: reached || isNext ? "#F5B829" : "#475569",
                    color: reached ? "#3B2A00" : isNext ? "#F5B829" : "#64748B",
                  }}
                >
                  {i < 2 ? (
                    <Icon size={15} fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Icon size={15} strokeWidth={2.2} />
                  )}
                </span>
                <span
                  className="text-[12px] font-bold"
                  style={{
                    color: reached ? "#F5B829" : isNext ? "#FCD34D" : "#64748B",
                  }}
                >
                  {at * 100}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational / Intervention coaching banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(245,184,41,.3)] bg-[rgba(245,184,41,.12)] px-3.5 py-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-marigold text-[#3b2a00] shadow-sm">
          <LuGift size={18} strokeWidth={2.2} />
        </span>
        <span className="text-pretty text-[14.5px] leading-[1.35] text-[#f8fafc]">
          {pre}
          {amount && <b className="text-[#fcd34d] font-bold">{amount}</b>}
          {post}
        </span>
      </div>

      <span className="text-[12.5px] text-[#94a3b8]">
        White marker = target expected to date ({inr(A.expected)}) ·{" "}
        {hasTarget ? `at ${percent(A.pace)} of pace due` : "no target in view"}
      </span>
    </section>
  );
}
