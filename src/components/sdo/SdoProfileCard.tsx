import { MdLocationOn, MdOutlineGroups } from "react-icons/md";
import type { SdoProfile } from "@/data/sdo";

interface SdoProfileCardProps {
  sdo: SdoProfile;
  /** Number of Sales Organizers assigned to this SDO. */
  count: number;
}

export function SdoProfileCard({ sdo, count }: SdoProfileCardProps) {
  return (
    <header className="relative flex items-center gap-3.5 overflow-hidden rounded-[28px] bg-white px-4.5 py-4 shadow-card">
      <div className="absolute -right-15 -top-15 size-50 rounded-full bg-[radial-gradient(circle,#e3f8ee_0%,rgba(227,248,238,0)_70%)]" />
      <div className="relative size-[68px] flex-none rounded-full bg-[linear-gradient(135deg,#3ecf8e,#f5c542)] p-[3px]">
        <div className="flex size-full items-center justify-center rounded-full border-[3px] border-white bg-[#2a2e45] font-display text-[22px] font-bold text-white">
          {sdo.initials}
        </div>
        <span className="absolute bottom-[3px] right-px size-3.5 rounded-full border-[2.5px] border-white bg-[#22c27a]" />
      </div>
      <div className="relative flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[22px] font-bold leading-[1.05]">{sdo.name}</h1>
          <span className="rounded-full bg-[#efeef3] px-[9px] py-px text-[12px] font-bold tracking-[.06em] text-[#4a4f63]">
            {sdo.id}
          </span>
        </div>
        <div className="flex items-start gap-1 text-[14px] leading-[1.3] text-sub">
          <MdLocationOn size={17} className="mt-px flex-none" />
          <span>
            {sdo.role} · {sdo.region}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[#f1f0f5] px-2.5 py-[3px] text-[13px] font-semibold text-body">
            <MdOutlineGroups size={16} />
            {count} Sales Organizers
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-good-soft px-2.5 py-[3px] text-[13px] font-semibold text-good-ink">
            <span className="size-[7px] flex-none rounded-full bg-[#22c27a]" />
            {sdo.status}
          </span>
        </div>
      </div>
    </header>
  );
}
