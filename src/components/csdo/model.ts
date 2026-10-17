import {
  HISTORY_DAY,
  TODAY_DAY,
  type Enrolment,
  type SalesOrganizer,
  type Scope,
  type Sdo,
} from "@/data/csdo";
import {
  MONTHS,
  MONTH_NAMES,
  dayLabel,
  dayOf,
  daysInMonth,
  parseDay,
  weekdayIndex,
  ymd,
} from "@/lib/calendar";
import { initials, inr, inrShort, percent, shortName } from "@/lib/format";
import { hashString } from "@/lib/random";

export type PeriodKey = "today" | "week" | "month" | "quarter" | "custom";
/** Which associates the people filter narrows to. */
export type TypeFilter = "all" | "direct" | "sdos" | "indirect";
export type Status = "excellent" | "on" | "needs" | "risk";
export type StatusFilter = "all" | Status;
export type SortKey = "ach" | "sales" | "earn" | "score";
export type Layout = "grouped" | "combined";
/** Reporting-line chips on the combined SO list. */
export type AssignFilter = "all" | "direct" | "sdo";
export type ViewKind = "org" | "direct" | "sdos" | "indirect" | "sdo" | "so";

export interface Filters {
  type: TypeFilter;
  sdoId: string;
  soId: string;
  period: PeriodKey;
  /** Custom range as yyyy-mm-dd. */
  from: string;
  to: string;
  status: StatusFilter;
  q: string;
}

/** The part of the filters that back-navigation restores. */
export type Place = Pick<Filters, "type" | "sdoId" | "soId">;

export const DEFAULT_FILTERS: Filters = {
  type: "all",
  sdoId: "",
  soId: "",
  period: "month",
  from: "2026-09-01",
  to: "2026-09-30",
  status: "all",
  q: "",
};

export type ScenarioKey = "A" | "B" | "C";

/** Demo org shapes, each viewed as a different CSDO. */
export const SCENARIOS: Record<
  ScenarioKey,
  { csdoId: string; title: string; sub: string; /** An SO outside this CSDO's scope. */ probe: string }
> = {
  A: { csdoId: "CSDO-201", title: "A · Direct only", sub: "6 direct SOs", probe: "SO-2304" },
  B: { csdoId: "CSDO-202", title: "B · SDO teams", sub: "3 SDOs · 11 SOs", probe: "SO-2101" },
  C: { csdoId: "CSDO-203", title: "C · Mixed", sub: "3 direct + 3 SDOs", probe: "SO-2201" },
};

// ---- Status ----

export interface StatusStyle {
  label: string;
  dot: string;
  bg: string;
  ink: string;
}

export const STATUSES: Status[] = ["excellent", "on", "needs", "risk"];

export const STATUS: Record<Status, StatusStyle & { rule: string }> = {
  excellent: { label: "Excellent", dot: "#1FA971", bg: "#E7F6EE", ink: "#11734A", rule: "≥100% of target due" },
  on: { label: "On Track", dot: "#2F80ED", bg: "#E9F1FD", ink: "#1F5FBF", rule: "80–99% of target due" },
  needs: { label: "Needs Attention", dot: "#E08A1E", bg: "#FFF1E0", ink: "#9A5300", rule: "60–79% of target due" },
  risk: { label: "At Risk", dot: "#E5484D", bg: "#FDECEC", ink: "#B42328", rule: "Below 60% of target due" },
};

/** An SDO with no team has no sales status. */
export const NO_STATUS: StatusStyle = { label: "No team yet", dot: "#C9CED8", bg: "#F1F0EC", ink: "#5B6070" };

/** Status compares sales with the target due to date, not the whole period's target. */
export function statusOf(pace: number): Status {
  return pace >= 1 ? "excellent" : pace >= 0.8 ? "on" : pace >= 0.6 ? "needs" : "risk";
}

export const MILESTONES = [0.25, 0.5, 0.75, 1] as const;

/** The first milestone not yet reached, or undefined once the target is hit. */
export function nextMilestone(ach: number): number | undefined {
  return MILESTONES.find((x) => ach < x);
}

