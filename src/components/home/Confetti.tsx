import type { CSSProperties } from "react";

export interface ConfettiPiece {
  color: string;
  width: number;
  height: number;
  round: boolean;
  /** Horizontal drift, peak rise and final fall, in px. */
  x: number;
  up: number;
  down: number;
  /** Total spin, in degrees. */
  rotate: number;
  duration: number;
  delay: number;
}

const COLORS = ["#F6BE3B", "#FFD96E", "#4BE3A6", "#9AF7D1", "#FFFFFF"];

export function makeConfetti(count = 36): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    color: COLORS[i % COLORS.length],
    width: 6 + Math.random() * 6,
    height: 8 + Math.random() * 8,
    round: Math.random() < 0.3,
    x: (Math.random() * 2 - 1) * 190,
    up: -(70 + Math.random() * 150),
    down: 300 + Math.random() * 260,
    rotate: (Math.random() * 2 - 1) * 540,
    duration: Math.round(1500 + Math.random() * 900),
    delay: Math.round(Math.random() * 140),
  }));
}

/** One burst over the phone column; remount with a new key to fire again. */
export function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-1/2 z-20 w-full max-w-phone -translate-x-1/2 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-[40%]"
          style={
            {
              width: p.width,
              height: p.round ? p.width : p.height,
              marginLeft: -p.width / 2,
              borderRadius: p.round ? "50%" : 2,
              background: p.color,
              "--x": `${p.x}px`,
              "--up": `${p.up}px`,
              "--down": `${p.down}px`,
              "--r": `${p.rotate}deg`,
              animation: `confetti ${p.duration}ms cubic-bezier(.2,.65,.35,1) ${p.delay}ms both`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
