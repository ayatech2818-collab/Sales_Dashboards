import {
  MdExpandLess,
  MdExpandMore,
  MdOutlineGroups,
  MdRestartAlt,
  MdSearch,
} from "react-icons/md";
import { TODAY } from "@/data/sdo";
import { percent } from "@/lib/format";
import {
  LIST_PAGE,
  isoDay,
  type Category,
  type CategoryStyle,
  type PerfFilter,
  type PeriodKey,
  type SoMetric,
  type StatusFilter,
  type ViewState,
} from "./model";
import { Eyebrow, SoAvatar } from "./parts";

const PERIODS: [PeriodKey, string][] = [
  ["today", "Today"],
  ["week", "Week"],
  ["month", "Month"],
  ["custom", "Custom"],
];

const STATUSES: [StatusFilter, string][] = [
  ["all", "Any status"],
  ["active", "Active"],
  ["inactive", "Inactive"],
];

const DATE_INPUT =
  "rounded-xl border-[1.5px] border-line bg-field p-2 text-[14px] text-ink";

function chipClass(on: boolean): string {
  return `flex flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3 py-1.5 text-[14px] font-semibold ${
    on ? "border-night bg-night text-white" : "border-line bg-white text-label"
  }`;
}

interface FilterPanelProps {
  view: ViewState;
  /** Every assigned organizer. */
  metrics: SoMetric[];
  selected: SoMetric | null;
  cats: Record<Category, CategoryStyle>;
  hasFilters: boolean;
  onChange: (patch: Partial<ViewState>) => void;
  /** Focus the dashboard on one organizer, or "all". */
  onPick: (person: string) => void;
  onReset: () => void;
}

export function FilterPanel({
  view,
  metrics,
  selected,
  cats,
  hasFilters,
  onChange,
  onPick,
  onReset,
}: FilterPanelProps) {
  const query = view.peopleQuery.trim().toLowerCase();
  const people = metrics.filter(
    (m) =>
      !query ||
      m.so.name.toLowerCase().includes(query) ||
      m.so.territory.toLowerCase().includes(query),
  );
  const perfOptions: [PerfFilter, string, string][] = [
    ["all", "All", "#b8b5ad"],
    ["top", "Top Performers", cats.excellent.color],
    ["ontrack", "On Track", cats.ontrack.color],
    ["attention", "Needs Attention", cats.attention.color],
  ];
  const Chevron = view.peopleOpen ? MdExpandLess : MdExpandMore;

  return (
    <section className="flex flex-col gap-3 rounded-[28px] bg-white p-3.5 shadow-card">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onChange({ peopleOpen: !view.peopleOpen })}
          aria-expanded={view.peopleOpen}
          className="flex min-h-[52px] min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[18px] border-[1.5px] border-line bg-field px-3 py-2 text-left"
        >
          {selected ? (
            <SoAvatar
              so={selected.so}
              className="size-9 text-[14px] shadow-[0_0_0_2px_#fff,0_0_0_4px_#3ecf8e]"
            />
          ) : (
            <div className="flex size-9 flex-none items-center justify-center rounded-full bg-night text-white">
              <MdOutlineGroups size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Eyebrow>PEOPLE</Eyebrow>
            <div className="truncate font-display text-[16px] font-bold leading-[1.1]">
              {selected ? selected.so.name : "All Sales Organizers"}
            </div>
          </div>
          <Chevron size={22} className="flex-none text-sub" />
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex flex-none cursor-pointer items-center gap-1 rounded-[18px] bg-danger-soft px-3.5 text-[14px] font-bold text-[#b23a3a]"
          >
            <MdRestartAlt size={18} />
            Reset
          </button>
        )}
      </div>

      {view.peopleOpen && (
        <div className="overflow-hidden rounded-[18px] border-[1.5px] border-line">
          <div className="flex items-center gap-2 border-b border-well px-3 py-2">
            <MdSearch size={20} className="flex-none text-hint" />
            <input
              value={view.peopleQuery}
              onChange={(e) => onChange({ peopleQuery: e.target.value })}
              placeholder="Search by name or territory"
              aria-label="Search Sales Organizers"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => onPick("all")}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-2 text-left ${
                selected ? "" : "bg-tab"
              }`}
            >
              <div className="flex size-8 flex-none items-center justify-center rounded-full bg-night text-white">
                <MdOutlineGroups size={18} />
              </div>
              <div className="flex-1 text-[15px] font-bold">All Sales Organizers</div>
              <div className="text-[13px] text-hint">{metrics.length}</div>
            </button>
            {people.map((m) => {
              const color = cats[m.cat].color;
              return (
                <button
                  key={m.so.id}
                  type="button"
                  onClick={() => onPick(m.so.id)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-2 text-left ${
                    view.person === m.so.id ? "bg-[#effaf4]" : ""
                  }`}
                >
                  <SoAvatar so={m.so} className="size-8 text-[13px]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold leading-[1.2]">{m.so.name}</div>
                    <div className="text-[12px] text-hint">
                      {m.so.territory}
                      {m.so.status === "inactive" && " · Inactive"}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-[5px] text-[13px] font-bold"
                    style={{ color }}
                  >
                    <span className="size-2 rounded-full" style={{ background: color }} />
                    <span>{percent(m.pct)}</span>
                  </div>
                </button>
              );
            })}
            {people.length === 0 && (
              <div className="p-4 text-center text-[14px] text-hint">
                No organizer matches “{view.peopleQuery}”
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Eyebrow>PERIOD</Eyebrow>
        <div role="tablist" className="grid grid-cols-4 gap-1 rounded-[14px] bg-tab p-1">
          {PERIODS.map(([key, label]) => {
            const on = view.period === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onChange({ period: key })}
                className={`cursor-pointer rounded-[10px] px-1 py-2 text-[14px] font-bold transition-[background] duration-200 ${
                  on ? "bg-white text-ink shadow-[0_2px_8px_rgba(30,32,50,.1)]" : "text-dim"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {view.period === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5 text-[12px] font-semibold text-hint">
              From
              <input
                type="date"
                value={view.customStart}
                min={isoDay(0)}
                max={isoDay(TODAY)}
                onChange={(e) => onChange({ customStart: e.target.value })}
                className={DATE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[12px] font-semibold text-hint">
              To
              <input
                type="date"
                value={view.customEnd}
                min={isoDay(0)}
                max={isoDay(TODAY)}
                onChange={(e) => onChange({ customEnd: e.target.value })}
                className={DATE_INPUT}
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Eyebrow>PERFORMANCE · STATUS</Eyebrow>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
          {perfOptions.map(([key, label, dot]) => {
            const on = view.perf === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ perf: key, shown: LIST_PAGE })}
                className={chipClass(on)}
              >
                <span className="size-2 rounded-full" style={{ background: dot }} />
                {label}
              </button>
            );
          })}
          <div className="mx-0.5 my-1 w-px flex-none bg-line" />
          {STATUSES.map(([key, label]) => {
            const on = view.status === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ status: key, shown: LIST_PAGE })}
                className={chipClass(on)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