// ---- Reporting period ----

export interface Range {
  /** First and last day of the period, inclusive. */
  from: number;
  to: number;
  /** Last day with data: the period's end or today, whichever is earlier. */
  through: number;
  /** "October", "This week · 12 Oct – 18 Oct", … */
  label: string;
  /** "OCTOBER", "THIS WEEK", "Q3 FY27", … */
  title: string;
  /** The comparison window, when there is one. */
  prev: [number, number] | null;
  prevLabel: string;
  /** Share of the period elapsed, today included. */
  elapsed: number;
  /** The period runs past today. */
  open: boolean;
}

export function resolveRange(period: PeriodKey, customFrom: string, customTo: string): Range {
  const T = TODAY_DAY;
  const [y, m] = ymd(T);
  let from: number;
  let to: number;
  let label: string;
  let title: string;
  let prev: [number, number] | null = null;
  let prevLabel = "";

  if (period === "today") {
    from = to = T;
    label = `Today, ${dayLabel(T)}`;
    title = "TODAY";
    prev = [T - 1, T - 1];
    prevLabel = "yesterday";
  } else if (period === "week") {
    from = T - weekdayIndex(T);
    to = from + 6;
    label = `This week · ${dayLabel(from)} – ${dayLabel(to)}`;
    title = "THIS WEEK";
    prev = [from - 7, T - 7];
    prevLabel = "same days last week";
  } else if (period === "month") {
    from = dayOf(y, m, 1);
    to = dayOf(y, m + 1, 0);
    label = MONTH_NAMES[m];
    title = MONTH_NAMES[m].toUpperCase();
    const prevStart = dayOf(y, m - 1, 1);
    prev = [prevStart, Math.min(prevStart + (T - from), from - 1)];
    prevLabel = `${MONTHS[(m + 11) % 12]} 1–${prev[1] - prevStart + 1}`;
  } else if (period === "quarter") {
    // Financial quarters start in April.
    const qStart = m - ((m + 9) % 3);
    from = dayOf(y, qStart, 1);
    to = dayOf(y, qStart + 3, 0);
    const q = Math.floor(((qStart + 9) % 12) / 3) + 1;
    const fy = String((qStart >= 3 ? y + 1 : y) % 100);
    label = `Q${q} FY${fy} · ${MONTHS[qStart]}–${MONTHS[(qStart + 2) % 12]}`;
    title = `Q${q} FY${fy}`;
    const prevStart = dayOf(y, qStart - 3, 1);
    prev = [prevStart, prevStart + (T - from)];
    prevLabel = "same days last quarter";
  } else {
    let a = Math.max(parseDay(customFrom || "2026-09-01"), HISTORY_DAY);
    let b = Math.min(customTo ? parseDay(customTo) : T, T);
    if (b < a) [a, b] = [b, a];
    from = Math.max(a, HISTORY_DAY);
    to = Math.max(b, from);
    label = `${dayLabel(from)} – ${dayLabel(to)}`;
    title = "CUSTOM RANGE";
    const length = to - from + 1;
    if (from - length >= HISTORY_DAY) {
      prev = [from - length, from - 1];
      prevLabel = `previous ${length} days`;
    }
  }

  const through = Math.min(to, T);
  return {
    from,
    to,
    through,
    label,
    title,
    prev,
    prevLabel,
    elapsed: (through - from + 1) / (to - from + 1),
    open: to > T,
  };
}

// ---- Metrics ----

export interface SoMetric extends SalesOrganizer {
  sales: number;
  earn: number;
  /** Enrolments in the period. */
  count: number;
  /** Sales in the comparison window. */
  prevSales: number;
  /** Target for the whole period. */
  target: number;
  /** Target due by today. */
  expected: number;
  /** Sales over the period's target. */
  ach: number;
  /** Sales over the target due by today. */
  pace: number;
  status: Status;
  /** Sales per day from the period's start through today. */
  daily: number[];
  enrolments: Enrolment[];
}

