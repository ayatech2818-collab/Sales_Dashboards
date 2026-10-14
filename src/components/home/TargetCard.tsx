"use client";

import { useEffect, useRef, useState } from "react";
import { MdCelebration, MdOutlineTimer, MdTrackChanges } from "react-icons/md";
import type { Milestone } from "@/data/home";
import { inr } from "@/lib/format";
import { REWARD_ICONS } from "./icons";

/** Circumference of the r=36 score ring. */
const RING_LENGTH = 226.2;
const TIP_MS = 3500;

type MilestoneState = "done" | "next" | "locked";

const MARKER: Record<MilestoneState, string> = {
  done: "animate-ms-pop border-[#FFE6A0] bg-gold-sheen text-cocoa",
  next: "animate-next-glow border-gold bg-[#2F3554] text-gold motion-reduce:animate-none",
  locked: "border-white/12 bg-[#242940] text-white/40",
};

const MARKER_LABEL: Record<MilestoneState, string> = {
  done: "text-gold-soft",
  next: "text-white",
  locked: "text-white/50",
};

interface TargetCardProps {
  month: string;
  daysLeft: number;
  target: number;
  /** Where the figure settles. Drives which milestone is "next". */
  earnings: number;
  /** The figure as currently animated. Drives the number, ring and fill. */
  shown: number;
  milestones: Milestone[];
  /** Index of the first milestone not yet reached, or -1 once all are. */
  nextIndex: number;
  /** Placement within the page layout. */
  className?: string;
}

