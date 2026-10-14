"use client";

import { useEffect, useRef } from "react";
import {
  MdArrowUpward,
  MdEmojiEvents,
  MdMilitaryTech,
  MdStar,
} from "react-icons/md";
import type { HomeData, Organizer } from "@/data/home";
import { inr, inrShort } from "@/lib/format";
import { Scroller } from "@/lib/scroller";
import { clamp, prefersReducedMotion } from "@/lib/utils";
import { Avatar } from "./Avatar";

const TOP_COUNT = 10;
const CARD_GAP = 10;

interface CardStyle {
  card: string;
  ring: string;
  rank: string;
}

const MEDALS: CardStyle[] = [
  {
    card: "border border-[#F2D58A] bg-[linear-gradient(180deg,#FFF2CC_0%,#FFFFFF_78%)]",
    ring: "bg-[linear-gradient(135deg,#FFE28F,#E9A21A)]",
    rank: "bg-[linear-gradient(135deg,#FFD96E,#E9A21A)] text-cocoa",
  },
  {
    card: "border border-[#D8DDE6] bg-[linear-gradient(180deg,#EDF0F5_0%,#FFFFFF_78%)]",
    ring: "bg-[linear-gradient(135deg,#F3F5F9,#A3ABBB)]",
    rank: "bg-[linear-gradient(135deg,#F3F5F9,#A9B1C0)] text-[#272B3A]",
  },
  {
    card: "border border-[#EBC5A2] bg-[linear-gradient(180deg,#FBE8D7_0%,#FFFFFF_78%)]",
    ring: "bg-[linear-gradient(135deg,#F7CDA6,#C2733A)]",
    rank: "bg-[linear-gradient(135deg,#F4C193,#C2733A)] text-[#341A06]",
  },
];

const PLAIN: CardStyle = {
  card: "border border-ink/6 bg-white",
  ring: "bg-[#ECEEF4]",
  rank: "bg-[#F0F1F5] text-muted",
};

const MINE = {
  card: "border-[1.5px] border-mint bg-[linear-gradient(180deg,#E3F9EF_0%,#FFFFFF_78%)]",
  ring: "bg-[linear-gradient(135deg,#4BE3A6,#1FA971)]",
  rank: "bg-ink text-mint",
};

/** The viewer keeps a medal's rank badge if they place on the podium. */
function cardStyle(rank: number, isMe: boolean): CardStyle {
  const medal = MEDALS[rank - 1];
  if (!isMe) return medal ?? PLAIN;
  return { card: MINE.card, ring: MINE.ring, rank: medal?.rank ?? MINE.rank };
}

function shortName(name: string): string {
  const [first, second] = name.split(" ");
  return second ? `${first} ${second[0]}.` : first;
}

function cardStride(el: HTMLElement): number {
  const card = el.firstElementChild as HTMLElement | null;
  return card ? card.offsetWidth + CARD_GAP : 138;
}

/** Advance one card at a time, bouncing between the ends. */
function stepMotion(el: HTMLElement, scroller: Scroller): () => void {
  let direction = 1;
  let interval: ReturnType<typeof setInterval> | undefined;
  const tick = () => {
    const max = el.scrollWidth - el.clientWidth;
    if (!scroller.idle || max <= 0) return;
    const stride = cardStride(el);
    const x = clamp(
      Math.round(el.scrollLeft / stride) * stride + direction * stride,
      0,
      max,
    );
    if (x >= max) direction = -1;
    if (x <= 0) direction = 1;
    scroller.slideTo(x, 750);
  };
  const start = setTimeout(() => {
    tick();
    interval = setInterval(tick, 2600);
  }, 1300);
  return () => {
    clearTimeout(start);
    clearInterval(interval);
  };
}