export interface Aggregate {
  /** Unique SOs counted. */
  n: number;
  sales: number;
  target: number;
  expected: number;
  earn: number;
  prevSales: number;
  count: number;
  ach: number;
  pace: number;
  /** Unweighted mean of each SO's achievement. */
  avgAch: number;
  rating: number;
  status: Status | null;
  counts: Record<Status, number>;
  daily: number[];
}

export interface SdoMetric extends Aggregate, Sdo {
  team: SoMetric[];
  visits: number;
  /** Three coaching visits a week, counted from the later of the period start and joining. */
  visitsDue: number;
}

function soMetric(scope: Scope, so: SalesOrganizer, range: Range): SoMetric {
  const daily = new Array<number>(Math.max(range.through - range.from + 1, 0)).fill(0);
  const enrolments: Enrolment[] = [];
  let sales = 0;
  let earn = 0;
  let prevSales = 0;
  for (const t of scope.txns(so.id)) {
    if (t.day >= range.from && t.day <= range.through) {
      sales += t.amount;
      earn += t.earning;
      daily[t.day - range.from] += t.amount;
      enrolments.push(t);
    }
    if (range.prev && t.day >= range.prev[0] && t.day <= range.prev[1]) prevSales += t.amount;
  }

  // Monthly targets accrue day by day, so ranges spanning months stay fair.
  let target = 0;
  let expected = 0;
  for (let day = range.from; day <= range.to; day++) {
    const share = so.monthlyTarget / daysInMonth(day);
    target += share;
    if (day <= range.through) expected += share;
  }
  target = Math.round(target);
  expected = Math.round(expected);
  const pace = expected ? sales / expected : 0;

  return {
    ...so,
    sales,
    earn,
    count: enrolments.length,
    prevSales,
    target,
    expected,
    ach: target ? sales / target : 0,
    pace,
    status: statusOf(pace),
    daily,
    enrolments,
  };
}

/** Totals over a set of SOs, counting each SO once however it was reached. */
export function aggregate(list: SoMetric[]): Aggregate {
  const seen = new Set<string>();
  const o = {
    n: 0,
    sales: 0,
    target: 0,
    expected: 0,
    earn: 0,
    prevSales: 0,
    count: 0,
    counts: { excellent: 0, on: 0, needs: 0, risk: 0 },
    daily: [] as number[],
  };
  let achSum = 0;
  let ratingSum = 0;
  for (const m of list) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    o.n++;
    o.sales += m.sales;
    o.target += m.target;
    o.expected += m.expected;
    o.earn += m.earn;
    o.prevSales += m.prevSales;
    o.count += m.count;
    achSum += m.ach;
    ratingSum += m.rating;
    o.counts[m.status]++;
    o.daily = o.n === 1 ? m.daily.slice() : o.daily.map((v, i) => v + m.daily[i]);
  }
  const pace = o.expected ? o.sales / o.expected : 0;
  return {
    ...o,
    ach: o.target ? o.sales / o.target : 0,
    pace,
    avgAch: o.n ? achSum / o.n : 0,
    rating: o.n ? ratingSum / o.n : 0,
    status: o.n ? statusOf(pace) : null,
  };
}

/** Highest first by `key`, ties broken by id so the order is stable. */
export function byKey(key: SortKey) {
  return (
    a: { id: string; ach: number; sales: number; earn: number; rating: number },
    b: { id: string; ach: number; sales: number; earn: number; rating: number },
  ) => (key === "score" ? b.rating - a.rating : b[key] - a[key]) || (a.id < b.id ? -1 : 1);
}

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "ach", label: "Target %" },
  { key: "sales", label: "Sales" },
  { key: "earn", label: "Earnings" },
  { key: "score", label: "Score" },
];

// ---- Analysis of the current view ----

export interface RelationTag {
  label: string;
  bg: string;
  ink: string;
}

export const DIRECT_TAG: RelationTag = { label: "Direct", bg: "#EEEDFC", ink: "#4B3FC7" };

