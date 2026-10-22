import { LuChevronRight, LuMapPin, LuUsers } from "react-icons/lu";
import { inrShort, percent } from "@/lib/format";
import {
  NO_STATUS,
  SORTS,
  STATUS,
  byKey,
  plural,
  rankStyle,
  type CsdoMetric,
  type Filters,
  type Layout,
  type SdoMetric,
  type SmAnalysis,
  type SoMetric,
  type SortKey,
} from "./model";
import { Avatar, CardTitle, Eyebrow, PANEL, Star, Tint, chipClass, segmentClass } from "./parts";

const PAGE = 5;
const SDO_PAGE = 3;

const TAGS = {
  csdos: { label: "CSDO REGIONS", bg: "#F0FDF4", ink: "#15803D" },
  sdos: { label: "SDO TEAMS", bg: "#F7E9F4", ink: "#8E3479" },
  direct: { label: "CSDO DIRECT", bg: "#EEEDFC", ink: "#4B3FC7" },
  all: { label: "ALL SOs", bg: "#0F172A", ink: "#FFFFFF" },
  team: { label: "TEAM", bg: "#F7E9F4", ink: "#8E3479" },
  region: { label: "REGION", bg: "#F0FDF4", ink: "#15803D" },
};

interface AssociateSectionsProps {
  an: SmAnalysis;
  filters: Filters;
  layout: Layout;
  onLayout: (layout: Layout) => void;
  sorts: Partial<Record<string, SortKey>>;
  onSort: (section: string, key: SortKey) => void;
  expanded: Partial<Record<string, boolean>>;
  onExpand: (section: string) => void;
  onOpenCsdo: (id: string) => void;
  onOpenSdo: (id: string) => void;
  onOpenSo: (id: string) => void;
  onClear: () => void;
}

