/**
 * Mock data layer for the SM (Sales Manager) dashboard.
 *
 * An SM is the direct supervisor of Chief Sales Development Officers (CSDOs),
 * overseeing multi-regional sales operations (e.g. statewide zones).
 *
 * Under the SM:
 *   SM -> CSDOs -> SDOs -> Sales Organizers (SOs)
 *               -> Direct Sales Organizers (SOs)
 *
 * Full scoped authorization: Every read passes through an `SmScope` constructed
 * from the SM's authorized assignments. Accessing an out-of-scope CSDO, SDO,
 * or SO raises a typed `ForbiddenError`.
 */

import { daysInMonth, isoDay, parseDay } from "@/lib/calendar";
import { hashString, seededRandom } from "@/lib/random";
import { homeData, type Slide } from "./home";
import {
  TODAY,
  TODAY_DAY,
  HISTORY_START,
  HISTORY_DAY,
  type Csdo,
  type Sdo,
  type SalesOrganizer,
  type SupervisorType,
  type Enrolment,
  ForbiddenError,
} from "./csdo";

export { TODAY, TODAY_DAY, HISTORY_START, HISTORY_DAY, ForbiddenError };
export type { Csdo, Sdo, SalesOrganizer, SupervisorType, Enrolment };

export interface SalesManager {
  id: string;
  name: string;
  zone: string;
  title: string;
  email: string;
  phone: string;
  joined: string;
}

/** Extended supervisor types for assignments */
export type SmSupervisorType = "SM" | "CSDO" | "SDO";

export interface SmAssignment {
  id: string;
  soId: string;
  supType: SmSupervisorType;
  supId: string;
  from: string;
  to: string | null;
}

export interface SdoAssignment {
  id: string;
  sdoId: string;
  csdoId: string;
  from: string;
  to: string | null;
}

export type SmRelation =
  | { type: "csdo-direct"; csdoId: string; assignment: SmAssignment }
  | { type: "sdo"; csdoId: string; sdoId: string; assignment: SmAssignment };

export interface SmSupervisorOption {
  type: SmSupervisorType;
  id: string;
  label: string;
  sub: string;
}

export interface SmScope {
  sm: SalesManager;
  csdos: Csdo[];
  sdos: Sdo[];
  sos: SalesOrganizer[];
  rel: Record<string, SmRelation>;
  sdoToCsdo: Record<string, string>;
  
  /** Direct SOs reporting directly to a CSDO (not under an SDO) */
  directSosOf(csdoId: string): SalesOrganizer[];
  /** SDOs reporting under a given CSDO */
  sdosOf(csdoId: string): Sdo[];
  /** SOs reporting under an SDO */
  teamOf(sdoId: string): SalesOrganizer[];
  /** All SOs within a CSDO region (direct + SDO teams) */
  allSosOf(csdoId: string): SalesOrganizer[];

  getCsdo(id: string): Csdo;
  getSdo(id: string): Sdo;
  getSO(id: string): SalesOrganizer;

  txns(soId: string): Enrolment[];
  visits(sdoId: string): number[];
  history(soId: string): SmAssignment[];
  
  supervisors: SmSupervisorOption[];
}

export interface SmApi {
  getSlides(): Slide[];
  getAssignments(): SmAssignment[];
  getSdoAssignments(): SdoAssignment[];
  buildScope(smId: string, soAssignments: SmAssignment[], sdoAssignments: SdoAssignment[]): SmScope;
  reassignSo(
    soAssignments: SmAssignment[],
    smId: string,
    soId: string,
    to: { type: SmSupervisorType; id: string }
  ): SmAssignment[] | null;
  reassignSdo(
    sdoAssignments: SdoAssignment[],
    smId: string,
    sdoId: string,
    toCsdoId: string
  ): SdoAssignment[] | null;
  duplicatesIgnored: number;
}

// -------------------------------------------------------------
// Base Master Data
// -------------------------------------------------------------

export const SALES_MANAGERS: SalesManager[] = [
  {
    id: "SM-101",
    name: "Rajesh Nair",
    zone: "Kerala State Operations",
    title: "State Sales Manager",
    email: "rajesh.nair@ayadi.in",
    phone: "+91 98470 12345",
    joined: "2022-03-15",
  },
  {
    id: "SM-102",
    name: "Harikrishnan P.",
    zone: "Malabar & Coastal Zone",
    title: "Regional Sales Director",
    email: "harikrishnan.p@ayadi.in",
    phone: "+91 94471 56789",
    joined: "2021-08-01",
  },
  {
    id: "SM-103",
    name: "Maya Sunder",
    zone: "Central & Travancore Zone",
    title: "Senior Sales Manager",
    email: "maya.sunder@ayadi.in",
    phone: "+91 97450 98765",
    joined: "2023-01-10",
  },
];