export interface Analysis {
  range: Range;
  view: ViewKind;
  /** The SO or SDO being viewed, when it is in scope. */
  so: SoMetric | null;
  sdo: SdoMetric | null;
  metrics: Record<string, SoMetric>;
  sdos: SdoMetric[];
  sdoById: Record<string, SdoMetric>;
  all: SoMetric[];
  direct: SoMetric[];
  indirect: SoMetric[];
  /** SOs the view covers, before the status filter. */
  base: SoMetric[];
  /** SOs the view covers after the status filter; the KPIs total these. */
  inView: SoMetric[];
  statusOn: boolean;
  totals: Aggregate;
  baseTotals: Aggregate;
  /** Rank by target achievement among every SO in scope; 0 outside the SO view. */
  soRank: number;
  isDirect(id: string): boolean;
  /** The SDO an SO reports to, if it is not a direct report. */
  sdoOf(id: string): SdoMetric | undefined;
  relation(id: string): RelationTag;
}

const VIEW_OF_TYPE: Record<TypeFilter, ViewKind> = {
  all: "org",
  direct: "direct",
  sdos: "sdos",
  indirect: "indirect",
};

export function analyze(scope: Scope, filters: Filters): Analysis {
  const range = resolveRange(filters.period, filters.from, filters.to);
  const metrics: Record<string, SoMetric> = {};
  for (const so of scope.sos) metrics[so.id] = soMetric(scope, so, range);

  const sdoById: Record<string, SdoMetric> = {};
  const sdos = scope.sdos.map((d) => {
    const team = scope.teamOf(d.id).map((p) => metrics[p.id]);
    const days = Math.max(range.through - Math.max(range.from, parseDay(d.joined)) + 1, 0);
    const visits = scope.visits(d.id).filter((day) => day >= range.from && day <= range.through).length;
    const metric: SdoMetric = {
      ...aggregate(team),
      ...d,
      team,
      visits,
      visitsDue: days ? Math.max(1, Math.round((days * 3) / 7)) : 0,
    };
    sdoById[d.id] = metric;
    return metric;
  });

  const soId = filters.soId && scope.rel[filters.soId] ? filters.soId : "";
  const sdoId = filters.sdoId && sdoById[filters.sdoId] ? filters.sdoId : "";
  const view: ViewKind = soId ? "so" : sdoId ? "sdo" : VIEW_OF_TYPE[filters.type];

  const isDirect = (id: string) => scope.rel[id].type === "direct";
  const sdoOf = (id: string) => {
    const r = scope.rel[id];
    return r?.type === "sdo" ? sdoById[r.sdoId] : undefined;
  };
  const all = scope.sos.map((p) => metrics[p.id]);
  const direct = all.filter((m) => isDirect(m.id));
  const indirect = all.filter((m) => !isDirect(m.id));
  const base =
    view === "org"
      ? all
      : view === "direct"
        ? direct
        : view === "sdos" || view === "indirect"
          ? indirect
          : view === "sdo"
            ? sdoById[sdoId].team
            : [metrics[soId]];

  const statusOn = filters.status !== "all" && view !== "so";
  let inView = base;
  if (statusOn) {
    if (view === "sdos") {
      // On the SDO view the status filter picks whole teams by the team's status.
      const teams = new Set(sdos.filter((d) => d.status === filters.status).map((d) => d.id));
      inView = base.filter((m) => teams.has(sdoOf(m.id)!.id));
    } else {
      inView = base.filter((m) => m.status === filters.status);
    }
  }

  const soRank = soId ? all.slice().sort(byKey("ach")).findIndex((m) => m.id === soId) + 1 : 0;

  return {
    range,
    view,
    so: soId ? metrics[soId] : null,
    sdo: sdoId ? sdoById[sdoId] : null,
    metrics,
    sdos,
    sdoById,
    all,
    direct,
    indirect,
    base,
    inView,
    statusOn,
    totals: aggregate(inView),
    baseTotals: aggregate(base),
    soRank,
    isDirect,
    sdoOf,
    relation: (id) => {
      const sdo = sdoOf(id);
      return sdo
        ? { label: `SDO · ${firstName(sdo.name)}`, bg: "#F7E9F4", ink: "#8E3479" }
        : DIRECT_TAG;
    },
  };
}

