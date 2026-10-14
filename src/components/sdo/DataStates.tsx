import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { MdOutlineCloudOff, MdOutlineGroupOff } from "react-icons/md";

export function LoadingState() {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
        <div className="h-[300px] rounded-[28px] bg-[#e9e6df]" />
        <div className="h-[300px] rounded-[28px] bg-[#ece9e3]" />
        <div className="h-[300px] rounded-[28px] bg-well" />
      </div>
      <div role="status" className="text-center text-[14px] text-hint">
        Loading team KPIs…
      </div>
    </>
  );
}

function Notice({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: IconType;
  tone: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[28px] bg-white px-5 py-10 text-center">
      <div className={`flex size-14 items-center justify-center rounded-[18px] ${tone}`}>
        <Icon size={30} />
      </div>
      <h2 className="font-display text-[20px] font-bold">{title}</h2>
      {children}
    </div>
  );
}

export function EmptyState() {
  return (
    <Notice icon={MdOutlineGroupOff} tone="bg-tab text-hint" title="No Sales Organizers assigned yet">
      <p className="max-w-[340px] text-[15px] text-sub">
        Once organizers are assigned to your region, their KPIs will appear here.
      </p>
    </Notice>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Notice icon={MdOutlineCloudOff} tone="bg-danger-soft text-danger" title="Couldn’t load team KPIs">
      <p className="text-[15px] text-sub">Check your connection and try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1.5 cursor-pointer rounded-[14px] bg-night px-5 py-2.5 text-[15px] font-bold text-white"
      >
        Retry
      </button>
    </Notice>
  );
}
