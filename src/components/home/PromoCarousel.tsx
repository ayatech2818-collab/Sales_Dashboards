"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/data/home";
import { Scroller } from "@/lib/scroller";
import { clamp, prefersReducedMotion } from "@/lib/utils";

interface PromoCarouselProps {
  slides: Slide[];
  /** Advance on a timer, bouncing between the first and last slide. */
  autoSlide?: boolean;
  /** Placement within the page layout. */
  className?: string;
}

export function PromoCarousel({
  slides,
  autoSlide = true,
  className = "",
}: PromoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<Scroller | null>(null);
  const direction = useRef(1);
  const [active, setActive] = useState(0);
  const last = slides.length - 1;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // A drag past 40px turns the page; anything shorter springs back.
    const scroller = new Scroller(el, (startScroll, dragX) => {
      const width = el.clientWidth;
      let index = Math.round(startScroll / width);
      if (dragX < -40) index++;
      else if (dragX > 40) index--;
      return { to: clamp(index, 0, last) * width, duration: 450 };
    });
    scrollerRef.current = scroller;

    let timer: ReturnType<typeof setInterval> | undefined;
    if (autoSlide && !prefersReducedMotion()) {
      timer = setInterval(() => {
        if (!scroller.idle) return;
        const width = el.clientWidth;
        const index = clamp(
          Math.round(el.scrollLeft / width) + direction.current,
          0,
          last,
        );
        if (index === last) direction.current = -1;
        if (index === 0) direction.current = 1;
        scroller.slideTo(index * width, 850);
      }, 3800);
    }

    return () => {
      clearInterval(timer);
      scroller.destroy();
      scrollerRef.current = null;
    };
  }, [autoSlide, last]);

  const goTo = (index: number) => {
    const el = trackRef.current;
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    // Backdated so auto-slide waits a little, not the full idle period.
    scroller.touch(1500);
    direction.current =
      index >= last ? -1 : index <= 0 ? 1 : index >= active ? 1 : -1;
    scroller.slideTo(index * el.clientWidth, 700);
  };

  return (
    <section
      aria-label="Announcements"
      className={`flex flex-col gap-2 ${className}`}
    >
      {/* On wider screens the slides grow to fill whatever height the layout gives them. */}
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex cursor-grab snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-[22px] shadow-[0_12px_28px_-18px_rgba(29,32,51,.45)] md:flex-1"
      >
        {slides.map((slide) => (
          <div
            key={slide.title}
            className="relative h-[152px] w-full flex-none snap-start overflow-hidden bg-[linear-gradient(135deg,#2A2F4A,#1D2033)] md:h-auto md:min-h-[152px]"
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${slide.img}")` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,22,36,0)_25%,rgba(20,22,36,.84)_100%)]" />
            <div className="absolute inset-x-4 bottom-3.5 flex flex-col items-start gap-1 text-white">
              <span className="rounded-md bg-white/94 px-2 pb-0.5 pt-[3px] text-[10.5px] font-bold leading-[1.2] tracking-[.08em] text-ink">
                {slide.tag}
              </span>
              <div className="font-display text-xl font-bold leading-[1.05]">
                {slide.title}
              </div>
              <div className="text-[13px] font-medium leading-[1.2] text-white/92">
                {slide.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-0.5">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === active}
            className="flex h-5 cursor-pointer items-center px-[3px] [-webkit-tap-highlight-color:transparent]"
          >
            <span
              className={`block h-1.5 rounded-[3px] transition-[width,background-color] duration-350 ease-[cubic-bezier(.3,.7,.3,1)] ${
                i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/20"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
