/**
 * Mock data layer for the SDO (Sales Development Officer) supervisor
 * dashboard. Swap `sdoApi` for real fetches; the dashboard only depends on the
 * `SdoApi` shape.
 */

import { seededRandom } from "@/lib/random";
import { homeData, type Slide } from "./home";

/** Daily sales history starts here (day index 0). */
export const HISTORY_START = new Date(2026, 8, 1);
/** Day index of today (13 Oct 2026); the history ends here. */
export const TODAY = 42;

export type SoStatus = "active" | "inactive";

export interface SalesOrganizer {
  id: string;
  /** The SDO this organizer reports to. */
  sdoId: string;
  name: string;
  code: string;
  territory: string;
  status: SoStatus;
  /** Monthly sales target in rupees. */
  target: number;
  /** Share of sales paid out as earnings. */
  rate: number;
  /** Sales per day, indexed from `HISTORY_START` up to `TODAY`. */
  days: number[];
  /** Manager + customer score on a 1–5 scale. */
  rating: number;
  /** Avatar tint. */
  hue: number;
}

export interface SdoProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  region: string;
  status: string;
}

export interface SdoApi {
  getSdoProfile(): SdoProfile;
  getAssignedSOs(sdoId: string): SalesOrganizer[];
  /** Announcement slides, shared with the organizer home screen. */
  getSlides(): Slide[];
}

const NAMES = [
  "Rahul Menon",
  "Anjali Nair",
  "Vishnu Pillai",
  "Sneha Thomas",
  "Akhil Raj",
  "Fathima Rasheed",
  "Gokul Krishnan",
  "Meera Joseph",
  "Nikhil Varghese",
  "Divya Suresh",
  "Arun Mathew",
  "Lakshmi Das",
  "Sreejith Kumar",
  "Anu George",
  "Jithin Babu",
  "Reshma Iqbal",
  "Abhijith Sasi",
  "Neethu Paul",
  "Hari Krishnan",
  "Ayesha Nazar",
  "Sandeep Kurian",
  "Parvathy Rajan",
  "Vivek Chandran",
  "Teena Antony",
];

const TERRITORIES = [
  "Edappally",
  "Kakkanad",
  "Aluva",
  "Vyttila",
  "Fort Kochi",
  "Kalamassery",
  "Thrippunithura",
  "Angamaly",
  "Perumbavoor",
  "Muvattupuzha",
  "Kothamangalam",
  "Panampilly Nagar",
];

/** Relative selling strength, strongest first; shuffled across organizers. */
const SKILLS = [
  1.34, 1.26, 1.19, 1.13, 1.08, 1.04, 1.01, 0.99, 0.97, 0.95, 0.93, 0.91, 0.89,
  0.86, 0.83, 0.8, 0.77, 0.73, 0.69, 0.65, 0.6, 0.55, 0.5, 0.44,
];

function createMockApi(): SdoApi {
  const random = seededRandom(20261013);
  const order = SKILLS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const make = (name: string, i: number, sdoId: string): SalesOrganizer => {
    const target = Math.round((90000 + random() * 90000) / 5000) * 5000;
    const skill = SKILLS[order[i % SKILLS.length]];
    const rate = 0.06 + random() * 0.05;
    const days: number[] = [];
    for (let d = 0; d <= TODAY; d++) {
      // September (days 0–29) wobbles more than the current month.
      const strength = d < 30 ? skill * (0.85 + random() * 0.3) : skill;
      let value = (target / 31) * strength * (0.35 + random() * 1.3);
      if (random() < 0.1) value = 0;
      days.push(Math.round(value / 50) * 50);
    }
    const score = 3.1 + (skill - 0.44) * 2 + (random() - 0.5) * 0.5;
    const rating = Math.round(Math.min(5, Math.max(3, score)) * 10) / 10;
    return {
      id: `${sdoId}-${i + 1}`,
      sdoId,
      name,
      code: `AYD${401 + i}`,
      territory: TERRITORIES[i % TERRITORIES.length],
      status: "active",
      target,
      rate,
      days,
      rating,
      hue: (i * 47 + 12) % 360,
    };
  };

  const team = NAMES.map((name, i) => make(name, i, "SDO118"));
  // Two organizers went quiet ten days ago; one has missed the last two days.
  for (const i of [20, 23]) {
    team[i].status = "inactive";
    for (let d = TODAY - 9; d <= TODAY; d++) team[i].days[d] = 0;
  }
  team[17].days[TODAY - 1] = 0;
  team[17].days[TODAY] = 0;

  // Organizers under another SDO, which this dashboard must never show.
  const others = ["Ravi Shankar", "Nisha Mohan", "Tom Jacob"].map((name, i) =>
    make(name, i, "SDO207"),
  );
  const all = team.concat(others);

  const sdo: SdoProfile = {
    id: "SDO118",
    name: "Arjun Kumar",
    initials: "AK",
    role: "Sales Development Officer",
    region: "Kochi Region",
    status: "Active",
  };

  return {
    getSdoProfile: () => sdo,
    getAssignedSOs: (sdoId) => all.filter((so) => so.sdoId === sdoId),
    getSlides: () => homeData.slides,
  };
}

export const sdoApi: SdoApi = createMockApi();
