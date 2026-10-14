import type { IconType } from "react-icons";
import {
  MdEmojiEvents,
  MdLocalFireDepartment,
  MdLocationOn,
  MdMilitaryTech,
  MdRocketLaunch,
  MdStars,
} from "react-icons/md";
import { inrShort } from "@/lib/format";
import { nextMilestone, type CategoryStyle, type Period, type SoMetric } from "./model";
import { CARD, SoAvatar } from "./parts";

interface Badge {
  icon: IconType;
  name: string;
  desc: string;
  earned: boolean;
}

function badgesFor(m: SoMetric, period: Period): Badge[] {
  return [
    { icon: MdEmojiEvents, name: "Target Smasher", desc: "Hit 100% of target", earned: m.pct >= 1 },
    { icon: MdStars, name: "Halfway Hero", desc: "Reached 50% of target", earned: m.pct >= 0.5 },
    {
      icon: MdMilitaryTech,
      name: "Podium",
      desc: "Top 3 in team sales",
      earned: !!m.rank && m.rank <= 3,
    },
    {
      icon: MdLocalFireDepartment,
      name: "Every Day",
      desc: "Sold on every day of the period",
      earned: period.elapsed > 1 && m.activeDays === period.elapsed,
    },
    {
      icon: MdRocketLaunch,
      name: "Rising",
      desc: "Beat the previous period",
      earned: m.sales > m.prev && m.prev > 0,
    },
  ];
}

function Stat({
  label,
  value,
  sub,
  gold = false,
}: {
  label: string;
  value: string;
  sub: string;
  gold?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-2.5 ${gold ? "bg-sun-soft" : "bg-[#f6f5f2]"}`}>
      <div className={`text-[12px] font-semibold ${gold ? "text-[#8a5a00]" : "text-dim"}`}>
        {label}
      </div>
      <div
        className={`font-display text-[18px] font-bold leading-[1.2] ${gold ? "text-[#4a3300]" : ""}`}
      >
        {value}
      </div>
      <div className={`text-[11px] ${gold ? "text-[#8a5a00]" : "text-hint"}`}>{sub}</div>
    </div>
  );
}

interface OrganizerDetailProps {
  selected: SoMetric;
  period: Period;
  cat: CategoryStyle;
}

/** Profile, gap to target and badges for the organizer in focus. */
export function OrganizerDetail({ selected: m, period, cat }: OrganizerDetailProps) {
  const remaining = Math.max(0, m.target - m.sales);
  const next = nextMilestone(m.pct);

  return (
    <section className={`${CARD} flex flex-col gap-4 p-4.5`}>
      <div className="flex items-center gap-3">
        <div
          className="size-[60px] flex-none rounded-full p-[3px]"
          style={{ background: `linear-gradient(135deg,${cat.color},#f5c542)` }}
        >
          <SoAvatar so={m.so} className="size-full border-[3px] border-white text-[19px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[21px] font-bold leading-[1.05]">{m.so.name}</h2>
            <span className="rounded-full bg-[#efeef3] px-2 py-px text-[11px] font-bold tracking-[.06em] text-[#4a4f63]">
              {m.so.code}
            </span>
          </div>
          <div className="flex items-center gap-[3px] text-[14px] text-sub">
            <MdLocationOn size={16} className="flex-none" />
            <span>
              {m.so.territory} · {m.so.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div
          className="flex-none rounded-full px-2.5 py-[3px] text-[12px] font-bold"
          style={{ background: cat.soft, color: cat.color }}
        >
          {cat.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="Remaining"
          value={remaining ? inrShort(remaining) : "Done!"}
          sub="to full target"
        />
        <Stat
          label="Needed / day"
          value={remaining && period.daysLeft ? inrShort(remaining / period.daysLeft) : "—"}
          sub={period.daysLeft ? `over ${period.daysLeft} days left` : "period closed"}
        />
        <Stat
          gold
          label="Next milestone"
          value={next ? `${next}%` : "All done"}
          sub={
            next ? `${inrShort((m.target * next) / 100 - m.sales)} to go` : "Every milestone unlocked"
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="truncate text-[13px] font-semibold leading-[1.25] text-sub">
          Badges · {period.label}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
          {badgesFor(m, period).map(({ icon: Icon, name, desc, earned }) => (
            <div
              key={name}
              title={desc}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-center ${
                earned ? "bg-[#fff8e6]" : "bg-[#f6f5f2] opacity-55"
              }`}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-full ${
                  earned
                    ? "bg-[linear-gradient(160deg,#ffd45e,#f5ad1f)] text-[#4a3300]"
                    : "bg-[#e6e3db] text-[#9a9789]"
                }`}
              >
                <Icon size={22} />
              </div>
              <div className="text-[12px] font-bold leading-[1.15]">{name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
