import type { IconType } from "react-icons";
import {
  MdEmojiEvents,
  MdOutlineCelebration,
  MdOutlineEmojiEvents,
  MdOutlineRedeem,
  MdOutlineTimer,
  MdRedeem,
  MdStar,
  MdStars,
  MdTrackChanges,
} from "react-icons/md";
import { inr, shortName } from "@/lib/format";
import { MILESTONES, nextMilestone, type Period, type SoMetric, type Totals } from "./model";

/** Circumference of the r=46 progress ring. */
const RING = 289.03;

const MILESTONE_ICONS: Record<number, IconType> = {
  25: MdStar,
  50: MdStars,
  75: MdRedeem,
  100: MdEmojiEvents,
};

interface TargetHeroProps {
  totals: Totals;
  period: Period;
  selected: SoMetric | null;
}

export function TargetHero({ totals, period, selected }: TargetHeroProps) {
  const pct = totals.pct * 100;
  const next = nextMilestone(totals.pct);
  const paceShare = period.elapsed / period.length;
  const who = selected ? `${shortName(selected.so.name).toUpperCase()}’S` : "TEAM";
  const daysLeft = period.daysLeft
    ? `${period.daysLeft} days left`
    : period.key === "today"
      ? "Ends tonight"
      : "Closed range";

  let coach: { icon: IconType; pre: string; amount: string; post: string };
  if (next) {
    coach = {
      icon: next === 100 ? MdOutlineEmojiEvents : MdOutlineRedeem,
      pre: selected ? "Just " : "Team needs ",
      amount: inr((totals.target * next) / 100 - totals.sales),
      post: next === 100 ? " more to hit the full target" : ` more to reach the ${next}% milestone`,
    };
  } else {
    coach = {
      icon: MdOutlineCelebration,
      pre: "Target smashed — ",
      amount: inr(totals.sales - totals.target),
      post: " above target!",
    };
  }
  const CoachIcon = coach.icon;

  return (
    <section className="relative flex flex-col gap-[18px] overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#2b2f47_0%,#1d2033_70%)] p-5 text-white shadow-[0_14px_34px_rgba(29,32,51,.28)]">
      <div className="absolute -right-20 -top-20 size-60 rounded-full bg-[radial-gradient(circle,rgba(62,207,142,.18),rgba(62,207,142,0)_70%)]" />

      <div className="relative flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-[13px] font-bold leading-[1.25] tracking-[.1em] text-[#c9cce0]">
          <MdTrackChanges size={20} className="flex-none text-spring" />
          <span>
            {who} {period.heading} TARGET
          </span>
        </h2>
        <div className="flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full bg-white/8 px-2.5 py-1 text-[13px] font-semibold">
          <MdOutlineTimer size={17} />
          <span>{daysLeft}</span>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="whitespace-nowrap font-display text-[clamp(32px,7vw,44px)] font-extrabold leading-[1.1]">
            {inr(totals.sales)}
          </div>
          <div className="mt-1.5 text-[15px] leading-[1.3] text-[#b6b9cc]">
            achieved of <span className="font-bold text-white">{inr(totals.target)}</span> target
          </div>
        </div>
        <div className="relative size-28 flex-none">
          <svg viewBox="0 0 112 112" width="112" height="112" className="-rotate-90">
            <circle cx="56" cy="56" r="46" fill="none" stroke="#353a55" strokeWidth="10" />
            <circle
              cx="56"
              cy="56"
              r="46"
              fill="none"
              stroke="#3ecf8e"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={(RING * (1 - Math.min(totals.pct, 1))).toFixed(2)}
              className="drop-shadow-[0_0_6px_rgba(62,207,142,.5)] transition-[stroke-dashoffset] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-[24px] font-extrabold leading-none">
              {Math.round(pct)}%
            </div>
            <div className="text-[10px] font-bold tracking-[.12em] text-[#9da1b8]">ACHIEVED</div>
          </div>
        </div>
      </div>

      <div className="relative px-[15px] pb-[22px]">
        <div className="relative h-2.5 rounded-full bg-[#353a55]">
          <div
            className="h-full rounded-full bg-[repeating-linear-gradient(-45deg,#3ecf8e_0_8px,#5fe0a6_8px_16px)] transition-[width] duration-800 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
          {paceShare < 1 && (
            <div
              title="Expected pace"
              className="absolute -top-1.5 h-[22px] w-0.5 rounded-[2px] bg-white opacity-80"
              style={{ left: `${paceShare * 100}%` }}
            />
          )}
          {MILESTONES.map((at) => {
            const done = pct >= at;
            const isNext = at === next;
            const Icon = MILESTONE_ICONS[at];
            return (
              <div
                key={at}
                className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${at}%` }}
              >
                <div
                  className="flex size-[30px] items-center justify-center rounded-full border-2"
                  style={{
                    background: done ? "linear-gradient(160deg,#ffd45e,#f5ad1f)" : "#2a2e45",
                    borderColor: done ? "#ffe08a" : isNext ? "#f5c542" : "#4a4f68",
                    color: done ? "#4a3300" : isNext ? "#f5c542" : "#7d8199",
                    boxShadow: done ? "0 0 10px rgba(245,197,66,.5)" : "none",
                  }}
                >
                  <Icon size={17} />
                </div>
                <div
                  className="absolute top-[34px] text-[12px] font-bold"
                  style={{ color: done ? "#f5c542" : isNext ? "#fff" : "#7d8199" }}
                >
                  {at}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative flex items-center gap-3 rounded-[18px] border border-[rgba(245,197,66,.35)] bg-[rgba(245,197,66,.07)] px-3 py-2.5">
        <div className="flex size-10 flex-none items-center justify-center rounded-xl bg-[linear-gradient(160deg,#ffd45e,#f5ad1f)] text-[#4a3300]">
          <CoachIcon size={24} />
        </div>
        <div className="text-[15px] font-semibold leading-[1.3]">
          {coach.pre}
          <span className="font-extrabold text-[#f5c542]">{coach.amount}</span>
          {coach.post}
        </div>
      </div>
    </section>
  );
}
