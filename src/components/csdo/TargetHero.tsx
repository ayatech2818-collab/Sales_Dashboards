import { LuGift, LuStar, LuTarget, LuTimer, LuTrophy } from "react-icons/lu";
import { TODAY_DAY } from "@/data/csdo";
import { inr, percent } from "@/lib/format";
import {
  MILESTONES,
  VIEW_TAG,
  firstName,
  nextMilestone,
  plural,
  type Analysis,
  type PeriodKey,
  type ViewKind,
} from "./model";
import { Ring } from "./parts";

const NEEDS: Record<ViewKind, string> = {
  org: "Organization needs ",
  direct: "Direct SOs need ",
  sdos: "SDO teams need ",
  indirect: "SDO-managed SOs need ",
  sdo: "Team needs ",
  so: "Just ",
};

/** Sales against target for the view, with the 25/50/75/100% milestone track. */
export function TargetHero({ an, period }: { an: Analysis; period: PeriodKey }) {
  const { view, range, totals: A } = an;
  const hasTarget = A.target > 0;
  const next = nextMilestone(A.ach);
  const paceAt = `${Math.min(range.elapsed, 1) * 100}%`;

  let pre: string;
  let amount = "";
  let post = "";
  if (!hasTarget) {
    pre =
      view === "sdo"
        ? `No SOs are assigned to ${firstName(an.sdo!.name)} yet. Team targets begin when an SO is assigned.`
        : "No SOs match the current filters.";
  } else if (!next) {
    pre = "Target achieved · ";
    amount = inr(A.sales - A.target);
    post = " above target";
  } else {
    pre = NEEDS[view];
    amount = inr(next * A.target - A.sales);
    post = `${view === "so" ? " to reach the " : " more to reach the "}${next * 100}% milestone`;
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
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-[26px] bg-[linear-gradient(160deg,#222b45_0%,#2b2f3d_100%)] p-5 text-white shadow-[0_14px_30px_rgba(29,35,52,.26)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[12px] font-bold tracking-[.12em] text-[#c9cedc]">
          <LuTarget size={16} strokeWidth={2.2} className="flex-none text-[#34d399]" />
          {view === "so" ? `${range.title} TARGET` : `${VIEW_TAG[view]} · ${range.title} TARGET`}
        </h2>
        <span className="flex h-7 flex-none items-center gap-1.5 rounded-full bg-white/8 px-2.5 text-[13px] text-[#e6e8ef]">
          <LuTimer size={14} />
          {days}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[38px] font-extrabold leading-[1.05] tracking-[-.01em]">{inr(A.sales)}</span>
          <span className="text-[14px] text-[#c9cedc]">
            achieved of <b className="text-white">{inr(A.target)}</b> target
          </span>
        </div>
        <Ring
          size={96}
          stroke={3.2}
          track="rgba(255,255,255,0.10)"
          color={A.ach >= 1 ? "#F5B829" : "#34D399"}
          value={A.ach}
        >
          <span className="text-[22px] font-extrabold leading-none">
            {hasTarget ? percent(A.ach) : "—"}
          </span>
          <span className="text-[10px] font-bold tracking-[.12em] text-[#aeb4c6]">ACHIEVED</span>
        </Ring>
      </div>

      <div className="px-4">
        <div className="relative h-14">
          <div className="absolute inset-x-0 top-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[repeating-linear-gradient(45deg,#34d399_0_8px,#5ee0b1_8px_16px)]"
              style={{ width: `${Math.min(A.ach, 1) * 100}%` }}
            />
          </div>
          <span
            title="Target due by today"
            className="absolute top-1.25 h-6 w-0.75 -translate-x-1/2 rounded-[2px] bg-white"
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
                  className="flex size-8.5 items-center justify-center rounded-full border-2"
                  style={{
                    background: reached ? "#F5B829" : "#2C3247",
                    borderColor: reached || isNext ? "#F5B829" : "#454B60",
                    color: reached ? "#3B2A00" : isNext ? "#F5B829" : "#7D8296",
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
                  style={{ color: reached ? "#F5B829" : isNext ? "#F5C451" : "#8D92A6" }}
                >
                  {at * 100}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(245,184,41,.35)] bg-[rgba(245,184,41,.10)] px-3.5 py-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-marigold text-[#3b2a00]">
          <LuGift size={18} strokeWidth={2.2} />
        </span>
        <span className="text-pretty text-[14.5px] leading-[1.35] text-[#f3f4f8]">
          {pre}
          {amount && <b className="text-[#f5c451]">{amount}</b>}
          {post}
        </span>
      </div>

      <span className="text-[12.5px] text-[#aeb4c6]">
        White marker = target due by today ({inr(A.expected)}) ·{" "}
        {hasTarget ? `at ${percent(A.pace)} of target due` : "no target in view"}
      </span>
    </section>
  );
}
