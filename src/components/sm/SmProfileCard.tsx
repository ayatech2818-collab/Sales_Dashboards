import { LuBriefcase, LuMail, LuMapPin, LuPhone } from "react-icons/lu";
import type { SmScope } from "@/data/sm";
import { initials } from "@/lib/format";
import type { TypeFilter, ViewKind } from "./model";
import { IdPill, PANEL } from "./parts";

interface SmProfileCardProps {
  scope: SmScope;
  view: ViewKind;
  onType: (type: TypeFilter) => void;
}

export function SmProfileCard({ scope, view, onType }: SmProfileCardProps) {
  const { sm } = scope;

  const directCount = scope.sos.filter((p) => scope.rel[p.id]?.type === "csdo-direct").length;
  const indirectCount = scope.sos.length - directCount;

  const tiles: {
    type: TypeFilter;
    label: string;
    value: number;
    sub: string;
    bg: string;
    ink: string;
    subInk: string;
  }[] = [
    {
      type: "csdos",
      label: "CSDO Regions",
      value: scope.csdos.length,
      sub: "Chief SDO Divisions",
      bg: "#F0FDF4",
      ink: "#15803D",
      subInk: "#166534",
    },
    {
      type: "sdos",
      label: "SDO Teams",
      value: scope.sdos.length,
      sub: "Field Team Leaders",
      bg: "#F7E9F4",
      ink: "#8E3479",
      subInk: "#70245E",
    },
    {
      type: "direct",
      label: "CSDO Direct SOs",
      value: directCount,
      sub: "Direct to CSDOs",
      bg: "#EEEDFC",
      ink: "#4B3FC7",
      subInk: "#3E34AB",
    },
    {
      type: "all",
      label: "Total Sales Force",
      value: scope.sos.length,
      sub: "Unique SOs in Zone",
      bg: "#0F172A",
      ink: "#FFFFFF",
      subInk: "#94A3B8",
    },
  ];

  return (
    <section className={`relative flex flex-col gap-3.5 overflow-hidden rounded-3xl p-4.5 ${PANEL}`}>
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute -right-10 -top-12 size-52 rounded-full bg-[radial-gradient(circle,#e0f2fe_0%,rgba(224,242,254,0)_70%)]" />

      <div className="relative flex items-center gap-3.5">
        <div className="relative size-18 flex-none rounded-full bg-[conic-gradient(#0284c7,#f59e0b,#38bdf8,#0284c7)] p-0.75 shadow-md">
          <div className="size-full rounded-full bg-white p-0.75">
            <div className="flex size-full items-center justify-center rounded-full bg-[#0f172a] text-[22px] font-extrabold text-white">
              {initials(sm.name)}
            </div>
          </div>
          <span
            title="Active State Operations"
            className="absolute bottom-1 right-0.5 size-4 rounded-full border-[2.5px] border-white bg-[#22c55e]"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[23px] font-extrabold leading-[1.1] text-navy">{sm.name}</h1>
            <IdPill id={sm.id} />
          </div>

          <span className="flex items-center gap-1.25 text-[14px] font-medium text-steel">
            <LuMapPin size={15} className="flex-none text-[#0284c7]" />
            {sm.zone}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1.25 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[12px] font-bold text-[#0f172a]">
              <LuBriefcase size={13} className="flex-none text-sky-600" />
              {sm.title}
            </span>
            <span className="inline-flex items-center gap-1.25 text-[12px] font-semibold text-pine">
              <span className="size-2 rounded-full bg-[#22c55e] animate-pulse" />
              Zone Operations Active
            </span>
          </div>
        </div>
      </div>

      {/* Interactive summary tiles */}
      <div className="relative grid grid-cols-[repeat(auto-fit,minmax(116px,1fr))] gap-2">
        {tiles.map((t) => {
          const active = (view === "zone" && t.type === "all") || view === t.type;
          return (
            <button
              key={t.type}
              type="button"
              aria-pressed={active}
              onClick={() => onType(t.type)}
              className="flex cursor-pointer flex-col rounded-2xl border-[1.5px] px-3 py-2.5 text-left leading-[1.2] transition-all hover:scale-[1.02]"
              style={{
                background: t.bg,
                color: t.ink,
                borderColor: active ? (t.type === "all" ? "#F5B829" : t.ink) : "transparent",
                boxShadow: active ? "0 4px 12px rgba(15,23,42,0.12)" : undefined,
              }}
            >
              <span className="text-[26px] font-extrabold leading-[1.1]">{t.value}</span>
              <span className="text-[13px] font-bold">{t.label}</span>
              <span className="text-[11px] pt-0.5" style={{ color: t.subInk }}>
                {t.sub}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[#f1f5f9] pt-2 text-[12.5px] text-steel">
        <span>
          <b>{scope.csdos.length} CSDO regions</b> supervising <b>{scope.sdos.length} SDO teams</b> and{" "}
          <b>{scope.sos.length} frontline SOs</b> ({directCount} CSDO-direct + {indirectCount} SDO-managed).
        </span>
        <div className="flex items-center gap-3 text-[12px] text-pewter">
          <span className="flex items-center gap-1">
            <LuMail size={13} /> {sm.email}
          </span>
          <span className="flex items-center gap-1">
            <LuPhone size={13} /> {sm.phone}
          </span>
        </div>
      </div>
    </section>
  );
}
