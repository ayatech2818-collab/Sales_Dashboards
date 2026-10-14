import type { RewardIcon } from "@/data/home";
import { REWARD_ICONS } from "./icons";

interface ToastProps {
  icon: RewardIcon;
  title: string;
  sub: string;
}

/** Pinned to the bottom of the phone column, above the page content. */
export function Toast({ icon, title, sub }: ToastProps) {
  const Icon = REWARD_ICONS[icon];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-9 z-21 mx-auto w-full max-w-phone px-4">
      <div
        role="status"
        className="flex animate-toast-in items-center gap-3 rounded-[18px] bg-ink px-3.5 py-3 text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,.45)]"
      >
        <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-gold-sheen text-cocoa">
          <Icon size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold leading-[1.15]">
            {title}
          </div>
          <div className="text-[13px] font-medium leading-tight text-white/74">
            {sub}
          </div>
        </div>
      </div>
    </div>
  );
}