export const ALL_CSDOS: (Csdo & { smId: string })[] = [
  { id: "CSDO-201", name: "Deepa Varghese", region: "Thrissur Region", smId: "SM-101" },
  { id: "CSDO-202", name: "Suresh Pillai", region: "Kozhikode Region", smId: "SM-101" },
  { id: "CSDO-203", name: "Lakshmi Menon", region: "Ernakulam Region", smId: "SM-101" },
  // Additional regional CSDO for scenario probing and cross-zone modeling
  { id: "CSDO-204", name: "Kavitha R.", region: "Kannur & Kasaragod Region", smId: "SM-102" },
];

export const ALL_SDOS: Sdo[] = [
  { id: "SDO-114", name: "Anoop Raj", region: "Kozhikode North", csdoId: "CSDO-202", joined: "2024-02-12" },
  { id: "SDO-115", name: "Fathima Beevi", region: "Kozhikode South", csdoId: "CSDO-202", joined: "2023-08-01" },
  { id: "SDO-116", name: "Manoj Kurup", region: "Vadakara", csdoId: "CSDO-202", joined: "2025-01-06" },
  { id: "SDO-118", name: "Arjun Kumar", region: "Kochi", csdoId: "CSDO-203", joined: "2023-06-19" },
  { id: "SDO-121", name: "Anjali Nair", region: "Aluva", csdoId: "CSDO-203", joined: "2024-04-01" },
  { id: "SDO-124", name: "Joseph Mathew", region: "Muvattupuzha", csdoId: "CSDO-203", joined: "2026-10-05" },
  { id: "SDO-126", name: "Preetha Narayanan", region: "Thalassery", csdoId: "CSDO-204", joined: "2024-11-15" },
];

type SoRow = [string, string, string, number, number, number, SmSupervisorType, string];

const SO_ROWS: SoRow[] = [
  // CSDO-201 (Thrissur) direct SOs
  ["SO-2101", "Nikhil Thomas", "Chalakudy", 150000, 1.12, 4.6, "CSDO", "CSDO-201"],
  ["SO-2102", "Aswathy Krishnan", "Irinjalakuda", 125000, 0.95, 4.4, "CSDO", "CSDO-201"],
  ["SO-2103", "Jibin Joseph", "Kodungallur", 150000, 0.70, 4.1, "CSDO", "CSDO-201"],
  ["SO-2104", "Reshma Ramesh", "Guruvayur", 100000, 1.28, 4.8, "CSDO", "CSDO-201"],
  ["SO-2105", "Sanjay Das", "Kunnamkulam", 125000, 0.48, 3.8, "CSDO", "CSDO-201"],
  ["SO-2106", "Neethu Paul", "Wadakkanchery", 100000, 0.86, 4.3, "CSDO", "CSDO-201"],

  // CSDO-202 (Kozhikode) via SDOs
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

  // CSDO-203 (Ernakulam) direct & via SDOs
  ["SO-2041", "Rahul Menon", "Edappally", 150000, 1.18, 4.7, "CSDO", "CSDO-203"],
  ["SO-2302", "Meera Joseph", "Kakkanad", 125000, 0.88, 4.4, "CSDO", "CSDO-203"],
  ["SO-2303", "Gokul Krishnan", "Tripunithura", 100000, 0.58, 4.0, "CSDO", "CSDO-203"],
  ["SO-2304", "Ayesha Nazar", "Angamaly", 150000, 1.06, 4.8, "SDO", "SDO-118"],
  ["SO-2305", "Vishnu Pillai", "Aluva", 150000, 0.94, 4.4, "SDO", "SDO-118"],
  ["SO-2306", "Sneha Thomas", "Vyttila", 125000, 0.72, 4.2, "SDO", "SDO-118"],
  ["SO-2307", "Sreejith Kumar", "Edappally", 100000, 0.50, 3.9, "SDO", "SDO-118"],
  ["SO-2308", "Arun Mathew", "Kothamangalam", 125000, 1.30, 4.6, "SDO", "SDO-118"],
  ["SO-2309", "Vivek Chandran", "Perumbavoor", 150000, 0.83, 4.3, "SDO", "SDO-121"],
  ["SO-2310", "Anjana Suresh", "Kalamassery", 125000, 1.00, 4.5, "SDO", "SDO-121"],
  ["SO-2311", "Midhun Raj", "Paravur", 100000, 0.62, 4.0, "SDO", "SDO-121"],
  ["SO-2312", "Liya Antony", "Kalady", 125000, 0.40, 3.6, "SDO", "SDO-121"],

  // CSDO-204 (Kannur)
  ["SO-2401", "Dhanesh Balan", "Kannur Town", 150000, 1.10, 4.5, "SDO", "SDO-126"],
  ["SO-2402", "Pooja Varma", "Payyanur", 125000, 0.85, 4.3, "SDO", "SDO-126"],
];

