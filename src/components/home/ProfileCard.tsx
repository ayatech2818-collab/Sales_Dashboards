import { MdLocationOn, MdOutlineBadge } from "react-icons/md";
import type { HomeData } from "@/data/home";
import { Avatar } from "./Avatar";

export function ProfileCard({ me }: { me: HomeData["me"] }) {
  return (
    <header className="relative flex items-center gap-3.5 rounded-3xl bg-profile-card p-4 shadow-[0_1px_2px_rgba(29,32,51,.05),0_10px_28px_-14px_rgba(29,32,51,.2)]">
      <div className="relative size-[66px] flex-none rounded-full bg-[linear-gradient(135deg,#4BE3A6,#F6BE3B)] p-[3px]">
        <Avatar
          name={me.name}
          src={me.avatar}
          className="size-full border-[2.5px] border-white text-lg"
        />
        <span className="absolute bottom-0.5 right-0.5 size-[15px] rounded-full border-[3px] border-white bg-[#22C55E]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-[22px] font-bold leading-[1.05] tracking-[-.2px]">
            {me.name}
          </h1>
          <div className="flex flex-none items-center rounded-full bg-chip px-2.5 pb-1 pt-[5px] text-xs font-bold leading-none tracking-[.06em] text-ink-soft">
            {me.code}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium leading-[1.2] text-muted">
          <MdLocationOn size={17} className="flex-none text-[#8A8E9E]" />
          {me.location}
        </div>
        <div className="flex">
          <span className="inline-flex items-center gap-[5px] rounded-full bg-chip pb-1 pl-2 pr-2.5 pt-[5px] text-xs font-semibold leading-none text-ink-soft">
            <MdOutlineBadge size={15} className="flex-none" />
            {me.role}
          </span>
        </div>
      </div>
    </header>
  );
}
