import { LuBriefcase, LuMapPin } from "react-icons/lu";
import type { Scope } from "@/data/csdo";
import { initials } from "@/lib/format";
import type { TypeFilter, ViewKind } from "./model";
import { IdPill, PANEL } from "./parts";

interface CsdoProfileCardProps {
  scope: Scope;
  view: ViewKind;
  onType: (type: TypeFilter) => void;
}

/** The signed-in CSDO, with headcounts that double as people filters. */
export function CsdoProfileCard({ scope, view, onType }: CsdoProfileCardProps) {
  const { csdo } = scope;
  const tiles: {
    type: TypeFilter;
    label: string;
    value: number;
    sub: string;
    bg: string;
    ink: string;
    subInk: string;
  }[] = [
    { type: "direct", label: "Direct SOs", value: scope.direct.length, sub: "Assigned to you", bg: "#EEEDFC", ink: "#4B3FC7", subInk: "#5A50B8" },
    { type: "sdos", label: "SDOs", value: scope.sdos.length, sub: "Assigned to you", bg: "#F7E9F4", ink: "#8E3479", subInk: "#8E3479" },
    { type: "indirect", label: "SOs under SDOs", value: scope.indirect.length, sub: "Via your SDOs", bg: "#FBF4FA", ink: "#8E3479", subInk: "#8E3479" },
    { type: "all", label: "Total unique SOs", value: scope.sos.length, sub: "In your scope", bg: "#1D2334", ink: "#FFFFFF", subInk: "#C9CEDC" },
  ];

  return (
    <section className={`relative flex flex-col gap-3.5 overflow-hidden rounded-[24px] p-4.5 ${PANEL}`}>
      <div className="pointer-events-none absolute -right-12.5 -top-15 size-50 rounded-full bg-[radial-gradient(circle,#ddf6ea_0%,rgba(221,246,234,0)_70%)]" />

      <div className="relative flex items-center gap-3.5">
        <div className="relative size-17 flex-none rounded-full bg-[conic-gradient(#34d399,#f5c451,#34d399)] p-0.75">
          <div className="size-full rounded-full bg-white p-0.75">
            <div className="flex size-full items-center justify-center rounded-full bg-[#222b45] text-[21px] font-extrabold text-white">
              {initials(csdo.name)}
            </div>
          </div>
          <span className="absolute bottom-1 right-0.5 size-3.5 rounded-full border-[2.5px] border-white bg-[#22c55e]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-extrabold leading-[1.1]">{csdo.name}</h1>
            <IdPill id={csdo.id} />
          </div>
          <span className="flex items-center gap-1.25 text-[14px] text-steel">
            <LuMapPin size={15} className="flex-none" />
            {csdo.region}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.25 rounded-full bg-pill px-2.5 py-0.5 text-[12.5px] font-semibold text-graphite">
              <LuBriefcase size={13} className="flex-none" />
              Chief Sales Development Officer
            </span>
            <span className="inline-flex items-center gap-1.25 text-[12.5px] font-semibold text-pine">
              <span className="size-1.75 rounded-full bg-[#22c55e]" />
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-2">
        {tiles.map((t) => {
          const active = (view === "org" && t.type === "all") || view === t.type;
          return (
            <button
              key={t.type}
              type="button"
              aria-pressed={active}
              onClick={() => onType(t.type)}
              className="flex cursor-pointer flex-col rounded-2xl border-[1.5px] px-3 py-2.5 text-left leading-[1.2]"
              style={{
                background: t.bg,
                color: t.ink,
                borderColor: active ? (t.type === "all" ? "#F5B829" : t.ink) : "transparent",
              }}
            >
              <span className="text-[26px] font-extrabold leading-[1.1]">{t.value}</span>
              <span className="text-[13px] font-bold">{t.label}</span>
              <span className="text-[11.5px]" style={{ color: t.subInk }}>
                {t.sub}
              </span>
            </button>
          );
        })}
      </div>

      <p className="relative text-pretty text-[13px] text-steel">
        {scope.direct.length} direct + {scope.indirect.length} under SDOs = {scope.sos.length} unique
        SOs. SDOs are not counted as SOs.
      </p>
    </section>
  );
}
