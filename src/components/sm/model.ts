import {
  HISTORY_DAY,
  TODAY_DAY,
  type Csdo,
  type Enrolment,
  type SalesOrganizer,
  type Sdo,
  type SmScope,
} from "@/data/sm";
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
export type TypeFilter = "all" | "csdos" | "sdos" | "direct" | "sos";
export type Status = "excellent" | "on" | "needs" | "risk";
export type StatusFilter = "all" | Status;
export type SortKey = "ach" | "sales" | "earn" | "score";
export type Layout = "grouped" | "combined";
export type ViewKind = "zone" | "csdos" | "csdo" | "sdos" | "sdo" | "direct" | "sos" | "so";

export interface Filters {
  type: TypeFilter;
  csdoId: string;
  sdoId: string;
  soId: string;
  period: PeriodKey;
  from: string;
  to: string;
  status: StatusFilter;
  q: string;
}

export type Place = Pick<Filters, "type" | "csdoId" | "sdoId" | "soId">;

export const DEFAULT_FILTERS: Filters = {
  type: "all",
  csdoId: "",
  sdoId: "",
  soId: "",
  period: "month",
  from: "2026-09-01",
  to: "2026-09-30",
  status: "all",
  q: "",
};

export type ScenarioKey = "A" | "B" | "C";

export const SCENARIOS: Record<
  ScenarioKey,
  { smId: string; title: string; sub: string; probe: string }
> = {
  A: {
    smId: "SM-101",
    title: "A · Kerala Zone",
    sub: "3 CSDO Regions · 26 SOs",
    probe: "SO-2401", // in CSDO-204 (Kannur), outside SM-101's scope!
  },
  B: {
    smId: "SM-102",
    title: "B · Malabar Zone",
    sub: "2 CSDO Regions · 13 SOs",
    probe: "SO-2101", // in Thrissur, outside SM-102's scope!
  },
  C: {
    smId: "SM-103",
    title: "C · Central Zone",
    sub: "2 CSDO Regions · 15 SOs",
    probe: "SO-2201", // in Kozhikode, outside SM-103's scope!
  },
};

// ---- Status Styling & Thresholds ----

export interface StatusStyle {
  label: string;
  dot: string;
  bg: string;
  ink: string;
}

export const STATUSES: Status[] = ["excellent", "on", "needs", "risk"];

export const STATUS: Record<Status, StatusStyle & { rule: string }> = {
  excellent: {
    label: "Excellent",
    dot: "#1FA971",
    bg: "#E7F6EE",
    ink: "#11734A",
    rule: "≥100% of target due",
  },
  on: {
    label: "On Track",
    dot: "#2F80ED",
    bg: "#E9F1FD",
    ink: "#1F5FBF",
    rule: "80–99% of target due",
  },
  needs: {
    label: "Needs Attention",
    dot: "#E08A1E",
    bg: "#FFF1E0",
    ink: "#9A5300",
    rule: "60–79% of target due",
  },
  risk: {
    label: "At Risk",
    dot: "#E5484D",
    bg: "#FDECEC",
    ink: "#B42328",
    rule: "Below 60% of target due",
  },
};

export const NO_STATUS: StatusStyle = {
  label: "No team yet",
  dot: "#C9CED8",
  bg: "#F1F0EC",
  ink: "#5B6070",
};

export function statusOf(pace: number): Status {
  return pace >= 1 ? "excellent" : pace >= 0.8 ? "on" : pace >= 0.6 ? "needs" : "risk";
}

export const MILESTONES = [0.25, 0.5, 0.75, 1] as const;

export function nextMilestone(ach: number): number | undefined {
  return MILESTONES.find((x) => ach < x);
}

// ---- Reporting Range ----

