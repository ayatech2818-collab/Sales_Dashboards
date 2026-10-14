import type { IconType } from "react-icons";
import {
  MdArrowUpward,
  MdCelebration,
  MdFilterAltOff,
  MdFlag,
  MdMilitaryTech,
  MdNotifications,
  MdSpeed,
  MdSupportAgent,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";
import { inr, shortName } from "@/lib/format";
import type { Period, SoMetric, Totals } from "./model";

type Tone = "plain" | "good" | "gold" | "warn";

const TONES: Record<Tone, { bg: string; border: string; iconBg: string; iconFg: string }> = {
  plain: { bg: "#fff", border: "#ece9e2", iconBg: "#22263a", iconFg: "#fff" },
  good: { bg: "#effaf4", border: "#cdeedd", iconBg: "#1f9d6b", iconFg: "#fff" },
  gold: {
    bg: "#fff8e6",
    border: "#f6e3b0",
    iconBg: "linear-gradient(160deg,#ffd45e,#f5ad1f)",
    iconFg: "#4a3300",
  },
  warn: { bg: "#fff6ed", border: "#f8dfc4", iconBg: "#f0a35a", iconFg: "#fff" },
};

interface Insight {
  icon: IconType;
  text: string;
  tone: Tone;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function teamInsights(totals: Totals, period: Period, isFiltered: boolean): Insight[] {
  if (totals.count === 0) {
    return [{ icon: MdFilterAltOff, text: "No organizers match the current filters.", tone: "plain" }];
  }
  const pct = totals.pct * 100;
  const reached = [100, 75, 50, 25].find((m) => pct >= m);
  const onTrack = totals.counts.excellent + totals.counts.ontrack;
  const needHelp = totals.counts.attention + totals.counts.risk;
  const insights: Insight[] = [
    reached
      ? {
          icon: MdCelebration,
          text: `Your ${isFiltered ? "filtered group" : "team"} has reached ${reached}% of its ${period.noun} target!`,
          tone: "gold",
        }
      : {
          icon: MdFlag,
          text: `Your team is at ${Math.round(pct)}% of its ${period.noun} target.`,
          tone: "plain",
        },
    {
      icon: MdTrendingUp,
      text: `${plural(onTrack, "organizer is", "organizers are")} on track to achieve their targets.`,
      tone: "good",
    },
  ];
  if (needHelp) {
    insights.push({
      icon: MdSupportAgent,
      text: `${plural(needHelp, "organizer needs", "organizers need")} additional support ${period.when}.`,
      tone: "warn",
    });
  } else if (totals.idle) {
    insights.push({
      icon: MdNotifications,
      text: `${plural(totals.idle, "active organizer has", "active organizers have")} no sales recorded ${period.when}.`,
      tone: "warn",
    });
  }
  return insights;
}

function organizerInsights(sel: SoMetric, ranked: SoMetric[], period: Period): Insight[] {
  const name = shortName(sel.so.name);
  const pct = sel.pct * 100;
  const reached = [100, 75, 50, 25].find((m) => pct >= m);
  const insights: Insight[] = [
    reached
      ? {
          icon: MdCelebration,
          text: `${name} has reached ${reached}% of the ${period.noun} target!`,
          tone: "gold",
        }
      : { icon: MdFlag, text: `${name} is at ${Math.round(pct)}% of the ${period.noun} target.`, tone: "plain" },
  ];

  if (sel.rank === 1) {
    insights.push({
      icon: MdMilitaryTech,
      text: `${name} is leading the team in sales ${period.when}.`,
      tone: "good",
    });
  } else if (sel.rank) {
    const ahead = ranked[sel.rank - 2];
    const rival = shortName(ahead.so.name);
    insights.push({
      icon: MdArrowUpward,
      // "Akhil R." already ends the sentence.
      text: `${inr(ahead.sales - sel.sales + 50)} more to overtake #${sel.rank - 1} ${rival}${rival.endsWith(".") ? "" : "."}`,
      tone: "good",
    });
  }

  const remaining = Math.max(0, sel.target - sel.sales);
  const struggling = sel.cat === "attention" || sel.cat === "risk";
  if (remaining > 0 && period.daysLeft) {
    insights.push({
      icon: struggling ? MdSupportAgent : MdSpeed,
      text: `Needs ${inr(remaining / period.daysLeft)}/day for the next ${period.daysLeft} days to hit target.`,
      tone: struggling ? "warn" : "plain",
    });
  } else if (sel.prev) {
    const ahead = sel.sales >= sel.prev;
    const change = Math.abs(Math.round(((sel.sales - sel.prev) / sel.prev) * 100));
    insights.push({
      icon: ahead ? MdTrendingUp : MdTrendingDown,
      text: `${change}% ${ahead ? "ahead of " : "behind "}${period.prevLabel}.`,
      tone: ahead ? "good" : "warn",
    });
  }
  return insights;
}

interface InsightsProps {
  totals: Totals;
  period: Period;
  selected: SoMetric | null;
  ranked: SoMetric[];
  isFiltered: boolean;
}

/** Plain-language callouts generated from the numbers above. */
export function Insights({ totals, period, selected, ranked, isFiltered }: InsightsProps) {
  const insights = selected
    ? organizerInsights(selected, ranked, period)
    : teamInsights(totals, period, isFiltered);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-2.5">
      {insights.map(({ icon: Icon, text, tone }) => {
        const t = TONES[tone];
        return (
          <div
            key={text}
            className="flex items-center gap-2.5 rounded-[18px] border px-3 py-2.5"
            style={{ background: t.bg, borderColor: t.border }}
          >
            <div
              className="flex size-[34px] flex-none items-center justify-center rounded-[11px]"
              style={{ background: t.iconBg, color: t.iconFg }}
            >
              <Icon size={20} />
            </div>
            <div className="text-pretty text-[14px] font-semibold leading-[1.3] text-body">{text}</div>
          </div>
        );
      })}
    </div>
  );
}