/** "ORG", "TEAM", … — the scope tag on KPI cards and the hero. */
export const VIEW_TAG: Record<ViewKind, string> = {
  org: "ORG",
  direct: "DIRECT",
  sdos: "SDO TEAMS",
  indirect: "INDIRECT",
  sdo: "TEAM",
  so: "SO",
};

// ---- Insights ----

export type InsightTone = "gold" | "green" | "orange" | "plum" | "indigo" | "blue";
export type InsightIcon = "trophy" | "trend" | "alert" | "users";

export interface Insight {
  tone: InsightTone;
  icon: InsightIcon;
  kicker: string;
  title: string;
  body: string;
}

const SCOPE_NOUN: Record<ViewKind, string> = {
  org: "Organization",
  direct: "Direct SO group",
  sdos: "SDO teams",
  indirect: "SDO-managed SOs",
  sdo: "Team",
  so: "",
};

/** Milestone, ranking and attention cards for the current view. */
export function buildInsights(an: Analysis, viewerName: string): Insight[] {
  const out: Insight[] = [];
  const add = (tone: InsightTone, icon: InsightIcon, kicker: string, title: string, body: string) =>
    out.push({ tone, icon, kicker, title, body });
  const { range, totals: A, inView } = an;
  const next = nextMilestone(A.ach);

  if (an.so) {
    const m = an.so;
    const crossed: { at: number; day: number }[] = [];
    let cum = 0;
    m.daily.forEach((v, i) => {
      cum += v;
      for (const at of MILESTONES) {
        if (m.target && !crossed.some((c) => c.at === at) && cum >= at * m.target) {
          crossed.push({ at, day: range.from + i });
        }
      }
    });
    const top = crossed[crossed.length - 1];
    if (top) {
      add(
        "gold",
        "trophy",
        "MILESTONE",
        `Crossed the ${top.at * 100}% milestone on ${dayLabel(top.day)}`,
        `${crossed.length} of 4 milestones unlocked this period`,
      );
    } else {
      add("gold", "trophy", "MILESTONE", "First milestone at 25%", `${inr(0.25 * m.target - m.sales)} to go`);
    }
    if (next && top) {
      add(
        "blue",
        "trend",
        "NEXT UP",
        `${inr(next * m.target - m.sales)} to the ${next * 100}% milestone`,
        `Target due by today: ${inr(m.expected)}`,
      );
    }
    add(
      "plum",
      "users",
      "RANKING",
      `#${an.soRank} of ${an.all.length} SOs in ${firstName(viewerName)}'s scope`,
      `Ranked by target achievement · ${range.label}`,
    );
    let best = 0;
    let bestAt = 0;
    m.daily.forEach((v, i) => {
      if (v > best) {
        best = v;
        bestAt = i;
      }
    });
    if (best > 0) {
      add(
        "green",
        "trend",
        "BEST DAY",
        `${inr(best)} on ${dayLabel(range.from + bestAt)}`,
        `${plural(m.count, "enrolment")} this period`,
      );
    }
    return out;
  }

  if (!A.n) return out;
  const noun = SCOPE_NOUN[an.view];
  const reached = [1, 0.75, 0.5, 0.25].find((x) => A.ach >= x);
  add(
    "gold",
    "trophy",
    "MILESTONE",
    reached ? `${noun} crossed the ${reached * 100}% milestone` : `${noun} is working toward 25%`,
    next ? `${inr(next * A.target - A.sales)} to the ${next * 100}% milestone` : "Every milestone unlocked",
  );

  const hit = inView.filter((m) => m.ach >= 1);
  if (hit.length) {
    add(
      "green",
      "trophy",
      "TARGET HIT",
      `${hit.length}${hit.length > 1 ? " SOs have" : " SO has"} reached 100% of target`,
      hit
        .slice(0, 3)
        .map((m) => shortName(m.name))
        .join(", ") + (hit.length > 3 ? ` and ${hit.length - 3} more` : ""),
    );
  } else {
    const lead = inView.slice().sort(byKey("ach"))[0];
    add(
      "blue",
      "trend",
      "CLOSEST TO TARGET",
      `${shortName(lead.name)} leads at ${percent(lead.ach)} of target`,
      `${inr(lead.target - lead.sales)} to reach 100%`,
    );
  }

  if (an.view === "org" || an.view === "sdos") {
    const teams = an.sdos.filter((d) => d.n).sort(byKey("ach"));
    if (teams.length > 1) {
      add(
        "plum",
        "users",
        "SDO TEAMS",
        `${teams[0].name}'s team leads at ${percent(teams[0].ach)}`,
        `${plural(teams.length, "SDO team")} ranked by target achievement`,
      );
    }
  }

  if (an.view === "org") {
    const direct = inView.filter((m) => an.isDirect(m.id));
    const viaSdo = inView.length - direct.length;
    if (direct.length && viaSdo) {
      const sales = direct.reduce((t, m) => t + m.sales, 0);
      add(
        "indigo",
        "users",
        "DIRECT SOs",
        `Direct SOs contribute ${inrShort(sales)} (${A.sales ? percent(sales / A.sales) : "0%"}) of sales`,
        `${direct.length} direct · ${viaSdo} through SDOs · no overlap`,
      );
    }
  }

  const risk = inView.filter((m) => m.status === "risk").length;
  if (risk) {
    add(
      "orange",
      "alert",
      "NEEDS SUPPORT",
      `${risk}${risk > 1 ? " SOs are" : " SO is"} below 60% of target due`,
      `Tap At Risk below to review ${risk > 1 ? "them" : "this SO"}`,
    );
  }
  return out;
}