export interface Range {
  from: number;
  to: number;
  through: number;
  label: string;
  title: string;
  prev: [number, number] | null;
  prevLabel: string;
  elapsed: number;
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

// ---- Metric Types ----

export interface SoMetric extends SalesOrganizer {
  sales: number;
  earn: number;
  count: number;
  prevSales: number;
  target: number;
  expected: number;
  ach: number;
  pace: number;
  status: Status;
  daily: number[];
  enrolments: Enrolment[];
  csdoId: string;
  sdoId?: string;
  isDirect: boolean;
}

export interface Aggregate {
  n: number;
  sales: number;
  target: number;
  expected: number;
  earn: number;
  prevSales: number;
  count: number;
  ach: number;
  pace: number;
  avgAch: number;
  rating: number;
  status: Status | null;
  counts: Record<Status, number>;
  daily: number[];
}

export interface SdoMetric extends Aggregate, Sdo {
  team: SoMetric[];
  visits: number;
  visitsDue: number;
}

export interface CsdoMetric extends Aggregate, Csdo {
  sdos: SdoMetric[];
  directSos: SoMetric[];
  allSos: SoMetric[];
  visits: number;
  visitsDue: number;
}

function soMetric(scope: SmScope, so: SalesOrganizer, range: Range): SoMetric {
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
    if (range.prev && t.day >= range.prev[0] && t.day <= range.prev[1]) {
      prevSales += t.amount;
    }
  }

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

  const rel = scope.rel[so.id];
  const isDirect = rel?.type === "csdo-direct";
  const csdoId = rel?.csdoId || "";
  const sdoId = rel?.type === "sdo" ? rel.sdoId : undefined;

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
    csdoId,
    sdoId,
    isDirect,
  };
}

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
    o.daily = o.n === 1 ? m.daily.slice() : o.daily.map((v, i) => v + (m.daily[i] || 0));
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

export function byKey(key: SortKey) {
  return (
    a: { id: string; ach: number; sales: number; earn: number; rating: number },
    b: { id: string; ach: number; sales: number; earn: number; rating: number }
  ) => (key === "score" ? b.rating - a.rating : b[key] - a[key]) || (a.id < b.id ? -1 : 1);
}

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "ach", label: "Target %" },
  { key: "sales", label: "Sales" },
  { key: "earn", label: "Earnings" },
  { key: "score", label: "Score" },
];

// ---- Comprehensive SM Analysis ----

export interface RelationTag {
  label: string;
  bg: string;
  ink: string;
}

export interface ChainNode {
  role: string;
  name: string;
  id: string;
  bg: string;
  ink: string;
  bd: string;
}

export interface SmAnalysis {
  range: Range;
  view: ViewKind;
  csdo: CsdoMetric | null;
  sdo: SdoMetric | null;
  so: SoMetric | null;
  metrics: Record<string, SoMetric>;
  csdos: CsdoMetric[];
  csdoById: Record<string, CsdoMetric>;
  sdos: SdoMetric[];
  sdoById: Record<string, SdoMetric>;
  allSos: SoMetric[];
  directSos: SoMetric[];
  indirectSos: SoMetric[];
  baseSos: SoMetric[];
  inViewSos: SoMetric[];
  statusOn: boolean;
  totals: Aggregate;
  baseTotals: Aggregate;
  soRank: number;
  sdoRank: number;
  csdoRank: number;
  visitsDone: number;
  visitsDue: number;
  relation(soId: string): RelationTag;
  chain(soId: string): ChainNode[];
}

