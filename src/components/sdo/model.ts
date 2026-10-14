import type { CSSProperties } from "react";
import {
  HISTORY_START,
  TODAY,
  type SalesOrganizer,
  type SoStatus,
} from "@/data/sdo";
import { clamp } from "@/lib/utils";

export type DataState = "live" | "loading" | "empty" | "error";
export type PeriodKey = "today" | "week" | "month" | "custom";
export type Category = "excellent" | "ontrack" | "attention" | "risk";
export type PerfFilter = "all" | "top" | "ontrack" | "attention";
export type StatusFilter = "all" | SoStatus;
export type SortKey = "sales" | "pct" | "earnings" | "score";

/** Everything the viewer can change on the dashboard. */
export interface ViewState {
  /** "all" or the id of one Sales Organizer. */
  person: string;
  period: PeriodKey;
  /** Custom range as yyyy-mm-dd. */
  customStart: string;
  customEnd: string;
  perf: PerfFilter;
  status: StatusFilter;
  sort: SortKey;
  listQuery: string;
  /** Rows of the organizer list currently revealed. */
  shown: number;
  peopleOpen: boolean;
  peopleQuery: string;
}

export const LIST_PAGE = 8;

/** Cut-offs, in percent, that place an organizer in a category. */
export interface Thresholds {
  /** Share of target at or above which an organizer is Excellent. */
  excellentAt: number;
  /** Share of expected pace at or above which an organizer is On Track. */
  onTrackPace: number;
  /** Below this share of expected pace an organizer is At Risk. */
  attentionPace: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  excellentAt: 100,
  onTrackPace: 95,
  attentionPace: 75,
};

export const CATEGORIES: Category[] = ["excellent", "ontrack", "attention", "risk"];

/** The performance filter chip each category falls under. */
export const PERF_FILTER: Record<Category, PerfFilter> = {
  excellent: "top",
  ontrack: "ontrack",
  attention: "attention",
  risk: "attention",
};

export interface CategoryStyle {
  label: string;
  color: string;
  soft: string;
  desc: string;
}

export function categoryStyles(th: Thresholds): Record<Category, CategoryStyle> {
  return {
    excellent: {
      label: "Excellent",
      color: "#1f9d6b",
      soft: "#e5f7ee",
      desc: `≥${th.excellentAt}% of target`,
    },
    ontrack: {
      label: "On Track",
      color: "#2f6fd6",
      soft: "#e7effc",
      desc: `≥${th.onTrackPace}% of expected pace`,
    },
    attention: {
      label: "Needs Attention",
      color: "#b7791f",
      soft: "#fdf3dc",
      desc: `${th.attentionPace}–${th.onTrackPace}% of expected pace`,
    },
    risk: {
      label: "At Risk",
      color: "#d14b4b",
      soft: "#fde8e6",
      desc: `<${th.attentionPace}% of expected pace`,
    },
  };
}

// ---- Calendar ----

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function dayDate(index: number): Date {
  return new Date(
    HISTORY_START.getFullYear(),
    HISTORY_START.getMonth(),
    HISTORY_START.getDate() + index,
  );
}

