/**
 * Mock data layer for the CSDO (Chief Sales Development Officer) dashboard:
 * stable IDs, explicit dated reporting assignments, and an enrolment feed
 * that, like the real one, sometimes delivers the same record twice.
 *
 * Authorization lives here. Every read goes through a `Scope` built from the
 * viewer's own assignments, which only returns associates assigned to them
 * directly or through their SDOs; anything else throws `ForbiddenError`.
 * Swap the internals for real fetches; the dashboard only depends on `CsdoApi`.
 */

import { daysInMonth, isoDay, parseDay } from "@/lib/calendar";
import { hashString, seededRandom } from "@/lib/random";
import { homeData, type Slide } from "./home";

export const TODAY = "2026-10-15";
export const TODAY_DAY = parseDay(TODAY);
/** The enrolment feed starts here. */
export const HISTORY_START = "2026-07-01";
export const HISTORY_DAY = parseDay(HISTORY_START);

export interface Csdo {
  id: string;
  name: string;
  region: string;
}

export interface Sdo {
  id: string;
  name: string;
  region: string;
  /** The CSDO this SDO reports to. */
  csdoId: string;
  /** yyyy-mm-dd */
  joined: string;
}

export interface SalesOrganizer {
  id: string;
  name: string;
  loc: string;
  /** Monthly sales target in rupees. */
  monthlyTarget: number;
  /** Performance score on a 1–5 scale. */
  rating: number;
}

export type SupervisorType = "CSDO" | "SDO";

/** One reporting line, valid from `from` through `to` (open-ended when null). */
export interface Assignment {
  id: string;
  soId: string;
  supType: SupervisorType;
  supId: string;
  /** yyyy-mm-dd */
  from: string;
  to: string | null;
}

export interface Enrolment {
  id: string;
  soId: string;
  /** Day number, see `@/lib/calendar`. */
  day: number;
  amount: number;
  earning: number;
}

/** How an SO in scope reaches the viewer today. */
export type Relation =
  | { type: "direct"; assignment: Assignment }
  | { type: "sdo"; sdoId: string; assignment: Assignment };

/** Someone an SO in scope can be reassigned to. */
export interface Supervisor {
  type: SupervisorType;
  id: string;
  label: string;
}

export interface Scope {
  csdo: Csdo;
  sdos: Sdo[];
  /** Every SO reporting to the viewer today, directly or via an SDO. */
  sos: SalesOrganizer[];
  rel: Record<string, Relation>;
  direct: SalesOrganizer[];
  indirect: SalesOrganizer[];
  teamOf(sdoId: string): SalesOrganizer[];
  getSO(id: string): SalesOrganizer;
  /** Enrolments for an SO, de-duplicated across feeds. */
  txns(id: string): Enrolment[];
  /** Days on which an SDO made a coaching visit. */
  visits(sdoId: string): number[];
  /** Every assignment an SO has had, newest first. */
  history(soId: string): Assignment[];
  supervisors: Supervisor[];
}

export class ForbiddenError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`${id} is outside the viewer's reporting scope`);
    this.name = "ForbiddenError";
    this.id = id;
  }
}

export interface CsdoApi {
  /** Announcement slides, shared with the organizer and SDO home screens. */
  getSlides(): Slide[];
  /** Reporting lines as stored; reassignment returns a new list. */
  getAssignments(): Assignment[];
  buildScope(csdoId: string, assignments: Assignment[]): Scope;
  /**
   * Moves an SO to another supervisor in the viewer's scope, effective today.
   * Returns the new assignment list, or null when nothing changes.
   */
  reassign(
    assignments: Assignment[],
    csdoId: string,
    soId: string,
    to: { type: SupervisorType; id: string },
  ): Assignment[] | null;
  /** Feed records dropped because the same enrolment arrived twice. */
  duplicatesIgnored: number;
}

const CSDOS: Csdo[] = [
  { id: "CSDO-201", name: "Deepa Varghese", region: "Thrissur Region" },
  { id: "CSDO-202", name: "Suresh Pillai", region: "Kozhikode Region" },
  { id: "CSDO-203", name: "Lakshmi Menon", region: "Ernakulam Region" },
];

const SDOS: Sdo[] = [
  { id: "SDO-114", name: "Anoop Raj", region: "Kozhikode North", csdoId: "CSDO-202", joined: "2024-02-12" },
  { id: "SDO-115", name: "Fathima Beevi", region: "Kozhikode South", csdoId: "CSDO-202", joined: "2023-08-01" },
  { id: "SDO-116", name: "Manoj Kurup", region: "Vadakara", csdoId: "CSDO-202", joined: "2025-01-06" },
  { id: "SDO-118", name: "Arjun Kumar", region: "Kochi", csdoId: "CSDO-203", joined: "2023-06-19" },
  { id: "SDO-121", name: "Anjali Nair", region: "Aluva", csdoId: "CSDO-203", joined: "2024-04-01" },
  { id: "SDO-124", name: "Joseph Mathew", region: "Muvattupuzha", csdoId: "CSDO-203", joined: "2026-10-05" },
];

