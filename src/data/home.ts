export type RewardIcon = "star" | "gift" | "trophy";

/** Cumulative earnings on a given day of the month: [day, amount]. */
export type ChartPoint = [day: number, amount: number];

export interface Milestone {
  /** Percent of the monthly target at which this reward unlocks. */
  at: number;
  /** Icons shown inside the milestone marker on the progress track. */
  icons: RewardIcon[];
  reward: string;
  rewardIcon: RewardIcon;
  /** Nudge shown while this is the next milestone; the amount left sits between the two. */
  coach: { pre: string; post: string };
  /** Toast shown the moment this milestone is crossed. */
  unlocked: { title: string; sub: string };
}

export interface Slide {
  tag: string;
  title: string;
  sub: string;
  img: string;
}

export interface Organizer {
  name: string;
  sales: number;
  /** Percent of their own target. */
  perf: number;
  stars: number;
  avatar: string;
}

export interface HomeData {
  period: {
    month: string;
    monthShort: string;
    previousMonth: string;
    previousMonthShort: string;
    days: number;
    today: number;
  };
  target: number;
  earnings: number;
  me: {
    name: string;
    code: string;
    location: string;
    role: string;
    avatar: string;
    stars: number;
    starsThisWeek: number;
  };
  chart: {
    previousTotal: number;
    previous: ChartPoint[];
    /** Runs up to today; its last amount is the earnings it was sampled at. */
    current: ChartPoint[];
  };
  milestones: Milestone[];
  slides: Slide[];
  others: Organizer[];
}

const portrait = (id: string) =>
  `https://randomuser.me/api/portraits/${id}.jpg`;

// Mock API payload — swap for real data later.
export const homeData: HomeData = {
  period: {
    month: "October",
    monthShort: "Oct",
    previousMonth: "September",
    previousMonthShort: "Sep",
    days: 31,
    today: 22,
  },
  target: 100000,
  earnings: 72500,
  me: {
    name: "Arjun Kumar",
    code: "AYD403",
    location: "Kochi, Kerala",
    role: "Sales Organizer",
    avatar: portrait("men/75"),
    stars: 74,
    starsThisWeek: 12,
  },
  chart: {
    previousTotal: 88000,
    previous: [
      [0, 0],
      [3, 7000],
      [7, 17500],
      [10, 26000],
      [14, 38500],
      [17, 47000],
      [22, 61000],
      [26, 71500],
      [31, 88000],
    ],
    current: [
      [0, 0],
      [3, 9000],
      [7, 21500],
      [10, 31000],
      [14, 45500],
      [17, 55500],
      [22, 72500],
    ],
  },
  milestones: [
    {
      at: 25,
      icons: ["star"],
      reward: "Rising Star badge",
      rewardIcon: "star",
      coach: { pre: "Just ", post: " to unlock your Rising Star badge!" },
      unlocked: {
        title: "Badge unlocked!",
        sub: "Rising Star badge added to your profile.",
      },
    },
    {
      at: 50,
      icons: ["star", "star"],
      reward: "Double Star badge",
      rewardIcon: "star",
      coach: { pre: "Only ", post: " to the Double Star badge. Keep going!" },
      unlocked: {
        title: "Badge unlocked!",
        sub: "Double Star badge added to your profile.",
      },
    },
    {
      at: 75,
      icons: ["gift"],
      reward: "Bluetooth Speaker",
      rewardIcon: "gift",
      coach: { pre: "Just ", post: " to unlock your gift!" },
      unlocked: {
        title: "Gift unlocked!",
        sub: "Bluetooth Speaker is yours. Next up: the grand prize.",
      },
    },
    {
      at: 100,
      icons: ["trophy"],
      reward: "Premium Smartwatch",
      rewardIcon: "trophy",
      coach: { pre: "Gift unlocked! ", post: " more for the grand prize." },
      unlocked: {
        title: "Target smashed!",
        sub: "Premium Smartwatch unlocked. What a month!",
      },
    },
  ],
  slides: [
    {
      tag: "CONTEST",
      title: "Diwali Sales Sprint",
      sub: "Double stars on every sale till 31 Oct",
      img: "https://picsum.photos/seed/diwali-lights/800/360",
    },
    {
      tag: "EVENT",
      title: "Kerala Sales Meet",
      sub: "18 Oct · Kochi · Awards night",
      img: "https://picsum.photos/seed/kochi-meet/800/360",
    },
    {
      tag: "NEW LAUNCH",
      title: "Smart Home Bundle",
      sub: "Earn 1.5× on bundles this week",
      img: "https://picsum.photos/seed/smart-bundle/800/360",
    },
    {
      tag: "SHOUTOUT",
      title: "Team Kochi hit 110%",
      sub: "September champions, take a bow",
      img: "https://picsum.photos/seed/team-cheer/800/360",
    },
  ],
  others: [
    { name: "Rahul Menon", sales: 185000, perf: 124, stars: 196, avatar: portrait("men/32") },
    { name: "Anjali Nair", sales: 172000, perf: 115, stars: 181, avatar: portrait("women/44") },
    { name: "Vishnu Prasad", sales: 161000, perf: 107, stars: 168, avatar: portrait("men/46") },
    { name: "Fathima Rasheed", sales: 148000, perf: 99, stars: 150, avatar: portrait("women/65") },
    { name: "Nikhil Thomas", sales: 136000, perf: 97, stars: 141, avatar: portrait("men/22") },
    { name: "Sneha Pillai", sales: 124000, perf: 95, stars: 127, avatar: portrait("women/68") },
    { name: "Arun Das", sales: 115000, perf: 92, stars: 118, avatar: portrait("men/60") },
    { name: "Divya Joseph", sales: 107000, perf: 89, stars: 109, avatar: portrait("women/12") },
    { name: "Kiran Varghese", sales: 98500, perf: 88, stars: 99, avatar: portrait("men/85") },
    { name: "Meera Krishnan", sales: 91000, perf: 86, stars: 93, avatar: portrait("women/26") },
    { name: "Ajay Mohan", sales: 86000, perf: 84, stars: 88, avatar: portrait("men/11") },
    { name: "Reshma Babu", sales: 81500, perf: 82, stars: 85, avatar: portrait("women/33") },
    { name: "Sanjay Kurian", sales: 76500, perf: 77, stars: 77, avatar: portrait("men/71") },
  ],
};
