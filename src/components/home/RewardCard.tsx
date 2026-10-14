import { MdStar, MdTrendingUp } from "react-icons/md";
import type { Milestone } from "@/data/home";
import { inr } from "@/lib/format";
import { clamp } from "@/lib/utils";
import { REWARD_ICONS } from "./icons";

interface RewardCardProps {
  stars: number;
  starsThisWeek: number;
  target: number;
  earnings: number;
  milestones: Milestone[];
  /** Index of the first milestone not yet reached, or -1 once all are. */
  nextIndex: number;
  /** 0→1 entrance progress; counts the stars up and fills the bar. */
  intro: number;
  /** Placement within the page layout. */
  className?: string;
}

export function RewardCard({
  stars,
  starsThisWeek,
  target,
  earnings,
  milestones,
  nextIndex,
  intro,
  className = "",
}: RewardCardProps) {
  const next = nextIndex >= 0 ? milestones[nextIndex] : null;
  const grand = milestones[milestones.length - 1];
  const reward = next ?? grand;
  const Icon = REWARD_ICONS[reward.rewardIcon];

  // Progress across the stretch between the previous milestone and the next.
  const previousAt = nextIndex > 0 ? milestones[nextIndex - 1].at : 0;
  const stretch = next
    ? clamp(((earnings / target) * 100 - previousAt) / (next.at - previousAt), 0, 1)
    : 1;

  return (
    <section
      className={`flex items-stretch gap-3.5 rounded-[22px] border border-[#F4E1A8] bg-[linear-gradient(110deg,#FFFFFF_0%,#FFFFFF_34%,#FFF3D3_100%)] p-4 shadow-[0_1px_2px_rgba(29,32,51,.05),0_10px_26px_-16px_rgba(170,110,0,.35)] transition-[translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(29,32,51,.05),0_16px_30px_-14px_rgba(170,110,0,.4)] ${className}`}
    >
      <div className="flex min-w-24 flex-initial flex-col gap-1.5">
        <h2 className="text-[13px] font-semibold leading-[1.1] text-muted">
          Your stars
        </h2>
        <div className="flex items-center gap-1">
          <MdStar
            size={30}
            className="flex-none animate-star-pop text-gold drop-shadow-[0_3px_4px_rgba(242,165,31,.35)]"
          />
          <span className="whitespace-nowrap font-display text-4xl font-extrabold leading-none">
            {Math.round(stars * intro).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="mt-auto flex items-center gap-[3px] whitespace-nowrap text-[12.5px] font-semibold leading-[1.1] text-forest">
          <MdTrendingUp size={16} className="flex-none" />+{starsThisWeek} this
          week
        </div>
      </div>

      <div className="flex-none border-l-[1.5px] border-dashed border-[rgba(170,110,0,.28)]" />

      <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[13px] font-semibold leading-[1.15] text-bronze">
            {next ? `Next reward · ${next.at}%` : "All rewards unlocked"}
          </div>
          <div className="relative -mr-1 -mt-1 flex size-[46px] flex-none animate-gift-wiggle items-center justify-center overflow-hidden rounded-[15px] bg-[linear-gradient(135deg,#FFDB73,#F0A11C)] text-cocoa shadow-[0_8px_16px_-8px_rgba(240,161,28,.9)] motion-reduce:animate-none">
            <Icon size={26} />
            <span className="absolute -bottom-2.5 -top-2.5 left-0 w-2/5 animate-shine bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.7),rgba(255,255,255,0))] motion-reduce:hidden" />
          </div>
        </div>
        <div className="text-balance font-display text-lg font-bold leading-[1.1]">
          {reward.reward}
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-[3px] bg-[rgba(240,161,28,.18)]">
            <div
              className="h-full rounded-[3px] bg-[linear-gradient(90deg,#F6BE3B,#F0A11C)]"
              style={{ width: `${stretch * 100 * intro}%` }}
            />
          </div>
          <div className="text-[12.5px] font-semibold leading-[1.1] text-bronze">
            {next
              ? `${inr((target * next.at) / 100 - earnings)} to go`
              : "Every reward collected"}
          </div>
        </div>
      </div>
    </section>
  );
}
