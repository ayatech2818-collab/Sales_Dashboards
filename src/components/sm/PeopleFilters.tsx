import { useState, type ReactNode } from "react";
import { LuChevronDown, LuSearch, LuUsers, LuX } from "react-icons/lu";
import { HISTORY_START, TODAY, type SmScope } from "@/data/sm";
import {
  STATUS,
  STATUSES,
  avatar,
  firstName,
  plural,
  type Filters,
  type PeriodKey,
  type SmAnalysis,
  type StatusFilter,
  type TypeFilter,
} from "./model";
import { Eyebrow, PANEL, chipClass, segmentClass } from "./parts";

const PERIODS: [PeriodKey, string][] = [
  ["today", "Today"],
  ["week", "Week"],
  ["month", "Month"],
  ["quarter", "Quarter"],
  ["custom", "Custom"],
];

const FIELD =
  "h-11 w-full appearance-none rounded-[14px] border border-seam bg-wash pl-3 pr-8.5 text-[14px] font-semibold text-navy outline-none";

interface PeopleFiltersProps {
  scope: SmScope;
  an: SmAnalysis;
  filters: Filters;
  activeCount: number;
  onQuery: (q: string) => void;
  onOpenCsdo: (id: string) => void;
  onOpenSdo: (id: string) => void;
  onOpenSo: (id: string) => void;
  onType: (type: TypeFilter) => void;
  onAllCsdos: () => void;
  onAllSdos: () => void;
  onAllSos: () => void;
  onPeriod: (period: PeriodKey) => void;
  onDates: (patch: { from?: string; to?: string }) => void;
  onStatus: (status: StatusFilter) => void;
  onClear: () => void;
}