export function AssociateSections({
  an,
  filters,
  layout,
  onLayout,
  sorts,
  onSort,
  expanded,
  onExpand,
  onOpenCsdo,
  onOpenSdo,
  onOpenSo,
  onClear,
}: AssociateSectionsProps) {
  const { view } = an;
  const q = filters.q.trim().toLowerCase();

  const matchesQuery = (
    o: { name: string; id: string; loc?: string; region?: string },
    extra = ""
  ) => !q || `${o.name} ${o.id} ${o.loc || o.region || ""} ${extra}`.toLowerCase().includes(q);

  const matchesStatus = (status: string | null) =>
    filters.status === "all" || status === filters.status;

  // Render individual SO row
  const renderSoRow = (m: SoMetric, index: number, showRel = true) => {
    const S = STATUS[m.status];
    const rank = rankStyle(index);
    const rel = an.relation(m.id);
    const podium = index < 3;

    return (
      <button
        key={m.id}
        type="button"
        onClick={() => onOpenSo(m.id)}
        aria-label={`Open ${m.name}`}
        className={`flex w-full cursor-pointer flex-col gap-2.5 rounded-[18px] border px-3.5 py-3 text-left text-navy transition-all hover:border-[#cfcbc1] hover:scale-[1.005] ${
          podium ? "border-[#f6e3b4] bg-[#fffbf0]" : "border-[#eeebe4] bg-white"
        }`}
      >
        <span className="flex w-full items-center gap-2.5">
          <span
            className="flex h-6 min-w-7.5 flex-none items-center justify-center rounded-lg px-1.5 text-[12px] font-extrabold"
            style={{ background: rank.badgeBg, color: rank.badgeInk }}
          >
            #{index + 1}
          </span>
          <Avatar
            person={m}
            ring={{ gap: 2, width: 2, color: S.dot }}
            className="size-10 text-[14px]"
          />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[15px] font-bold">{m.name}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-pewter">
              {m.loc}
              {showRel && (
                <Tint bg={rel.bg} ink={rel.ink} className="px-1.75 text-[11px]">
                  {rel.label}
                </Tint>
              )}
            </span>
          </span>
          <span className="flex flex-none flex-col items-end leading-[1.2]">
            <span className="text-[16px] font-extrabold">{inrShort(m.sales)}</span>
            <span className="text-[12px] text-fog">of {inrShort(m.target)}</span>
          </span>
        </span>

        {/* Progress bar */}
        <span className="flex w-full items-center gap-2.5">
          <span className="relative block h-2 flex-1 rounded-full bg-well">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.min(m.ach, 1) * 100}%`,
                background: S.dot,
              }}
            />
          </span>
          <span className="min-w-9.5 text-right text-[13px] font-extrabold" style={{ color: S.ink }}>
            {percent(m.ach)}
          </span>
        </span>

        <span className="flex w-full items-center justify-between gap-2">
          <Tint bg={S.bg} ink={S.ink} className="px-2.25 py-0.5 text-[11.5px]">
            {S.label}
          </Tint>
          <span className="flex items-center gap-2 text-[12.5px] text-pewter">
            Earned {inrShort(m.earn)}
            <span className="inline-flex items-center gap-0.75 font-bold text-navy">
              <Star size={13} />
              {m.rating.toFixed(1)}
            </span>
          </span>
        </span>
      </button>
    );
  };

  // Render SDO team row
  const renderSdoRow = (d: SdoMetric, index: number) => {
    const S = d.status ? STATUS[d.status] : NO_STATUS;
    const rank = rankStyle(index);

    return (
      <button
        key={d.id}
        type="button"
        onClick={() => onOpenSdo(d.id)}
        aria-label={`Open ${d.name}'s team`}
        className="flex w-full cursor-pointer flex-col gap-2.5 rounded-[18px] border border-[#eeebe4] bg-white px-3.5 py-3 text-left text-navy transition-all hover:border-[#cfcbc1] hover:scale-[1.005]"
      >
        <span className="flex w-full items-center gap-2.5">
          <span
            className="flex h-6 min-w-7.5 flex-none items-center justify-center rounded-lg px-1.5 text-[12px] font-extrabold"
            style={{ background: rank.badgeBg, color: rank.badgeInk }}
          >
            #{index + 1}
          </span>
          <Avatar
            person={d}
            ring={{ gap: 2, width: 2, color: S.dot }}
            className="size-11 text-[15px]"
          />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="text-[15px] font-bold">{d.name}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-pewter">
              {d.region} · {d.id}
              <Tint bg="#F7E9F4" ink="#8E3479" className="px-1.75 text-[11px]">
                {plural(d.n, "SO")}
              </Tint>
            </span>
          </span>
          <span className="flex flex-none flex-col items-end leading-[1.2]">
            <span className="text-[16px] font-extrabold">{inrShort(d.sales)}</span>
            <span className="text-[12px] text-fog">of {inrShort(d.target)}</span>
          </span>
          <LuChevronRight size={18} className="flex-none text-mist" />
        </span>

        {d.n > 0 ? (
          <>
            <span className="flex w-full items-center gap-2.5">
              <span className="relative block h-2 flex-1 rounded-full bg-well">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.min(d.ach, 1) * 100}%`, background: S.dot }}
                />
              </span>
              <span className="min-w-9.5 text-right text-[13px] font-extrabold" style={{ color: S.ink }}>
                {percent(d.ach)}
              </span>
            </span>
            <span className="flex w-full flex-wrap items-center gap-1.5">
              <Tint bg={S.bg} ink={S.ink} className="px-2.25 py-0.5 text-[11.5px]">
                {S.label}
              </Tint>
              <span className="text-[12px] font-semibold text-[#1f5fbf]">
                {d.counts.excellent + d.counts.on} on track
              </span>
              <span className="text-[12px] text-ash">·</span>
              <span className="text-[12px] font-semibold text-brick">{d.counts.risk} at risk</span>
              <span className="ml-auto inline-flex items-center gap-0.75 text-[12.5px] font-bold text-navy">
                <Star size={13} />
                {d.rating.toFixed(1)}
              </span>
            </span>
          </>
        ) : (
          <span className="flex w-full items-center gap-2 rounded-xl bg-wash px-2.5 py-2 text-[12.5px] text-steel">
            No SOs assigned yet.
          </span>
        )}
        <span className="text-[12px] font-semibold text-plum">
          {d.visits} of {d.visitsDue} field coaching visits conducted
        </span>
      </button>
    );
  };

  // Render CSDO Region block
  const renderCsdoRow = (c: CsdoMetric, index: number) => {
    const S = c.status ? STATUS[c.status] : STATUS.on;
    const rank = rankStyle(index);

    return (
      <button
        key={c.id}
        type="button"
        onClick={() => onOpenCsdo(c.id)}
        aria-label={`Open ${c.name}'s region`}
        className="flex w-full cursor-pointer flex-col gap-2.5 rounded-[18px] border border-[#cbd5e1] bg-white px-4 py-3.5 text-left text-navy transition-all hover:border-[#94a3b8] hover:scale-[1.005]"
      >
        <div className="flex w-full items-center gap-3">
          <span
            className="flex h-6 min-w-7.5 flex-none items-center justify-center rounded-lg px-1.5 text-[12px] font-extrabold"
            style={{ background: rank.badgeBg, color: rank.badgeInk }}
          >
            #{index + 1}
          </span>
          <Avatar
            person={c}
            ring={{ gap: 2, width: 2, color: S.dot }}
            className="size-12 text-[16px]"
          />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="text-[16px] font-extrabold text-navy truncate">{c.name}</span>
            <span className="flex items-center gap-1.5 text-[13px] text-steel">
              <LuMapPin size={13} className="text-[#0284c7]" />
              {c.region} · {c.id}
            </span>
          </div>
          <div className="flex flex-none flex-col items-end leading-[1.2]">
            <span className="text-[17px] font-extrabold text-navy">{inrShort(c.sales)}</span>
            <span className="text-[12px] text-fog">of {inrShort(c.target)}</span>
          </div>
          <LuChevronRight size={18} className="flex-none text-mist" />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative h-2 flex-1 rounded-full bg-well">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(c.ach, 1) * 100}%`, background: S.dot }}
            />
          </div>
          <span className="min-w-9.5 text-right text-[13px] font-extrabold" style={{ color: S.ink }}>
            {percent(c.ach)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[12px] text-plum font-semibold">
          <span>{c.visits} of {c.visitsDue} field visits conducted</span>
          <span className="text-steel font-normal">Pace: {percent(c.pace)}</span>
        </div>
      </button>
    );
  };

  // Filtered lists for rendering
  const filteredSos = an.inViewSos
    .filter((m) => matchesQuery(m, an.relation(m.id).label) && matchesStatus(m.status))
    .sort(byKey(sorts["ALL"] ?? "ach"));

  const filteredCsdos = an.csdos
    .filter((c) => matchesQuery(c) && matchesStatus(c.status))
    .sort(byKey(sorts["CSDOS"] ?? "ach"));

  const filteredSdos = an.sdos
    .filter((d) => matchesQuery(d) && matchesStatus(d.status))
    .sort(byKey(sorts["SDOS"] ?? "ach"));

  const isExpandedAll = !!expanded["ALL"];
  const shownSos = isExpandedAll ? filteredSos : filteredSos.slice(0, PAGE);

  const isExpandedSdos = !!expanded["SDOS"];
  const shownSdos = isExpandedSdos ? filteredSdos : filteredSdos.slice(0, SDO_PAGE);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Grouped vs Combined Toggle when in Zone View */}
      {view === "zone" && (
        <div className="flex flex-col gap-1.5">
          <Eyebrow>DIRECTORY VIEW MODE</Eyebrow>
          <div className="grid grid-cols-2 gap-0.5 rounded-[14px] bg-[#eae8e2] p-1 md:max-w-120">
            {(
              [
                ["grouped", "Grouped by CSDO Region"],
                ["combined", "All SOs combined"],
              ] as [Layout, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={layout === key}
                onClick={() => onLayout(key)}
                className={`h-9 cursor-pointer rounded-[10px] text-[13px] transition ${segmentClass(
                  layout === key
                )}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Display Sections */}
      {layout === "combined" || view === "sos" || view === "direct" ? (
        // Combined Flat View
        <section className={`flex flex-col gap-3 rounded-[22px] p-4 ${PANEL}`}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle
              title="State Frontline Sales Force"
              sub={`${filteredSos.length} sales organizers · ranked by performance`}
            />
            <Tint bg={TAGS.all.bg} ink={TAGS.all.ink} className="px-2.5 py-0.75 text-[10.5px]">
              STATEWIDE
            </Tint>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Eyebrow className="mr-0.5">SORT BY</Eyebrow>
            {SORTS.map((o) => (
              <button
                key={o.key}
                type="button"
                aria-pressed={(sorts["ALL"] ?? "ach") === o.key}
                onClick={() => onSort("ALL", o.key)}
                className={`h-7.5 cursor-pointer rounded-full border px-2.75 text-[12.5px] font-semibold transition ${chipClass(
                  (sorts["ALL"] ?? "ach") === o.key
                )}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {filteredSos.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {shownSos.map((m, i) => renderSoRow(m, i, true))}
            </div>
          ) : (
            <EmptySection
              title="No sales organizers match these filters"
              body="Try resetting the search query or status filter to see more associates."
              onClear={onClear}
            />
          )}

          {filteredSos.length > PAGE && (
            <button
              type="button"
              onClick={() => onExpand("ALL")}
              className="h-9.5 cursor-pointer self-center rounded-full border border-edge bg-white px-4.5 text-[13px] font-bold text-navy transition hover:bg-wash"
            >
              {isExpandedAll ? "Show fewer" : `Show ${filteredSos.length - PAGE} more`}
            </button>
          )}
        </section>
      ) : (
        // Grouped by CSDO Regions
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-stretch gap-3.5">
          {/* CSDO Regional Overview Section */}
          <section className={`flex h-full flex-col justify-between gap-3 rounded-[22px] p-4 ${PANEL}`}>
            <div className="flex items-start justify-between gap-2">
              <CardTitle
                title="CSDO Regional Divisions"
                sub={`${filteredCsdos.length} Chief SDOs reporting to this Sales Manager`}
              />
              <Tint bg={TAGS.csdos.bg} ink={TAGS.csdos.ink} className="px-2.5 py-0.75 text-[10.5px]">
                REGIONS
              </Tint>
            </div>

            {filteredCsdos.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {filteredCsdos.map((c, i) => renderCsdoRow(c, i))}
              </div>
            ) : (
              <EmptySection
                title="No CSDO regions match these filters"
                body="Try another search term or performance status filter."
                onClear={onClear}
              />
            )}

            <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-[12px]">
              <div className="flex items-center gap-1.5 text-navy font-bold">
                <LuMapPin size={13} className="text-[#0284c7]" />
                <span>State Zone Footprint</span>
              </div>
              <span className="text-pewter font-medium">
                {filteredCsdos.length} CSDOs · 6 SDO Teams · 29 SOs
              </span>
            </div>
          </section>

          {/* SDO Field Teams Section */}
          <section className={`flex h-full flex-col justify-between gap-3 rounded-[22px] p-4 ${PANEL}`}>
            <div className="flex items-start justify-between gap-2">
              <CardTitle
                title="SDO Field Teams"
                sub={`${filteredSdos.length} field supervisors across all divisions`}
              />
              <Tint bg={TAGS.sdos.bg} ink={TAGS.sdos.ink} className="px-2.5 py-0.75 text-[10.5px]">
                TEAMS
              </Tint>
            </div>

            {filteredSdos.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {shownSdos.map((d, i) => renderSdoRow(d, i))}
              </div>
            ) : (
              <EmptySection
                title="No SDO teams match these filters"
                body="Try another search term or status filter."
                onClear={onClear}
              />
            )}

            {filteredSdos.length > SDO_PAGE && (
              <button
                type="button"
                onClick={() => onExpand("SDOS")}
                className="h-9.5 cursor-pointer self-center rounded-full border border-edge bg-white px-4.5 text-[13px] font-bold text-navy transition hover:bg-wash"
              >
                {isExpandedSdos ? "Show fewer" : `Show ${filteredSdos.length - SDO_PAGE} more`}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function EmptySection({
  title,
  body,
  onClear,
}: {
  title: string;
  body: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#e1ddd3] bg-field px-4 py-5 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-pill text-fog">
        <LuUsers size={19} />
      </span>
      <span className="text-[15px] font-bold text-navy">{title}</span>
      <span className="max-w-90 text-pretty text-[13px] text-pewter">{body}</span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 h-8.5 cursor-pointer rounded-full border border-edge bg-white px-3.5 text-[13px] font-bold text-navy transition hover:bg-wash"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
