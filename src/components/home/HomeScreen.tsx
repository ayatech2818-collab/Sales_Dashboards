import type { HomeData } from "@/data/home";
import { Leaderboard } from "./Leaderboard";
import { MonthProgress } from "./MonthProgress";
import { ProfileCard } from "./ProfileCard";
import { PromoCarousel } from "./PromoCarousel";
import { RoleSwitcher } from "@/components/common/RoleSwitcher";

interface HomeScreenProps {
  data: HomeData;
  /** Let the carousel and leaderboard move on their own. */
  autoSlide?: boolean;
  leaderboardMotion?: "step" | "glide";
}

/**
 * A single phone column on small screens; from `md` up the cards spread into
 * the two-column `grid-areas-home` layout.
 */
export function HomeScreen({
  data,
  autoSlide = true,
  leaderboardMotion = "step",
}: HomeScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col gap-4 bg-screen px-4 pb-9 pt-4 md:grid md:max-w-6xl md:grid-areas-home md:grid-cols-2 md:content-start md:gap-5 md:px-6 md:pb-12 md:pt-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:pt-8">
      <ProfileCard me={data.me} className="md:[grid-area:profile]" />
      <div className="flex flex-col gap-4 md:[grid-area:promo]">
        <PromoCarousel
          slides={data.slides}
          autoSlide={autoSlide}
        />
        <RoleSwitcher />
      </div>
      <MonthProgress data={data} />
      <Leaderboard
        month={data.period.month}
        me={data.me}
        others={data.others}
        target={data.target}
        earnings={data.earnings}
        autoSlide={autoSlide}
        motion={leaderboardMotion}
        className="md:[grid-area:board]"
      />
    </main>
  );
}
