"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeData, Milestone, RewardIcon } from "@/data/home";
import { prefersReducedMotion } from "@/lib/utils";
import { Confetti, makeConfetti, type ConfettiPiece } from "./Confetti";
import { EarningsCard } from "./EarningsCard";
import { RewardCard } from "./RewardCard";
import { TargetCard } from "./TargetCard";
import { Toast } from "./Toast";

const INTRO_MS = 1700;
const UPDATE_MS = 800;
const TOAST_MS = 3400;
const CONFETTI_MS = 2700;

interface ToastState {
  id: number;
  icon: RewardIcon;
  title: string;
  sub: string;
}

interface Burst {
  id: number;
  pieces: ConfettiPiece[];
}

/**
 * The cards that follow the month's earnings figure. Counts the figure up on
 * first load, re-animates whenever it changes, and celebrates each milestone
 * it crosses along the way.
 */
export function MonthProgress({ data }: { data: HomeData }) {
  const { period, target, earnings, me, chart, milestones } = data;

  // `shown` chases `earnings`; `intro` runs 0→1 once, on first load.
  const [{ shown, intro }, setProgress] = useState({ shown: 0, intro: 0 });
  const [toast, setToast] = useState<ToastState | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const current = useRef(0);
  const introDone = useRef(false);
  const seq = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const burstTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const unlock = useCallback((milestone: Milestone) => {
    clearTimeout(toastTimer.current);
    setToast({
      id: ++seq.current,
      icon: milestone.rewardIcon,
      ...milestone.unlocked,
    });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);

    // Hitting the full target gets confetti on top of the toast.
    if (milestone.at >= 100) {
      clearTimeout(burstTimer.current);
      setBurst({ id: seq.current, pieces: makeConfetti() });
      burstTimer.current = setTimeout(() => setBurst(null), CONFETTI_MS);
    }
  }, []);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(burstTimer.current);
    },
    [],
  );

  useEffect(() => {
    const isIntro = !introDone.current;
    const from = current.current;
    const duration = prefersReducedMotion() ? 0 : isIntro ? INTRO_MS : UPDATE_MS;
    const start = performance.now();

    const step = (now: number) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (earnings - from) * eased;

      // Past the intro, celebrate the highest milestone this frame crossed.
      if (!isIntro && value > current.current) {
        const before = (current.current / target) * 100;
        const after = (value / target) * 100;
        const crossed = milestones
          .filter((m) => before < m.at && after >= m.at)
          .pop();
        if (crossed) unlock(crossed);
      }
      current.current = value;
      setProgress((p) => ({
        shown: value,
        intro: isIntro ? Math.max(p.intro, eased) : 1,
      }));

      if (t < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      if (isIntro) {
        introDone.current = true;
        // Arriving already at target still deserves the party.
        if (earnings >= target) unlock(milestones[milestones.length - 1]);
      }
    };
    let frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [earnings, target, milestones, unlock]);

  const finalPct = (earnings / target) * 100;
  const nextIndex = milestones.findIndex((m) => finalPct < m.at);

  return (
    <>
      <TargetCard
        month={period.month}
        daysLeft={period.days - period.today}
        target={target}
        earnings={earnings}
        shown={shown}
        milestones={milestones}
        nextIndex={nextIndex}
      />
      <RewardCard
        stars={me.stars}
        starsThisWeek={me.starsThisWeek}
        target={target}
        earnings={earnings}
        milestones={milestones}
        nextIndex={nextIndex}
        intro={intro}
      />
      <EarningsCard
        period={period}
        chart={chart}
        target={target}
        earnings={earnings}
        shown={shown}
        intro={intro}
      />
      {toast && <Toast key={`toast-${toast.id}`} {...toast} />}
      {burst && <Confetti key={`burst-${burst.id}`} pieces={burst.pieces} />}
    </>
  );
}