export function TargetCard({
  month,
  daysLeft,
  target,
  earnings,
  shown,
  milestones,
  nextIndex,
  className = "",
}: TargetCardProps) {
  const [openTip, setOpenTip] = useState<number | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(tipTimer.current), []);

  const pct = (shown / target) * 100;
  const finalPct = (earnings / target) * 100;
  const next = nextIndex >= 0 ? milestones[nextIndex] : null;
  const toGo = (m: Milestone) => inr((target * m.at) / 100 - earnings);
  const CoachIcon = next ? REWARD_ICONS[next.rewardIcon] : MdCelebration;

  const toggleTip = (index: number) => {
    clearTimeout(tipTimer.current);
    setOpenTip((open) => (open === index ? null : index));
    tipTimer.current = setTimeout(() => setOpenTip(null), TIP_MS);
  };

  return (
    // When the layout stretches it to match its neighbour, the rows spread apart.
    <section
      className={`relative rounded-[28px] bg-target-card px-5 pb-[18px] pt-5 text-white shadow-[0_20px_40px_-20px_rgba(26,29,46,.65)] md:flex md:flex-col md:justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase leading-none tracking-[.08em] text-white/72">
          <MdTrackChanges size={17} className="flex-none text-mint" />
          {month} target
        </h2>
        <div className="flex items-center gap-[5px] rounded-full bg-white/8 pb-[5px] pl-2 pr-2.5 pt-1.5 text-xs font-medium leading-none text-white/86">
          <MdOutlineTimer size={15} className="flex-none" />
          {daysLeft} days left
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="whitespace-nowrap font-display text-[44px] font-extrabold leading-none tracking-[-.5px]">
            {inr(shown)}
          </div>
          <div className="mt-1.5 text-sm font-medium leading-tight text-white/68">
            earned of <span className="font-bold text-white">{inr(target)}</span>
          </div>
        </div>
        <div className="relative size-[84px] flex-none">
          <svg width={84} height={84} className="block -rotate-90">
            <circle
              cx={42}
              cy={42}
              r={36}
              className="fill-none stroke-white/10 stroke-[8px]"
            />
            <circle
              cx={42}
              cy={42}
              r={36}
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={(
                RING_LENGTH *
                (1 - Math.min(1, pct / 100))
              ).toFixed(1)}
              className={`fill-none stroke-[8px] drop-shadow-[0_0_5px_rgba(75,227,166,.45)] transition-[stroke] duration-400 ${
                pct >= 100 ? "stroke-gold" : "stroke-mint"
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-[22px] font-extrabold leading-none">
              {Math.floor(pct)}%
            </div>
            <div className="mt-0.5 text-[10px] font-semibold leading-none tracking-widest text-white/62">
              SCORE
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[22px] px-4">
        <div className="relative h-[60px]">
          <div className="absolute inset-x-0 top-[9px] h-3 overflow-hidden rounded-md bg-white/10">
            <div
              className="relative h-full rounded-md bg-[linear-gradient(90deg,#1FA971,#4BE3A6_70%,#9AF7D1)] shadow-[0_0_14px_rgba(75,227,166,.6)]"
              style={{ width: `${Math.min(100, pct)}%` }}
            >
              <div className="absolute inset-0 rounded-md bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,.16)_0_6px,rgba(255,255,255,0)_6px_12px)]" />
            </div>
          </div>

          {milestones.map((m, i) => {
            const state: MilestoneState =
              pct >= m.at ? "done" : i === nextIndex ? "next" : "locked";
            const open = openTip === i;
            const isLast = i === milestones.length - 1;
            return (
              <div
                key={m.at}
                className={`absolute -top-[7px] -ml-[22px] flex w-11 flex-col items-center ${
                  open ? "z-6" : "z-1"
                }`}
                style={{ left: `${m.at}%` }}
              >
                <button
                  type="button"
                  onClick={() => toggleTip(i)}
                  aria-label={`${m.reward} at ${m.at}%`}
                  aria-expanded={open}
                  className="flex size-11 cursor-pointer items-center justify-center [-webkit-tap-highlight-color:transparent]"
                >
                  <span
                    className={`flex size-[30px] items-center justify-center rounded-full border-2 transition-[background-color,color] duration-300 ${MARKER[state]}`}
                  >
                    {m.icons.map((icon, j) => {
                      const Icon = REWARD_ICONS[icon];
                      return (
                        <Icon
                          key={j}
                          size={m.icons.length > 1 ? 12 : 17}
                          className="-mx-px flex-none"
                        />
                      );
                    })}
                  </span>
                </button>
                <div
                  className={`-mt-[3px] text-xs font-bold leading-none ${MARKER_LABEL[state]}`}
                >
                  {m.at}%
                </div>

                {open && (
                  // The last tip hangs left so it stays inside the card.
                  <div
                    className={`absolute bottom-[52px] w-[164px] animate-tip-in rounded-[14px] bg-white px-3 pb-[11px] pt-2.5 text-left text-ink shadow-[0_14px_30px_-10px_rgba(0,0,0,.5)] ${
                      isLast ? "left-full -ml-[164px]" : "left-1/2 -ml-[82px]"
                    }`}
                  >
                    <div className="text-[11px] font-semibold leading-[1.1] tracking-[.05em] text-subtle">
                      {m.at}% · {inr((target * m.at) / 100)}
                    </div>
                    <div className="mt-1 font-display text-[15px] font-bold leading-[1.15]">
                      {m.reward}
                    </div>
                    {finalPct >= m.at ? (
                      <div className="mt-1 text-[12.5px] font-semibold leading-[1.2] text-forest">
                        Unlocked
                      </div>
                    ) : i === nextIndex ? (
                      <div className="mt-1 text-[12.5px] font-semibold leading-[1.2] text-bronze">
                        {toGo(m)} to go
                      </div>
                    ) : (
                      <div className="mt-1 text-[12.5px] font-semibold leading-[1.2] text-subtle">
                        Locked for now
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-[5px] -ml-[5px] size-2.5 rotate-45 rounded-[2px] bg-white ${
                        isLast ? "left-[142px]" : "left-[82px]"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2.5 rounded-2xl border border-gold/30 bg-gold/12 px-3 py-2.5">
        <span className="flex size-[34px] flex-none items-center justify-center rounded-[11px] bg-gold-sheen text-cocoa">
          <CoachIcon size={20} />
        </span>
        <div className="min-w-0 flex-1 text-pretty text-[14.5px] font-medium leading-[1.3]">
          {next ? (
            <>
              {next.coach.pre}
              <span className="font-display text-base font-bold leading-none text-gold-soft">
                {toGo(next)}
              </span>
              {next.coach.post}
            </>
          ) : (
            "Target smashed! Every reward this month is yours."
          )}
        </div>
      </div>
    </section>
  );
}