/** id, name, location, monthly target, selling strength, rating, supervisor type, supervisor id */
type Row = [string, string, string, number, number, number, SupervisorType, string];

const ROWS: Row[] = [
  ["SO-2101", "Nikhil Thomas", "Chalakudy", 150000, 1.12, 4.6, "CSDO", "CSDO-201"],
  ["SO-2102", "Aswathy Krishnan", "Irinjalakuda", 125000, 0.95, 4.4, "CSDO", "CSDO-201"],
  ["SO-2103", "Jibin Joseph", "Kodungallur", 150000, 0.7, 4.1, "CSDO", "CSDO-201"],
  ["SO-2104", "Reshma Ramesh", "Guruvayur", 100000, 1.28, 4.8, "CSDO", "CSDO-201"],
  ["SO-2105", "Sanjay Das", "Kunnamkulam", 125000, 0.48, 3.8, "CSDO", "CSDO-201"],
  ["SO-2106", "Neethu Paul", "Wadakkanchery", 100000, 0.86, 4.3, "CSDO", "CSDO-201"],
  ["SO-2201", "Shibu Kannan", "Koyilandy", 150000, 1.05, 4.5, "SDO", "SDO-114"],
  ["SO-2202", "Haritha Sunil", "Balussery", 125000, 0.82, 4.2, "SDO", "SDO-114"],
  ["SO-2203", "Muhammed Rafi", "Perambra", 150000, 1.22, 4.7, "SDO", "SDO-114"],
  ["SO-2204", "Divya Prakash", "Thamarassery", 100000, 0.55, 3.9, "SDO", "SDO-114"],
  ["SO-2205", "Akhil Mohan", "Feroke", 125000, 0.92, 4.3, "SDO", "SDO-115"],
  ["SO-2206", "Sreelakshmi Venu", "Ramanattukara", 100000, 1.15, 4.6, "SDO", "SDO-115"],
  ["SO-2207", "Faisal Kareem", "Kunnamangalam", 150000, 0.66, 4.0, "SDO", "SDO-115"],
  ["SO-2208", "Anu Mariam", "Mukkam", 125000, 0.74, 4.1, "SDO", "SDO-115"],
  ["SO-2209", "Vipin Nambiar", "Vadakara", 150000, 0.98, 4.4, "SDO", "SDO-116"],
  ["SO-2210", "Shilpa Rajan", "Nadapuram", 100000, 0.44, 3.7, "SDO", "SDO-116"],
  ["SO-2211", "Rajesh Kumar", "Kuttiady", 125000, 1.08, 4.5, "SDO", "SDO-116"],
  ["SO-2041", "Rahul Menon", "Edappally", 150000, 1.18, 4.7, "CSDO", "CSDO-203"],
  ["SO-2302", "Meera Joseph", "Kakkanad", 125000, 0.88, 4.4, "CSDO", "CSDO-203"],
  ["SO-2303", "Gokul Krishnan", "Tripunithura", 100000, 0.58, 4.0, "CSDO", "CSDO-203"],
  ["SO-2304", "Ayesha Nazar", "Angamaly", 150000, 1.06, 4.8, "SDO", "SDO-118"],
  ["SO-2305", "Vishnu Pillai", "Aluva", 150000, 0.94, 4.4, "SDO", "SDO-118"],
  ["SO-2306", "Sneha Thomas", "Vyttila", 125000, 0.72, 4.2, "SDO", "SDO-118"],
  ["SO-2307", "Sreejith Kumar", "Edappally", 100000, 0.5, 3.9, "SDO", "SDO-118"],
  ["SO-2308", "Arun Mathew", "Kothamangalam", 125000, 1.3, 4.6, "SDO", "SDO-118"],
  ["SO-2309", "Vivek Chandran", "Perumbavoor", 150000, 0.83, 4.3, "SDO", "SDO-121"],
  ["SO-2310", "Anjana Suresh", "Kalamassery", 125000, 1.0, 4.5, "SDO", "SDO-121"],
  ["SO-2311", "Midhun Raj", "Paravur", 100000, 0.62, 4.0, "SDO", "SDO-121"],
  ["SO-2312", "Liya Antony", "Kalady", 125000, 0.4, 3.6, "SDO", "SDO-121"],
];