/** Drift continuously, pausing briefly at each end. */
function glideMotion(el: HTMLElement, scroller: Scroller): () => void {
  let direction = 1;
  let position: number | null = null;
  let last = performance.now();
  let pauseUntil = 0;
  let frame = 0;
  const loop = (now: number) => {
    const dt = Math.min(50, now - last);
    last = now;
    const max = el.scrollWidth - el.clientWidth;
    if (scroller.idle && now > pauseUntil && max > 0) {
      scroller.freeScroll();
      // Resync if a drag or settle moved the strip since the last frame.
      if (position == null || Math.abs(position - el.scrollLeft) > 2) {
        position = el.scrollLeft;
      }
      position += direction * dt * 0.035;
      if (position >= max) {
        position = max;
        direction = -1;
        pauseUntil = now + 1400;
      } else if (position <= 0) {
        position = 0;
        direction = 1;
        pauseUntil = now + 1400;
      }
      el.scrollLeft = position;
    }
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(frame);
}

interface LeaderboardProps {
  month: string;
  me: HomeData["me"];
  others: Organizer[];
  target: number;
  earnings: number;
  /** Move the strip on its own while it isn't being touched or hovered. */
  autoSlide?: boolean;
  motion?: "step" | "glide";
  /** Placement within the page layout. */
  className?: string;
}

export function Leaderboard({
  month,
  me,
  others,
  target,
  earnings,
  autoSlide = true,
  motion = "step",
  className = "",
}: LeaderboardProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    // After a drag, come to rest on the nearest card.
    const scroller = new Scroller(el, () => {
      const stride = cardStride(el);
      const max = el.scrollWidth - el.clientWidth;
      return {
        to: clamp(Math.round(el.scrollLeft / stride) * stride, 0, max),
        duration: 380,
      };
    });
    const stopMotion =
      autoSlide && !prefersReducedMotion()
        ? (motion === "glide" ? glideMotion : stepMotion)(el, scroller)
        : undefined;

    return () => {
      stopMotion?.();
      scroller.destroy();
    };
  }, [autoSlide, motion]);

  const myPerf = Math.floor((earnings / target) * 100);
  const ranked = [
    ...others.map((o) => ({ ...o, isMe: false })),
    { name: me.name, avatar: me.avatar, stars: me.stars, sales: earnings, perf: myPerf, isMe: true },
  ].sort((a, b) => b.sales - a.sales || Number(a.isMe) - Number(b.isMe));

  const myRank = ranked.findIndex((p) => p.isMe) + 1;
  const above = ranked[myRank - 2];
  const climb = !above
    ? "Leading the board"
    : above.sales <= earnings
      ? `Tied with #${myRank - 1}`
      : `${inr(above.sales - earnings)} to reach #${myRank - 1}`;

  return (
    // Wider screens pull your own standing up beside the heading.
    <section
      className={`mt-2 flex flex-col gap-2.5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:items-center md:gap-x-6 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-gold-sheen text-cocoa">
          <MdEmojiEvents size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[19px] font-bold leading-[1.1]">
            Top {TOP_COUNT} organizers
          </h2>
          <div className="text-[13px] font-medium leading-[1.2] text-subtle">
            {month} · ranked by sales
          </div>
        </div>
      </div>

      {/*
        Bleeds into the page's side padding, so it tracks that padding. On large
        screens the page may stop short of the window, so the bleed fades out
        rather than cutting cards off mid-air.
      */}
      <div
        ref={stripRef}
        className="no-scrollbar -mx-4 flex cursor-grab snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto overflow-y-hidden px-4 pb-3.5 pt-1.5 md:col-span-2 md:-mx-6 md:scroll-px-6 md:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 lg:[mask-image:linear-gradient(90deg,transparent,#000_2rem,#000_calc(100%-2rem),transparent)]"
      >
        {ranked.slice(0, TOP_COUNT).map((p, i) => {
          const rank = i + 1;
          const style = cardStyle(rank, p.isMe);
          return (
            <div
              key={p.name}
              className={`relative flex w-32 flex-none snap-start flex-col items-center rounded-[20px] px-2.5 pb-3 pt-3.5 shadow-[0_1px_2px_rgba(29,32,51,.05),0_8px_20px_-14px_rgba(29,32,51,.28)] transition-transform duration-200 ease-[ease] active:scale-[.97] ${style.card}`}
            >
              <span
                className={`absolute left-2.5 top-2.5 h-6 min-w-6 rounded-xl px-1.5 text-center font-display text-[13px] font-extrabold leading-6 ${style.rank}`}
              >
                {rank}
              </span>
              {p.isMe ? (
                <span className="absolute right-2.5 top-[11px] rounded-md bg-ink px-1.5 pb-0.5 pt-[3px] text-[10px] font-bold leading-[1.2] tracking-[.08em] text-mint">
                  YOU
                </span>
              ) : (
                rank === 1 && (
                  <MdMilitaryTech
                    size={22}
                    className="absolute right-[9px] top-[9px] text-[#E9A21A]"
                  />
                )
              )}
              <div className={`mt-2 size-[62px] rounded-full p-[3px] ${style.ring}`}>
                <Avatar
                  name={p.name}
                  src={p.avatar}
                  className="size-full border-2 border-white text-base"
                />
              </div>
              <div className="mt-2 max-w-full truncate text-sm font-semibold leading-[1.2]">
                {p.isMe ? "You" : shortName(p.name)}
              </div>
              <div className="mt-px font-display text-[19px] font-extrabold leading-[1.1]">
                {inrShort(p.sales)}
              </div>
              <div className="mt-[5px] flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 font-display text-[13px] font-bold leading-none">
                  <MdStar size={15} className="flex-none text-gold" />
                  {p.stars.toLocaleString("en-IN")}
                </span>
                <span
                  className={`rounded-md px-1.5 pb-0.5 pt-[3px] text-[11.5px] font-bold leading-[1.1] ${
                    p.perf >= 100
                      ? "bg-[#DDF6EA] text-forest"
                      : "bg-[#F0F1F5] text-muted"
                  }`}
                >
                  {p.perf}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 rounded-[18px] border-[1.5px] border-mint/60 bg-[linear-gradient(90deg,#E6F9F0,#FFFFFF_65%)] px-3 py-2.5 shadow-[0_8px_20px_-14px_rgba(29,32,51,.3)] md:col-start-2 md:row-start-1">
        <span className="h-8 min-w-11 flex-none rounded-[11px] bg-ink px-2 text-center font-display text-base font-extrabold leading-8 text-mint">
          #{myRank}
        </span>
        <Avatar
          name={me.name}
          src={me.avatar}
          label="You"
          className="size-9 flex-none text-[13px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-base font-bold leading-[1.1]">
              You
            </span>
            {myRank <= TOP_COUNT && (
              <span className="rounded-md bg-ink px-1.5 pb-0.5 pt-[3px] text-[10px] font-bold leading-[1.1] tracking-[.06em] text-mint">
                TOP {TOP_COUNT}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 whitespace-nowrap text-[12.5px] font-semibold leading-[1.15] text-forest">
            <MdArrowUpward size={16} className="flex-none" />
            {climb}
          </div>
        </div>
        <div className="flex flex-none flex-col items-end gap-[3px]">
          <div className="font-display text-base font-extrabold leading-[1.1]">
            {inr(earnings)}
          </div>
          <div className="flex items-center gap-[3px] text-xs font-semibold leading-[1.1] text-muted">
            {myPerf}%<span className="text-[#B4B7C2]">·</span>
            <MdStar size={14} className="flex-none text-gold" />
            {me.stars.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </section>
  );
}
