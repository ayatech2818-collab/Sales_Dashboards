import { useState, type ReactNode } from "react";
import { LuChevronDown, LuSearch, LuUsers, LuX } from "react-icons/lu";
import { HISTORY_START, TODAY, type Scope } from "@/data/csdo";
import {
  STATUS,
  STATUSES,
  avatar,
  firstName,
  plural,
  type Analysis,
  type Filters,
  type PeriodKey,
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
  "h-11 w-full appearance-none rounded-[14px] border border-seam bg-wash pl-3 pr-8.5 text-[14px] font-semibold text-navy";

interface PeopleFiltersProps {
  scope: Scope;
  an: Analysis;
  filters: Filters;
  activeCount: number;
  onQuery: (q: string) => void;
  onOpenSdo: (id: string) => void;
  onOpenSo: (id: string) => void;
  onType: (type: TypeFilter) => void;
  /** Leave the SDO (and any SO) picked in the selects. */
  onAllSdos: () => void;
  onAllSos: () => void;
  onPeriod: (period: PeriodKey) => void;
  onDates: (patch: { from?: string; to?: string }) => void;
  onStatus: (status: StatusFilter) => void;
  onClear: () => void;
}

/** Search, associate type, SDO/SO pickers, reporting period and status. */
export function PeopleFilters({
  scope,
  an,
  filters: f,
  activeCount,
  onQuery,
  onOpenSdo,
  onOpenSo,
  onType,
  onAllSdos,
  onAllSos,
  onPeriod,
  onDates,
  onStatus,
  onClear,
}: PeopleFiltersProps) {
  const { view, sdo, so } = an;
  const title = {
    org: "All associates",
    direct: "Direct SOs",
    sdos: "SDOs and their teams",
    indirect: "SOs under SDOs",
    sdo: `SDO: ${sdo?.name}`,
    so: `SO: ${so?.name}`,
  }[view];

  const typeChips: [TypeFilter, string, number | null][] = [
    ["all", "All associates", null],
    ["direct", "Direct SOs", scope.direct.length],
    ["sdos", "SDOs", scope.sdos.length],
    ["indirect", "SOs under SDOs", scope.indirect.length],
  ];

  const sdoDisabled = f.type === "direct" || !scope.sdos.length;
  const soPool = sdo
    ? sdo.team
    : f.type === "direct"
      ? an.direct
      : f.type === "indirect" || f.type === "sdos"
        ? an.indirect
        : an.all;
  const soOptions = soPool
    .slice()
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((m) => ({
      value: m.id,
      label: `${m.name} · ${an.isDirect(m.id) ? "Direct" : `SDO ${firstName(an.sdoOf(m.id)!.name)}`}`,
    }));

  return (
    <section className={`relative z-5 flex flex-col gap-3.5 rounded-[22px] p-4 ${PANEL}`}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-9.5 flex-none items-center justify-center rounded-xl bg-navy text-white">
          <LuUsers size={18} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-[1.2]">
          <Eyebrow>PEOPLE</Eyebrow>
          <span className="text-[16px] font-bold">{title}</span>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 flex-none cursor-pointer items-center gap-1 rounded-full border border-seam bg-white px-3 text-[12.5px] font-bold text-brick"
          >
            <LuX size={13} strokeWidth={2.4} />
            Clear ({activeCount})
          </button>
        )}
      </div>

      <AssociateSearch
        scope={scope}
        an={an}
        query={f.q}
        onQuery={onQuery}
        onOpenSdo={onOpenSdo}
        onOpenSo={onOpenSo}
      />

      <div className="flex flex-col gap-1.5">
        <Eyebrow>ASSOCIATE TYPE</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          {typeChips.map(([type, label, count]) => {
            const active = f.type === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => onType(type)}
                className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${chipClass(active)}`}
              >
                {label}
                {count !== null && (
                  <span
                    className={`rounded-full px-1.75 text-[11.5px] font-bold ${
                      active ? "bg-white/18 text-white" : "bg-pill text-[#5b6070]"
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
        <label className="flex flex-col gap-1.5">
          <Eyebrow>SDO</Eyebrow>
          <Select
            value={sdoDisabled ? "" : (sdo?.id ?? "")}
            disabled={sdoDisabled}
            onChange={(v) => (v ? onOpenSdo(v) : onAllSdos())}
          >
            <option value="">{scope.sdos.length ? "All SDOs" : "No SDOs assigned"}</option>
            {an.sdos.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.name} · ${plural(d.n, "SO")}`}
              </option>
            ))}
          </Select>
          {sdoDisabled && (
            <span className="text-[12px] text-fog">
              {f.type === "direct" ? "Direct SOs don’t report to an SDO." : "No SDOs in your scope."}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow>SO</Eyebrow>
          <Select value={so?.id ?? ""} onChange={(v) => (v ? onOpenSo(v) : onAllSos())}>
            <option value="">{soPool.length ? `All SOs (${soPool.length})` : "No SOs"}</option>
            {soOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Eyebrow>REPORTING PERIOD</Eyebrow>
        <div className="grid grid-cols-5 gap-0.5 rounded-[14px] bg-well p-1">
          {PERIODS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={f.period === key}
              onClick={() => onPeriod(key)}
              className={`h-9 cursor-pointer rounded-[10px] px-0.5 text-[13px] ${segmentClass(f.period === key)}`}
            >
              {label}
            </button>
          ))}
        </div>
        {f.period === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <DateField label="From" value={f.from} onChange={(from) => onDates({ from })} />
            <DateField label="To" value={f.to} onChange={(to) => onDates({ to })} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Eyebrow>PERFORMANCE · STATUS</Eyebrow>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
          {(["all", ...STATUSES] as StatusFilter[]).map((key) => {
            const active = f.status === key;
            const dot = key === "all" ? (active ? "#FFFFFF" : "#9AA0AE") : STATUS[key].dot;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onStatus(key)}
                className={`flex h-9 flex-none cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${chipClass(active)}`}
              >
                <span className="size-2 rounded-full" style={{ background: dot }} />
                {key === "all" ? "All" : STATUS[key].label}
              </button>
            );
          })}
        </div>
        <span className="text-[12px] text-fog">
          Status compares sales with the target due to date: Excellent ≥100% · On Track 80–99% ·
          Needs Attention 60–79% · At Risk below 60%.
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
        className={`${FIELD} cursor-pointer disabled:cursor-default`}
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

/** Name/ID search with a dropdown of matching SDOs and SOs in scope. */
function AssociateSearch({
  scope,
  an,
  query,
  onQuery,
  onOpenSdo,
  onOpenSo,
}: {
  scope: Scope;
  an: Analysis;
  query: string;
  onQuery: (q: string) => void;
  onOpenSdo: (id: string) => void;
  onOpenSo: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = (o: { id: string; name: string }) => `${o.name} ${o.id}`.toLowerCase().includes(q);

  const results = !q
    ? []
    : [
        ...scope.sdos.filter(matches).map((d) => ({
          person: d,
          sub: `SDO · ${plural(an.sdoById[d.id].n, "SO")} · ${d.id}`,
          open: () => onOpenSdo(d.id),
        })),
        ...scope.sos.filter(matches).map((p) => ({
          person: p,
          sub: `${an.isDirect(p.id) ? "Direct SO" : `SO under SDO ${an.sdoOf(p.id)!.name}`} · ${p.id}`,
          open: () => onOpenSo(p.id),
        })),
      ].slice(0, 6);

  return (
    <div
      className="relative"
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <LuSearch size={17} className="pointer-events-none absolute left-3.25 top-3.25 text-fog" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          onQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search SOs or SDOs by name or ID"
        aria-label="Search associates"
        className="h-11 w-full rounded-[14px] border border-seam bg-wash pl-9.5 pr-3.5 text-[14px] text-navy outline-none placeholder:text-fog focus:border-iris focus:bg-white"
      />
      {open && q && (
        <div
          role="listbox"
          aria-label="Matching associates"
          className="absolute inset-x-0 top-12.5 z-30 flex flex-col rounded-2xl border border-seam bg-white p-1.5 shadow-[0_12px_28px_rgba(29,35,52,.14)]"
        >
          {results.map((r) => {
            const a = avatar(r.person);
            return (
              <button
                key={r.person.id}
                type="button"
                role="option"
                aria-selected={false}
                // Keep focus in the field so the list doesn't close before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onQuery("");
                  r.open();
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-navy hover:bg-linen focus-visible:bg-linen"
              >
                <span
                  className="flex size-8 flex-none items-center justify-center rounded-full text-[12px] font-extrabold"
                  style={{ background: a.bg, color: a.ink }}
                >
                  {a.initials}
                </span>
                <span className="flex min-w-0 flex-col leading-[1.2]">
                  <span className="text-[14px] font-bold">{r.person.name}</span>
                  <span className="text-[12px] text-pewter">{r.sub}</span>
                </span>
              </button>
            );
          })}
          {!results.length && (
            <span className="px-3 py-2.5 text-[13px] text-pewter">
              No associates in your scope match “{query}”.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