function createMockApi(): CsdoApi {
  const sos: SalesOrganizer[] = ROWS.map(([id, name, loc, monthlyTarget, , rating]) => ({
    id,
    name,
    loc,
    monthlyTarget,
    rating,
  }));

  const assignments: Assignment[] = ROWS.map(([soId, , , , , , supType, supId], i) => ({
    id: `ASG-${1001 + i}`,
    soId,
    supType,
    supId,
    from: "2025-04-01",
    to: null,
  }));
  // Rahul Menon moved from Anjali Nair's team to Lakshmi Menon directly on 1 Oct.
  assignments.find((a) => a.soId === "SO-2041")!.from = "2026-10-01";
  assignments.push({
    id: "ASG-0950",
    soId: "SO-2041",
    supType: "SDO",
    supId: "SDO-121",
    from: "2025-06-01",
    to: "2026-09-30",
  });

  const feed: Enrolment[] = [];
  for (const [id, , , monthlyTarget, skill] of ROWS) {
    const random = seededRandom(hashString(id));
    for (let day = HISTORY_DAY; day <= TODAY_DAY; day++) {
      let chance = ((monthlyTarget / daysInMonth(day)) * skill * (0.7 + 0.6 * random())) / 14000;
      let k = 0;
      while (chance > 0) {
        if (random() < Math.min(chance, 1)) {
          const amount = Math.round((6000 + random() * 16000) / 500) * 500;
          feed.push({
            id: `TX${id.slice(3)}-${isoDay(day).slice(5).replace("-", "")}-${k}`,
            soId: id,
            day,
            amount,
            earning: Math.round((amount * (0.07 + 0.05 * random())) / 10) * 10,
          });
          k++;
        }
        chance -= 1;
      }
    }
  }
  // The same enrolment arriving twice from two feeds.
  for (const i of [7, 61, 140]) if (feed[i]) feed.push({ ...feed[i] });

  const unique = new Map<string, Enrolment>();
  let duplicates = 0;
  for (const t of feed) {
    if (unique.has(t.id)) duplicates++;
    else unique.set(t.id, t);
  }
  const enrolmentsBySo: Record<string, Enrolment[]> = {};
  for (const t of unique.values()) (enrolmentsBySo[t.soId] ??= []).push(t);

  const visitsBySdo: Record<string, number[]> = {};
  for (const sdo of SDOS) {
    const random = seededRandom(hashString(sdo.id + "v"));
    const days: number[] = [];
    for (let day = Math.max(HISTORY_DAY, parseDay(sdo.joined)); day <= TODAY_DAY; day++) {
      if (random() < 0.48) days.push(day);
    }
    visitsBySdo[sdo.id] = days;
  }

  function buildScope(csdoId: string, list: Assignment[]): Scope {
    const csdo = CSDOS.find((c) => c.id === csdoId);
    if (!csdo) throw new ForbiddenError(csdoId);
    const sdos = SDOS.filter((d) => d.csdoId === csdoId);
    const sdoIds = new Set(sdos.map((d) => d.id));

    const rel: Record<string, Relation> = {};
    for (const a of list) {
      if (a.from > TODAY || (a.to && a.to < TODAY)) continue;
      if (a.supType === "CSDO" && a.supId === csdoId) rel[a.soId] = { type: "direct", assignment: a };
      else if (a.supType === "SDO" && sdoIds.has(a.supId))
        rel[a.soId] = { type: "sdo", sdoId: a.supId, assignment: a };
    }
    const inScope = sos.filter((p) => rel[p.id]);
    const guard = (id: string) => {
      if (!rel[id] && !sdoIds.has(id)) throw new ForbiddenError(id);
    };

    return {
      csdo,
      sdos,
      sos: inScope,
      rel,
      direct: inScope.filter((p) => rel[p.id].type === "direct"),
      indirect: inScope.filter((p) => rel[p.id].type === "sdo"),
      teamOf: (sdoId) => {
        guard(sdoId);
        return inScope.filter((p) => {
          const r = rel[p.id];
          return r.type === "sdo" && r.sdoId === sdoId;
        });
      },
      getSO: (id) => {
        if (!rel[id]) throw new ForbiddenError(id);
        return sos.find((p) => p.id === id)!;
      },
      txns: (id) => {
        guard(id);
        return enrolmentsBySo[id] ?? [];
      },
      visits: (sdoId) => {
        guard(sdoId);
        return visitsBySdo[sdoId] ?? [];
      },
      history: (soId) => {
        guard(soId);
        return list.filter((a) => a.soId === soId).sort((x, y) => (x.from < y.from ? 1 : -1));
      },
      supervisors: [
        { type: "CSDO" as const, id: csdoId, label: `${csdo.name} (CSDO) · direct` },
        ...sdos.map((d) => ({ type: "SDO" as const, id: d.id, label: `SDO ${d.name}` })),
      ],
    };
  }

  function reassign(
    list: Assignment[],
    csdoId: string,
    soId: string,
    to: { type: SupervisorType; id: string },
  ): Assignment[] | null {
    const scope = buildScope(csdoId, list);
    scope.getSO(soId);
    if (!scope.supervisors.some((s) => s.type === to.type && s.id === to.id)) {
      throw new ForbiddenError(to.id);
    }
    const current = scope.rel[soId].assignment;
    if (current.supType === to.type && current.supId === to.id) return null;

    // A line that only started today is replaced; an older one is closed yesterday.
    const kept = list
      .filter((a) => !(a === current && a.from === TODAY))
      .map((a) => (a === current ? { ...a, to: isoDay(TODAY_DAY - 1) } : a));
    return kept.concat({
      id: `ASG-${2000 + kept.length}`,
      soId,
      supType: to.type,
      supId: to.id,
      from: TODAY,
      to: null,
    });
  }

  return {
    getSlides: () => homeData.slides,
    getAssignments: () => assignments.slice(),
    buildScope,
    reassign,
    duplicatesIgnored: duplicates,
  };
}

export const csdoApi: CsdoApi = createMockApi();