// ---- Presentation helpers ----

const AVATARS: [bg: string, ink: string][] = [
  ["#E8F0FE", "#2557B5"],
  ["#FDECEF", "#B4304B"],
  ["#E7F6EE", "#11734A"],
  ["#FFF3DC", "#8A5A00"],
  ["#EFEAFD", "#5B3CC4"],
  ["#E3F4F6", "#0E6E78"],
];

/** Initials and a pastel tint picked by id, so a person keeps their colour everywhere. */
export function avatar(person: { id: string; name: string }) {
  const [bg, ink] = AVATARS[hashString(person.id) % AVATARS.length];
  return { initials: initials(person.name).slice(0, 2).toUpperCase(), bg, ink };
}

export interface RankStyle {
  badgeBg: string;
  badgeInk: string;
  cardBg: string;
  cardBd: string;
}

const PODIUM: RankStyle[] = [
  {
    badgeBg: "#F5B829",
    badgeInk: "#3B2A00",
    cardBg: "linear-gradient(180deg,#FFF4D6 0%,#FFFFFF 70%)",
    cardBd: "#F6E3B4",
  },
  {
    badgeBg: "#D5D9E2",
    badgeInk: "#2F3445",
    cardBg: "linear-gradient(180deg,#EEF1F6 0%,#FFFFFF 70%)",
    cardBd: "#E1E5EC",
  },
  {
    badgeBg: "#E9A77B",
    badgeInk: "#4A2410",
    cardBg: "linear-gradient(180deg,#FCEBDF 0%,#FFFFFF 70%)",
    cardBd: "#F3D6C2",
  },
];

/** Gold, silver and bronze for the top three; neutral after. */
export function rankStyle(index: number): RankStyle {
  return (
    PODIUM[index] ?? { badgeBg: "#F1F0EC", badgeInk: "#5B6070", cardBg: "#FFFFFF", cardBd: "#ECE9E2" }
  );
}

/** 1 → "1 SO", 3 → "3 SOs" */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function firstName(name: string): string {
  return name.split(" ")[0];
}

/** "15 Oct 2026" from yyyy-mm-dd. */
export function longDate(iso: string): string {
  return `${dayLabel(parseDay(iso))} ${iso.slice(0, 4)}`;
}