export function PeopleFilters({
  scope,
  an,
  filters: f,
  activeCount,
  onQuery,
  onOpenCsdo,
  onOpenSdo,
  onOpenSo,
  onType,
  onAllCsdos,
  onAllSdos,
  onAllSos,
  onPeriod,
  onDates,
  onStatus,
  onClear,
}: PeopleFiltersProps) {
  const { view, csdo, sdo, so } = an;

  const title = {
    zone: "State operations",
    csdos: "All CSDO regions",
    csdo: `CSDO: ${csdo?.name}`,
    sdos: "All SDO teams",
    sdo: `SDO: ${sdo?.name}`,
    direct: "Direct SOs under CSDOs",
    sos: "All sales organizers",
    so: `SO: ${so?.name}`,
  }[view];

  const typeChips: [TypeFilter, string, number | null][] = [
    ["all", "Zone Overview", null],
    ["csdos", "CSDOs", scope.csdos.length],
    ["sdos", "SDOs", scope.sdos.length],
    ["direct", "CSDO Direct", an.directSos.length],
    ["sos", "All SOs", scope.sos.length],
  ];

  // SDO selection pool based on selected CSDO
  const sdoPool = csdo ? csdo.sdos : an.sdos;

  // SO selection pool based on selected SDO or CSDO
  const soPool = sdo
    ? sdo.team
    : csdo
      ? csdo.allSos
      : f.type === "direct"
        ? an.directSos
        : f.type === "sdos"
          ? an.indirectSos
          : an.allSos;

  const soOptions = soPool
    .slice()
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((m) => {
      const rel = scope.rel[m.id];
      const sdo = rel?.type === "sdo" ? an.sdoById[rel.sdoId] : null;
      const csdo = rel ? an.csdoById[rel.csdoId] : null;
      const subtitle = sdo
        ? `SDO ${firstName(sdo.name)}`
        : csdo
          ? `CSDO ${firstName(csdo.name)}`
          : "Direct";
      return {
        value: m.id,
        label: `${m.name} · ${subtitle}`,
      };
    });

  return (
    <section
      className={`relative z-5 flex flex-col gap-3.5 rounded-[22px] p-4 ${PANEL}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-9.5 flex-none items-center justify-center rounded-xl bg-navy text-white">
          <LuUsers size={18} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-[1.2]">
          <Eyebrow>EXECUTIVE WORKFORCE & SCOPE</Eyebrow>
          <span className="text-[16px] font-bold text-navy">{title}</span>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 flex-none cursor-pointer items-center gap-1 rounded-full border border-seam bg-white px-3 text-[12.5px] font-bold text-brick transition hover:bg-[#fff5f5]"
          >
            <LuX size={13} strokeWidth={2.4} />
            Reset ({activeCount})
          </button>
        )}
      </div>

      {/* Omni-search */}
      <AssociateSearch
        scope={scope}
        an={an}
        query={f.q}
        onQuery={onQuery}
        onOpenCsdo={onOpenCsdo}
        onOpenSdo={onOpenSdo}
        onOpenSo={onOpenSo}
      />

      {/* Associate Tier Filter Chips */}
      <div className="flex flex-col gap-1.5">
        <Eyebrow>ORGANIZATION TIER</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          {typeChips.map(([type, label, count]) => {
            const active = f.type === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => onType(type)}
                className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${chipClass(
                  active,
                )}`}
              >
                {label}
                {count !== null && (
                  <span
                    className={`rounded-full px-1.75 text-[11.5px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-pill text-[#5b6070]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Tier Cascading Hierarchy Selectors */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
        {/* Tier 1: CSDO Region */}
        <label className="flex flex-col gap-1.5">
          <Eyebrow>CSDO REGION</Eyebrow>
          <Select
            value={csdo?.id ?? ""}
            onChange={(v) => (v ? onOpenCsdo(v) : onAllCsdos())}
          >
            <option value="">All CSDO Regions ({scope.csdos.length})</option>
            {an.csdos.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.name} · ${c.region} (${c.n} SOs)`}
              </option>
            ))}
          </Select>
        </label>

        {/* Tier 2: SDO Team */}
        <label className="flex flex-col gap-1.5">
          <Eyebrow>SDO FIELD TEAM</Eyebrow>
          <Select
            value={sdo?.id ?? ""}
            onChange={(v) => (v ? onOpenSdo(v) : onAllSdos())}
          >
            <option value="">
              {sdoPool.length
                ? `All SDOs (${sdoPool.length})`
                : "No SDOs in scope"}
            </option>
            {sdoPool.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.name} · ${plural(d.n, "SO")}`}
              </option>
            ))}
          </Select>
        </label>

        {/* Tier 3: Sales Organizer */}
        <label className="flex flex-col gap-1.5">
          <Eyebrow>SALES ORGANIZER (SO)</Eyebrow>
          <Select
            value={so?.id ?? ""}
            onChange={(v) => (v ? onOpenSo(v) : onAllSos())}
          >
            <option value="">
              {soPool.length ? `All SOs (${soPool.length})` : "No SOs"}
            </option>
            {soOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {/* Reporting Period */}
      <div className="flex flex-col gap-1.5">
        <Eyebrow>REPORTING TIMEFRAME</Eyebrow>
        <div className="grid grid-cols-5 gap-0.5 rounded-[14px] bg-well p-1">
          {PERIODS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={f.period === key}
              onClick={() => onPeriod(key)}
              className={`h-9 cursor-pointer rounded-[10px] px-0.5 text-[13px] transition ${segmentClass(
                f.period === key,
              )}`}
            >
              {label}
            </button>
          ))}
        </div>
        {f.period === "custom" && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <DateField
              label="From Date"
              value={f.from}
              onChange={(from) => onDates({ from })}
            />
            <DateField
              label="To Date"
              value={f.to}
              onChange={(to) => onDates({ to })}
            />
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex flex-col gap-1.5">
        <Eyebrow>PERFORMANCE HEALTH</Eyebrow>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
          {(["all", ...STATUSES] as StatusFilter[]).map((key) => {
            const active = f.status === key;
            const dot =
              key === "all"
                ? active
                  ? "#FFFFFF"
                  : "#9AA0AE"
                : STATUS[key].dot;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onStatus(key)}
                className={`flex h-9 flex-none cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition ${chipClass(
                  active,
                )}`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: dot }}
                />
                {key === "all" ? "All Statuses" : STATUS[key].label}
              </button>
            );
          })}
        </div>
        <span className="text-[12px] text-fog">
          Pacing evaluates sales against target due to date: Excellent ≥100% ·
          On Track 80–99% · Needs Attention 60–79% · At Risk &lt;60%.
        </span>
      </div>
    </section>
  );
}

function Select({
  value,
  disabled,
  onChange,
  children,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} enabled:cursor-pointer`}
      >
        {children}
      </select>
      <LuChevronDown
        size={17}
        className="pointer-events-none absolute right-3 top-3.25 text-pewter"
      />
    </span>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[12px] font-semibold text-pewter">
      {label}
      <input
        type="date"
        value={value}
        min={HISTORY_START}
        max={TODAY}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="h-10.5 rounded-xl border border-seam bg-wash px-2.5 text-[14px] text-navy"
      />
    </label>
  );
}