/** 42 → "13 Oct" */
export function dayLabel(index: number): string {
  const d = dayDate(index);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** 42 → "2026-10-13", the format date inputs use. */
export function isoDay(index: number): string {
  const d = dayDate(index);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-10-13" → 42; anything unparseable falls back to today. */
export function dayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const index = Math.round(
    (new Date(y, m - 1, d).getTime() - HISTORY_START.getTime()) / 864e5,
  );
  return Number.isNaN(index) ? TODAY : index;
}

// ---- Periods ----

export interface Period {
  key: PeriodKey;
  /** First and last day index covered, inclusive. */
  from: number;
  to: number;
  /** Days in the whole period, including those still to come. */
  length: number;
  /** Days of it that have passed, today included. */
  elapsed: number;
  /** The same stretch of the previous period, for comparison. */
  prevFrom: number;
  prevTo: number;
  /** Share of the monthly target that applies to this period. */
  targetShare: number;
  /** "October", "This week", "Today", "1 Oct – 13 Oct" */
  label: string;
  /** "OCTOBER", "WEEKLY", "DAILY", "PERIOD" — as in "TEAM WEEKLY TARGET". */
  heading: string;
  /** The comparison window: "Sep 1–13", "last Mon–Tue", … */
  prevLabel: string;
  /** The whole previous period: "September", "Last week", … */
  prevName: string;
  /** "monthly", "weekly", "daily", "period" */
  noun: string;
  /** "this month", "this week", "today", "in this period" */
  when: string;
  daysLeft: number;
}

export function resolvePeriod(
  key: PeriodKey,
  customStart: string,
  customEnd: string,
): Period {
  const now = dayDate(TODAY);
  const date = now.getDate();
  const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (key === "today") {
    return {
      key,
      from: TODAY,
      to: TODAY,
      length: 1,
      elapsed: 1,
      prevFrom: TODAY - 1,
      prevTo: TODAY - 1,
      targetShare: 1 / monthDays,
      label: "Today",
      heading: "DAILY",
      prevLabel: "yesterday",
      prevName: "Yesterday",
      noun: "daily",
      when: "today",
      daysLeft: 0,
    };
  }

  if (key === "week") {
    const weekday = (now.getDay() + 6) % 7;
    const from = TODAY - weekday;
    return {
      key,
      from,
      to: TODAY,
      length: 7,
      elapsed: weekday + 1,
      prevFrom: from - 7,
      prevTo: from - 7 + weekday,
      targetShare: 7 / monthDays,
      label: "This week",
      heading: "WEEKLY",
      prevLabel: weekday ? `last ${WEEKDAYS[0]}–${WEEKDAYS[weekday]}` : `last ${WEEKDAYS[0]}`,
      prevName: "Last week",
      noun: "weekly",
      when: "this week",
      daysLeft: 6 - weekday,
    };
  }

  if (key === "custom") {
    let a = dayIndex(customStart);
    let b = dayIndex(customEnd);
    if (a > b) [a, b] = [b, a];
    a = clamp(a, 0, TODAY);
    b = clamp(b, 0, TODAY);
    const n = b - a + 1;
    return {
      key,
      from: a,
      to: b,
      length: n,
      elapsed: n,
      prevFrom: a - n,
      prevTo: a - 1,
      targetShare: n / monthDays,
      label: `${dayLabel(a)} – ${dayLabel(b)}`,
      heading: "PERIOD",
      prevLabel: `previous ${n} days`,
      prevName: `Previous ${n} days`,
      noun: "period",
      when: "in this period",
      daysLeft: 0,
    };
  }

  const from = TODAY - date + 1;
  const prevFrom = from - new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const prevMonth = dayDate(prevFrom).getMonth();
  return {
    key: "month",
    from,
    to: TODAY,
    length: monthDays,
    elapsed: date,
    prevFrom,
    prevTo: Math.min(prevFrom + date - 1, from - 1),
    targetShare: 1,
    label: MONTH_NAMES[now.getMonth()],
    heading: MONTH_NAMES[now.getMonth()].toUpperCase(),
    prevLabel: `${MONTHS[prevMonth]} 1–${date}`,
    prevName: MONTH_NAMES[prevMonth],
    noun: "monthly",
    when: "this month",
    daysLeft: monthDays - date,
  };
}

// ---- Metrics ----

export interface SoMetric {
  so: SalesOrganizer;
  sales: number;
  /** Target for the period. */
  target: number;
  /** Share of the period target achieved. */
  pct: number;
  /** Sales expected by today at an even pace. */
  expected: number;
  /** Sales as a share of `expected`. */
  pace: number;
  /** Sales over the comparison window. */
  prev: number;
  earnings: number;
  /** One star per ₹1,000 sold. */
  stars: number;
  cat: Category;
  /** Days in the period with at least one sale. */
  activeDays: number;
  /** Position by sales among active organizers who sold; null if unranked. */
  rank: number | null;
}

export function sumDays(days: number[], from: number, to: number): number {
  let total = 0;
  for (let i = Math.max(0, from); i <= to; i++) total += days[i] || 0;
  return total;
}

/** Combined sales of `set` on one day. */
export function dayTotal(set: SoMetric[], index: number): number {
  return set.reduce((sum, m) => sum + (m.so.days[index] || 0), 0);
}

function measure(so: SalesOrganizer, p: Period, th: Thresholds): SoMetric {
  const sales = sumDays(so.days, p.from, p.to);
  const target = Math.round(so.target * p.targetShare);
  const pct = target ? sales / target : 0;
  const expected = (target * p.elapsed) / p.length;
  const pace = expected ? sales / expected : 0;

  let cat: Category = "risk";
  if (pct * 100 >= th.excellentAt) cat = "excellent";
  else if (pace * 100 >= th.onTrackPace) cat = "ontrack";
  else if (pace * 100 >= th.attentionPace) cat = "attention";

  let activeDays = 0;
  for (let i = p.from; i <= p.to; i++) if (so.days[i] > 0) activeDays++;

  return {
    so,
    sales,
    target,
    pct,
    expected,
    pace,
    prev: sumDays(so.days, p.prevFrom, p.prevTo),
    earnings: Math.round(sales * so.rate),
    stars: Math.round(sales / 1000),
    cat,
    activeDays,
    rank: null,
  };
}

export interface Totals {
  sales: number;
  target: number;
  expected: number;
  prev: number;
  earnings: number;
  stars: number;
  pct: number;
  pace: number;
  count: number;
  active: number;
  /** Active organizers with no sales in the period. */
  idle: number;
  /** Mean of each organizer's target share. */
  avgPct: number;
  avgRating: number;
  counts: Record<Category, number>;
}

function aggregate(set: SoMetric[]): Totals {
  const total = (pick: (m: SoMetric) => number) =>
    set.reduce((sum, m) => sum + pick(m), 0);
  const sales = total((m) => m.sales);
  const target = total((m) => m.target);
  const expected = total((m) => m.expected);
  const active = set.filter((m) => m.so.status === "active");
  const counts: Record<Category, number> = { excellent: 0, ontrack: 0, attention: 0, risk: 0 };
  for (const m of set) counts[m.cat]++;
  const n = set.length;
  return {
    sales,
    target,
    expected,
    prev: total((m) => m.prev),
    earnings: total((m) => m.earnings),
    stars: total((m) => m.stars),
    pct: target ? sales / target : 0,
    pace: expected ? sales / expected : 0,
    count: n,
    active: active.length,
    idle: active.filter((m) => m.sales === 0).length,
    avgPct: n ? total((m) => m.pct) / n : 0,
    avgRating: n ? total((m) => m.so.rating) / n : 0,
    counts,
  };
}

export interface TeamView {
  /** Every assigned organizer, unfiltered. */
  metrics: SoMetric[];
  /** Active organizers with sales, best first. */
  ranked: SoMetric[];
  /** The organizer picked in the people filter, if any. */
  selected: SoMetric | null;
  /** Organizers passing the performance and status filters. */
  filtered: SoMetric[];
  /** Whatever the KPIs describe: the selected organizer, or the filtered team. */
  scope: SoMetric[];
  totals: Totals;
  /** A performance or status filter is narrowing the team. */
  isFiltered: boolean;
}

export function analyzeTeam(
  team: SalesOrganizer[],
  period: Period,
  th: Thresholds,
  filters: { person: string; perf: PerfFilter; status: StatusFilter },
): TeamView {
  const metrics = team.map((so) => measure(so, period, th));
  const ranked = metrics
    .filter((m) => m.so.status === "active" && m.sales > 0)
    .sort((a, b) => b.sales - a.sales || b.pct - a.pct);
  ranked.forEach((m, i) => (m.rank = i + 1));

  const selected =
    filters.person === "all"
      ? null
      : (metrics.find((m) => m.so.id === filters.person) ?? null);
  const filtered = metrics.filter(
    (m) =>
      (filters.status === "all" || m.so.status === filters.status) &&
      (filters.perf === "all" || PERF_FILTER[m.cat] === filters.perf),
  );
  const scope = selected ? [selected] : filtered;
  return {
    metrics,
    ranked,
    selected,
    filtered,
    scope,
    totals: aggregate(scope),
    isFiltered: filters.perf !== "all" || filters.status !== "all",
  };
}

/** Pastel avatar tint derived from the organizer's hue. */
export function avatarColors(so: SalesOrganizer): CSSProperties {
  return { background: `hsl(${so.hue} 60% 90%)`, color: `hsl(${so.hue} 45% 28%)` };
}

/** Reward milestones, in percent of target. */
export const MILESTONES = [25, 50, 75, 100] as const;

/** The first milestone `pct` has not reached yet. */
export function nextMilestone(pct: number): number | undefined {
  return MILESTONES.find((m) => pct * 100 < m);
}
