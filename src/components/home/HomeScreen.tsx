import type { HomeData } from "@/data/home";
import { Leaderboard } from "./Leaderboard";
import { MonthProgress } from "./MonthProgress";
import { ProfileCard } from "./ProfileCard";
import { PromoCarousel } from "./PromoCarousel";

interface HomeScreenProps {
  data: HomeData;
  /** Let the carousel and leaderboard move on their own. */
  autoSlide?: boolean;
  leaderboardMotion?: "step" | "glide";
}

export function HomeScreen({
  data,
  autoSlide = true,
  leaderboardMotion = "step",
}: HomeScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col gap-4 bg-screen px-4 pb-9 pt-4">
      <ProfileCard me={data.me} />
      <PromoCarousel slides={data.slides} autoSlide={autoSlide} />
      <MonthProgress data={data} />
      <Leaderboard
        month={data.period.month}
        me={data.me}
        others={data.others}
        target={data.target}
        earnings={data.earnings}
        autoSlide={autoSlide}
        motion={leaderboardMotion}
      />
    </main>
  );
}