function AssociateSearch({
  scope,
  an,
  query,
  onQuery,
  onOpenCsdo,
  onOpenSdo,
  onOpenSo,
}: {
  scope: SmScope;
  an: SmAnalysis;
  query: string;
  onQuery: (q: string) => void;
  onOpenCsdo: (id: string) => void;
  onOpenSdo: (id: string) => void;
  onOpenSo: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = (o: { id: string; name: string }) =>
    `${o.name} ${o.id}`.toLowerCase().includes(q);

  const results = !q
    ? []
    : [
        ...scope.csdos.filter(matches).map((c) => ({
          person: c,
          role: "CSDO",
          sub: `Chief SDO · ${c.region} · ${plural(an.csdoById[c.id]?.n || 0, "SO")}`,
          open: () => onOpenCsdo(c.id),
        })),
        ...scope.sdos.filter(matches).map((d) => ({
          person: d,
          role: "SDO",
          sub: `SDO · ${d.region} · ${plural(an.sdoById[d.id]?.n || 0, "SO")}`,
          open: () => onOpenSdo(d.id),
        })),
        ...scope.sos.filter(matches).map((p) => {
          const rel = scope.rel[p.id];
          const csdo = rel ? an.csdoById[rel.csdoId] : null;
          const isDirect = rel?.type === "csdo-direct";
          return {
            person: p,
            role: "SO",
            sub: `${isDirect ? "CSDO-Direct" : "SDO-Managed"} · ${csdo?.region || ""} · ${p.id}`,
            open: () => onOpenSo(p.id),
          };
        }),
      ].slice(0, 7);

  return (
    <div
      className="relative"
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <LuSearch
        size={17}
        className="pointer-events-none absolute left-3.25 top-3.25 text-fog"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          onQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Omni-search CSDOs, SDOs, or SOs by name or ID across the zone…"
        aria-label="Search all associates"
        className="h-11 w-full rounded-[14px] border border-seam bg-wash pl-9.5 pr-3.5 text-[14px] text-navy outline-none"
      />

      {open && q && (
        <div
          role="listbox"
          aria-label="Matching associates"
          className="absolute inset-x-0 top-12.5 z-30 flex flex-col rounded-2xl border border-seam bg-white p-1.5 shadow-[0_12px_28px_rgba(15,23,42,.16)]"
        >
          {results.map((r) => {
            const a = avatar(r.person);
            return (
              <button
                key={r.person.id}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onQuery("");
                  r.open();
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-navy hover:bg-[#f8fafc] focus-visible:bg-[#f8fafc]"
              >
                <span
                  className="flex size-8 flex-none items-center justify-center rounded-full text-[12px] font-extrabold"
                  style={{ background: a.bg, color: a.ink }}
                >
                  {a.initials}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-[1.2]">
                  <span className="flex items-center gap-1.5 font-bold text-[14px]">
                    {r.person.name}
                    <span className="rounded-md bg-pill px-1.5 py-0.5 text-[10px] font-bold text-steel">
                      {r.role}
                    </span>
                  </span>
                  <span className="text-[12px] text-pewter">{r.sub}</span>
                </span>
              </button>
            );
          })}
          {!results.length && (
            <span className="px-3 py-2.5 text-[13px] text-pewter">
              No associates in this Sales Manager zone match &ldquo;{query}
              &rdquo;.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