export function analyzeSm(scope: SmScope, filters: Filters): SmAnalysis {
  const range = resolveRange(filters.period, filters.from, filters.to);

  // 1. Calculate each SO's metrics
  const metrics: Record<string, SoMetric> = {};
  for (const so of scope.sos) {
    metrics[so.id] = soMetric(scope, so, range);
  }

  // 2. Build SDO metrics
  const sdoById: Record<string, SdoMetric> = {};
  const sdos = scope.sdos.map((d) => {
    const team = scope.teamOf(d.id).map((p) => metrics[p.id]);
    const days = Math.max(range.through - Math.max(range.from, parseDay(d.joined)) + 1, 0);
    const visits = scope
      .visits(d.id)
      .filter((day) => day >= range.from && day <= range.through).length;
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

  // 3. Build CSDO metrics
  const csdoById: Record<string, CsdoMetric> = {};
  const csdos = scope.csdos.map((c) => {
    const cSdos = scope.sdosOf(c.id).map((d) => sdoById[d.id]);
    const directSos = scope.directSosOf(c.id).map((p) => metrics[p.id]);
    const allSos = scope.allSosOf(c.id).map((p) => metrics[p.id]);
    const visits = cSdos.reduce((t, d) => t + d.visits, 0);
    const visitsDue = cSdos.reduce((t, d) => t + d.visitsDue, 0);

    const metric: CsdoMetric = {
      ...aggregate(allSos),
      ...c,
      sdos: cSdos,
      directSos,
      allSos,
      visits,
      visitsDue,
    };
    csdoById[c.id] = metric;
    return metric;
  });

  // 4. Determine Active View Kind
  const soId = filters.soId && scope.rel[filters.soId] ? filters.soId : "";
  const sdoId = filters.sdoId && sdoById[filters.sdoId] ? filters.sdoId : "";
  const csdoId = filters.csdoId && csdoById[filters.csdoId] ? filters.csdoId : "";

  let view: ViewKind;
  if (soId) {
    view = "so";
  } else if (sdoId) {
    view = "sdo";
  } else if (csdoId) {
    view = "csdo";
  } else if (filters.type === "csdos") {
    view = "csdos";
  } else if (filters.type === "sdos") {
    view = "sdos";
  } else if (filters.type === "direct") {
    view = "direct";
  } else if (filters.type === "sos") {
    view = "sos";
  } else {
    view = "zone";
  }

  const allSos = scope.sos.map((p) => metrics[p.id]);
  const directSos = allSos.filter((m) => m.isDirect);
  const indirectSos = allSos.filter((m) => !m.isDirect);

  // 5. Compute base set of SOs for the current view
  let baseSos: SoMetric[];
  if (view === "so") {
    baseSos = [metrics[soId]];
  } else if (view === "sdo") {
    baseSos = sdoById[sdoId].team;
  } else if (view === "csdo") {
    baseSos = csdoById[csdoId].allSos;
  } else if (view === "direct") {
    baseSos = directSos;
  } else if (view === "sdos") {
    baseSos = indirectSos;
  } else {
    baseSos = allSos;
  }

  // 6. Apply Status Filter
  const statusOn = filters.status !== "all" && view !== "so";
  let inViewSos = baseSos;
  if (statusOn) {
    inViewSos = baseSos.filter((m) => m.status === filters.status);
  }

  const soRank = soId
    ? allSos
        .slice()
        .sort(byKey("ach"))
        .findIndex((m) => m.id === soId) + 1
    : 0;

  const sdoRank = sdoId
    ? sdos
        .slice()
        .sort(byKey("ach"))
        .findIndex((d) => d.id === sdoId) + 1
    : 0;

  const csdoRank = csdoId
    ? csdos
        .slice()
        .sort(byKey("ach"))
        .findIndex((c) => c.id === csdoId) + 1
    : 0;

  // Visit compliance in view
  const inViewSdos =
    view === "sdo"
      ? [sdoById[sdoId]]
      : view === "csdo"
        ? csdoById[csdoId].sdos
        : sdos;
  const visitsDone = inViewSdos.reduce((t, d) => t + d.visits, 0);
  const visitsDue = inViewSdos.reduce((t, d) => t + d.visitsDue, 0);

  return {
    range,
    view,
    csdo: csdoId ? csdoById[csdoId] : null,
    sdo: sdoId ? sdoById[sdoId] : null,
    so: soId ? metrics[soId] : null,
    metrics,
    csdos,
    csdoById,
    sdos,
    sdoById,
    allSos,
    directSos,
    indirectSos,
    baseSos,
    inViewSos,
    statusOn,
    totals: aggregate(inViewSos),
    baseTotals: aggregate(baseSos),
    soRank,
    sdoRank,
    csdoRank,
    visitsDone,
    visitsDue,
    relation: (id: string): RelationTag => {
      const rel = scope.rel[id];
      if (!rel) return { label: "Unknown", bg: "#F1F0EC", ink: "#5B6070" };
      if (rel.type === "csdo-direct") {
        const c = csdoById[rel.csdoId];
        return {
          label: `CSDO Direct · ${c ? firstName(c.name) : "Direct"}`,
          bg: "#EEEDFC",
          ink: "#4B3FC7",
        };
      }
      const s = sdoById[rel.sdoId];
      return {
        label: `SDO · ${s ? firstName(s.name) : "SDO"}`,
        bg: "#F7E9F4",
        ink: "#8E3479",
      };
    },
    chain: (id: string): ChainNode[] => {
      const rel = scope.rel[id];
      const so = metrics[id];
      if (!rel || !so) return [];

      const csdo = csdoById[rel.csdoId];
      const sdo = rel.type === "sdo" ? sdoById[rel.sdoId] : null;

      const nodes: ChainNode[] = [
        {
          role: "SALES MANAGER",
          name: scope.sm.name,
          id: scope.sm.id,
          bg: "#0F172A",
          ink: "#FFFFFF",
          bd: "#0F172A",
        },
      ];

      if (csdo) {
        nodes.push({
          role: "CHIEF SDO",
          name: csdo.name,
          id: csdo.id,
          bg: "#11734A",
          ink: "#FFFFFF",
          bd: "#0D5939",
        });
      }

      if (sdo) {
        nodes.push({
          role: "SDO SUPERVISOR",
          name: sdo.name,
          id: sdo.id,
          bg: "#F7E9F4",
          ink: "#8E3479",
          bd: "#EBD3E5",
        });
      }

      nodes.push({
        role: so.isDirect ? "DIRECT SO" : "SALES ORGANIZER",
        name: so.name,
        id: so.id,
        bg: so.isDirect ? "#EEEDFC" : "#FFFFFF",
        ink: so.isDirect ? "#4B3FC7" : "#1D2334",
        bd: so.isDirect ? "#D9D7F6" : "#E6E3DB",
      });

      return nodes;
    },
  };
}

export const VIEW_TAG: Record<ViewKind, string> = {
  zone: "ZONE OVERVIEW",
  csdos: "CSDO REGIONS",
  csdo: "CSDO REGION",
  sdos: "SDO TEAMS",
  sdo: "SDO TEAM",
  direct: "DIRECT SOs",
  sos: "ALL SOs",
  so: "INDIVIDUAL SO",
};

// ---- Executive Insights Generator ----

export type InsightTone = "gold" | "green" | "orange" | "plum" | "indigo" | "blue";
export type InsightIcon = "trophy" | "trend" | "alert" | "users";

export interface Insight {
  tone: InsightTone;
  icon: InsightIcon;
  kicker: string;
  title: string;
  body: string;
}

export function buildSmInsights(an: SmAnalysis, viewerName: string): Insight[] {
  const out: Insight[] = [];
  const add = (tone: InsightTone, icon: InsightIcon, kicker: string, title: string, body: string) =>
    out.push({ tone, icon, kicker, title, body });

  const { range, totals: A, inViewSos } = an;
  const next = nextMilestone(A.ach);

  // 1. SO View Insights
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
        `Crossed ${top.at * 100}% milestone on ${dayLabel(top.day)}`,
        `${crossed.length} of 4 milestones unlocked this period`
      );
    } else {
      add(
        "gold",
        "trophy",
        "MILESTONE",
        "First milestone at 25%",
        `${inr(0.25 * m.target - m.sales)} to unlock Rising Star`
      );
    }

    add(
      "indigo",
      "users",
      "STATE RANKING",
      `#${an.soRank} of ${an.allSos.length} SOs across ${firstName(viewerName)}'s zone`,
      `Ranked by target achievement · ${range.label}`
    );

    return out;
  }

  // 2. Zone / Regional Insights
  if (!A.n) return out;

  // Milestone Progress
  const reached = [1, 0.75, 0.5, 0.25].find((x) => A.ach >= x);
  const noun =
    an.view === "zone"
      ? "Zone operations"
      : an.view === "csdo"
        ? `${an.csdo?.name}'s region`
        : an.view === "sdo"
          ? `${an.sdo?.name}'s team`
          : "Workforce";

  add(
    "gold",
    "trophy",
    "ZONE MILESTONE",
    reached ? `${noun} crossed the ${reached * 100}% milestone` : `${noun} is tracking toward 25%`,
    next
      ? `${inr(next * A.target - A.sales)} more to unlock ${next * 100}% target`
      : "Full monthly target achieved! Outstanding performance."
  );

  // Leading CSDO Region
  if (an.csdos.length > 1 && (an.view === "zone" || an.view === "csdos")) {
    const sortedCsdos = an.csdos.slice().sort(byKey("ach"));
    const lead = sortedCsdos[0];
    if (lead) {
      add(
        "green",
        "trophy",
        "TOP CSDO REGION",
        `${lead.region} leads at ${percent(lead.ach)} of target`,
        `Led by CSDO ${lead.name} · ${inrShort(lead.sales)} generated with ${lead.n} SOs`
      );
    }
  }

  // Field Coaching Compliance Warning
  if (an.visitsDue > 0) {
    const visitPace = an.visitsDone / an.visitsDue;
    if (visitPace < 0.8) {
      add(
        "orange",
        "alert",
        "COACHING COMPLIANCE",
        `${an.visitsDone} of ${an.visitsDue} field visits completed (${percent(visitPace)})`,
        "SDO field coaching is lagging target (3 visits/week per SDO). Review flagged teams."
      );
    } else {
      add(
        "plum",
        "users",
        "FIELD COACHING",
        `${an.visitsDone} coaching visits conducted across SDO teams`,
        `On track at ${percent(visitPace)} of coaching schedule due`
      );
    }
  }

  // Top Frontline Producer
  const hit = inViewSos.filter((m) => m.ach >= 1);
  if (hit.length) {
    add(
      "indigo",
      "trophy",
      "TARGET ACHIEVERS",
      `${hit.length} ${plural(hit.length, "SO")} exceeded 100% target`,
      hit
        .slice(0, 3)
        .map((m) => shortName(m.name))
        .join(", ") + (hit.length > 3 ? ` and ${hit.length - 3} more` : "")
    );
  }

  // At-Risk Intervention Alert
  const risk = inViewSos.filter((m) => m.status === "risk").length;
  if (risk > 0) {
    add(
      "orange",
      "alert",
      "NEEDS INTERVENTION",
      `${risk} ${plural(risk, "SO")} below 60% of expected target due`,
      "Filter by At Risk below to review individuals and regional supervisors."
    );
  }

  return out;
}

// ---- Visual Presentation Utilities ----

const AVATARS: [bg: string, ink: string][] = [
  ["#E8F0FE", "#2557B5"],
  ["#FDECEF", "#B4304B"],
  ["#E7F6EE", "#11734A"],
  ["#FFF3DC", "#8A5A00"],
  ["#EFEAFD", "#5B3CC4"],
  ["#E3F4F6", "#0E6E78"],
];

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

export function rankStyle(index: number): RankStyle {
  return (
    PODIUM[index] ?? {
      badgeBg: "#F1F0EC",
      badgeInk: "#5B6070",
      cardBg: "#FFFFFF",
      cardBd: "#ECE9E2",
    }
  );
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function firstName(name: string): string {
  return name.split(" ")[0];
}

export function longDate(iso: string): string {
  return `${dayLabel(parseDay(iso))} ${iso.slice(0, 4)}`;
}