function createMockSmApi(): SmApi {
  const sos: SalesOrganizer[] = SO_ROWS.map(([id, name, loc, monthlyTarget, , rating]) => ({
    id,
    name,
    loc,
    monthlyTarget,
    rating,
  }));

  const soAssignments: SmAssignment[] = SO_ROWS.map(([soId, , , , , , supType, supId], i) => ({
    id: `ASG-SM-${1001 + i}`,
    soId,
    supType,
    supId,
    from: "2025-04-01",
    to: null,
  }));

  // Rahul Menon moved to CSDO direct on 1 Oct 2026
  const rahulAsg = soAssignments.find((a) => a.soId === "SO-2041");
  if (rahulAsg) rahulAsg.from = "2026-10-01";
  soAssignments.push({
    id: "ASG-SM-0950",
    soId: "SO-2041",
    supType: "SDO",
    supId: "SDO-121",
    from: "2025-06-01",
    to: "2026-09-30",
  });

  const sdoAssignments: SdoAssignment[] = ALL_SDOS.map((d, i) => ({
    id: `ASG-SDO-${201 + i}`,
    sdoId: d.id,
    csdoId: d.csdoId,
    from: d.joined,
    to: null,
  }));

  // Enrolment Feed Generation
  const feed: Enrolment[] = [];
  for (const [id, , , monthlyTarget, skill] of SO_ROWS) {
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

  // Duplicate feed injection
  for (const i of [7, 61, 140, 215]) {
    if (feed[i]) feed.push({ ...feed[i] });
  }

  const unique = new Map<string, Enrolment>();
  let duplicates = 0;
  for (const t of feed) {
    if (unique.has(t.id)) duplicates++;
    else unique.set(t.id, t);
  }
  const enrolmentsBySo: Record<string, Enrolment[]> = {};
  for (const t of unique.values()) {
    (enrolmentsBySo[t.soId] ??= []).push(t);
  }

  // Field Visits by SDO
  const visitsBySdo: Record<string, number[]> = {};
  for (const sdo of ALL_SDOS) {
    const random = seededRandom(hashString(sdo.id + "v_sm"));
    const days: number[] = [];
    for (let day = Math.max(HISTORY_DAY, parseDay(sdo.joined)); day <= TODAY_DAY; day++) {
      if (random() < 0.48) days.push(day);
    }
    visitsBySdo[sdo.id] = days;
  }

  function buildScope(
    smId: string,
    currentSoAsgs: SmAssignment[],
    currentSdoAsgs: SdoAssignment[]
  ): SmScope {
    const sm = SALES_MANAGERS.find((m) => m.id === smId);
    if (!sm) throw new ForbiddenError(smId);

    // CSDOs directly reporting to this SM
    // For SM-101: Thrissur, Kozhikode, Ernakulam
    // For SM-102: Kozhikode, Kannur
    // For SM-103: Thrissur, Ernakulam
    const csdos =
      smId === "SM-101"
        ? ALL_CSDOS.filter((c) => ["CSDO-201", "CSDO-202", "CSDO-203"].includes(c.id))
        : smId === "SM-102"
          ? ALL_CSDOS.filter((c) => ["CSDO-202", "CSDO-204"].includes(c.id))
          : ALL_CSDOS.filter((c) => ["CSDO-201", "CSDO-203"].includes(c.id));

    const csdoIds = new Set(csdos.map((c) => c.id));

    // Active SDO assignments mapped to in-scope CSDOs
    const sdoToCsdo: Record<string, string> = {};
    for (const a of currentSdoAsgs) {
      if (a.from > TODAY || (a.to && a.to < TODAY)) continue;
      if (csdoIds.has(a.csdoId)) {
        sdoToCsdo[a.sdoId] = a.csdoId;
      }
    }

    const sdos = ALL_SDOS.filter((d) => sdoToCsdo[d.id]).map((d) => ({
      ...d,
      csdoId: sdoToCsdo[d.id],
    }));
    const sdoIds = new Set(sdos.map((d) => d.id));

    // Active SO assignments
    const rel: Record<string, SmRelation> = {};
    for (const a of currentSoAsgs) {
      if (a.from > TODAY || (a.to && a.to < TODAY)) continue;
      if (a.supType === "CSDO" && csdoIds.has(a.supId)) {
        rel[a.soId] = { type: "csdo-direct", csdoId: a.supId, assignment: a };
      } else if (a.supType === "SDO" && sdoIds.has(a.supId)) {
        const csdoId = sdoToCsdo[a.supId];
        rel[a.soId] = { type: "sdo", csdoId, sdoId: a.supId, assignment: a };
      }
    }

    const inScopeSos = sos.filter((p) => rel[p.id]);
    const soIds = new Set(inScopeSos.map((p) => p.id));

    const guard = (id: string) => {
      if (!csdoIds.has(id) && !sdoIds.has(id) && !soIds.has(id)) {
        throw new ForbiddenError(id);
      }
    };

    const supervisors: SmSupervisorOption[] = [
      ...csdos.map((c) => ({
        type: "CSDO" as const,
        id: c.id,
        label: `${c.name} (${c.region}) · CSDO Direct`,
        sub: "Direct report to CSDO",
      })),
      ...sdos.map((d) => ({
        type: "SDO" as const,
        id: d.id,
        label: `SDO ${d.name} (${d.region})`,
        sub: `Under CSDO ${csdos.find((c) => c.id === sdoToCsdo[d.id])?.name ?? ""}`,
      })),
    ];

    return {
      sm,
      csdos,
      sdos,
      sos: inScopeSos,
      rel,
      sdoToCsdo,
      directSosOf: (csdoId: string) => {
        guard(csdoId);
        return inScopeSos.filter((p) => {
          const r = rel[p.id];
          return r?.type === "csdo-direct" && r.csdoId === csdoId;
        });
      },
      sdosOf: (csdoId: string) => {
        guard(csdoId);
        return sdos.filter((d) => sdoToCsdo[d.id] === csdoId);
      },
      teamOf: (sdoId: string) => {
        guard(sdoId);
        return inScopeSos.filter((p) => {
          const r = rel[p.id];
          return r?.type === "sdo" && r.sdoId === sdoId;
        });
      },
      allSosOf: (csdoId: string) => {
        guard(csdoId);
        return inScopeSos.filter((p) => rel[p.id]?.csdoId === csdoId);
      },
      getCsdo: (id: string) => {
        guard(id);
        return csdos.find((c) => c.id === id)!;
      },
      getSdo: (id: string) => {
        guard(id);
        return sdos.find((d) => d.id === id)!;
      },
      getSO: (id: string) => {
        guard(id);
        return sos.find((p) => p.id === id)!;
      },
      txns: (soId: string) => {
        guard(soId);
        return enrolmentsBySo[soId] ?? [];
      },
      visits: (sdoId: string) => {
        guard(sdoId);
        return visitsBySdo[sdoId] ?? [];
      },
      history: (soId: string) => {
        guard(soId);
        return currentSoAsgs
          .filter((a) => a.soId === soId)
          .sort((x, y) => (x.from < y.from ? 1 : -1));
      },
      supervisors,
    };
  }

  function reassignSo(
    list: SmAssignment[],
    smId: string,
    soId: string,
    to: { type: SmSupervisorType; id: string }
  ): SmAssignment[] | null {
    const scope = buildScope(smId, list, sdoAssignments);
    scope.getSO(soId);

    if (!scope.supervisors.some((s) => s.type === to.type && s.id === to.id)) {
      throw new ForbiddenError(to.id);
    }
    const current = scope.rel[soId].assignment;
    if (current.supType === to.type && current.supId === to.id) return null;

    const kept = list
      .filter((a) => !(a === current && a.from === TODAY))
      .map((a) => (a === current ? { ...a, to: isoDay(TODAY_DAY - 1) } : a));

    return kept.concat({
      id: `ASG-SM-${3000 + kept.length}`,
      soId,
      supType: to.type,
      supId: to.id,
      from: TODAY,
      to: null,
    });
  }

  function reassignSdo(
    list: SdoAssignment[],
    smId: string,
    sdoId: string,
    toCsdoId: string
  ): SdoAssignment[] | null {
    const scope = buildScope(smId, soAssignments, list);
    scope.getSdo(sdoId);
    scope.getCsdo(toCsdoId);

    const current = list.find(
      (a) => a.sdoId === sdoId && (a.to === null || a.to >= TODAY) && a.from <= TODAY
    );
    if (!current || current.csdoId === toCsdoId) return null;

    const kept = list
      .filter((a) => !(a === current && a.from === TODAY))
      .map((a) => (a === current ? { ...a, to: isoDay(TODAY_DAY - 1) } : a));

    return kept.concat({
      id: `ASG-SDO-${500 + kept.length}`,
      sdoId,
      csdoId: toCsdoId,
      from: TODAY,
      to: null,
    });
  }

  return {
    getSlides: () => homeData.slides,
    getAssignments: () => soAssignments.slice(),
    getSdoAssignments: () => sdoAssignments.slice(),
    buildScope,
    reassignSo,
    reassignSdo,
    duplicatesIgnored: duplicates,
  };
}

export const smApi: SmApi = createMockSmApi();
