import { MdEmojiEvents, MdOutlinePersonSearch, MdSearch, MdStar } from "react-icons/md";
import { inrShort, percent } from "@/lib/format";
import {
  LIST_PAGE,
  type Category,
  type CategoryStyle,
  type Period,
  type SoMetric,
  type SortKey,
} from "./model";
import { CARD, CardHeading, SoAvatar } from "./parts";

const SORTS: [SortKey, string][] = [
  ["sales", "Sales"],
  ["pct", "Target %"],
  ["earnings", "Earnings"],
  ["score", "Score"],
];

/** Rank chip colors for the podium: [background, text]. */
const PODIUM: Record<number, [string, string]> = {
  1: ["#f5b82e", "#4a3300"],
  2: ["#c9ced8", "#2f3447"],
  3: ["#d98b52", "#fff"],
};

interface OrganizerListProps {
  /** Organizers passing the current filters. */
  filtered: SoMetric[];
  /** How many are assigned in total. */
  assigned: number;
  period: Period;
  selected: SoMetric | null;
  cats: Record<Category, CategoryStyle>;
  sort: SortKey;
  query: string;
  shown: number;
  onSort: (sort: SortKey) => void;
  onQuery: (query: string) => void;
  onShowMore: () => void;
  onPick: (person: string) => void;
  onReset: () => void;
}

export function OrganizerList({
  filtered,
  assigned,
  period,
  selected,
  cats,
  sort,
  query,
  shown,
  onSort,
  onQuery,
  onShowMore,
  onPick,
  onReset,
}: OrganizerListProps) {
  const q = query.trim().toLowerCase();
  const matches = filtered
    .filter(
      (m) =>
        !q || m.so.name.toLowerCase().includes(q) || m.so.territory.toLowerCase().includes(q),
    )
    .sort((a, b) => (sort === "score" ? b.so.rating - a.so.rating : b[sort] - a[sort]));
  const remaining = matches.length - shown;

  return (
    <section className={`${CARD} flex flex-col gap-3.5 p-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-2.5">
        <CardHeading
          title="All Sales Organizers"
          sub={`${matches.length} of ${assigned} assigned · ${period.label} · tap to view KPIs`}
        />
        <div className="flex min-w-[min(100%,240px)] flex-[0_1_280px] items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-field px-2.5">
          <MdSearch size={20} className="flex-none text-hint" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search organizers"
            aria-label="Search organizers list"
            className="min-w-0 flex-1 bg-transparent py-[9px] text-[15px] outline-none"
          />
        </div>
      </div>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        <span className="flex-none text-[12px] font-bold tracking-[.06em] text-hint">SORT</span>
        {SORTS.map(([key, label]) => {
          const on = sort === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onSort(key)}
              className={`flex-none cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold ${
                on ? "bg-night text-white" : "bg-tab text-label"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-2.5">
        {matches.slice(0, shown).map((m) => {
          const cat = cats[m.cat];
          const isSelected = selected?.so.id === m.so.id;
          const onPodium = !!m.rank && m.rank <= 3;
          const [rankBg, rankFg] = (m.rank && PODIUM[m.rank]) || ["#f1efe9", "#5d6275"];
          const inactive = m.so.status === "inactive";
          return (
            <button
              key={m.so.id}
              type="button"
              onClick={() => onPick(m.so.id)}
              className="flex w-full cursor-pointer flex-col gap-2.5 rounded-[20px] border-[1.5px] p-3 text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(30,32,50,.08)]"
              style={{
                borderColor: isSelected ? "#3ecf8e" : onPodium ? "#f6e3b0" : "#efede8",
                background: isSelected ? "#effaf4" : onPodium ? "#fffaf0" : "#fff",
                opacity: inactive ? 0.65 : 1,
              }}
            >
              <div className="flex w-full items-center gap-2.5">
                <div
                  className="flex h-6 min-w-[30px] flex-none items-center justify-center rounded-lg px-[5px] font-display text-[13px] font-bold"
                  style={{ background: rankBg, color: rankFg }}
                >
                  {m.rank ? `#${m.rank}` : "—"}
                </div>
                <SoAvatar
                  so={m.so}
                  className="size-[42px] text-[15px]"
                  style={{ boxShadow: `0 0 0 2px #fff,0 0 0 4px ${cat.color}` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[5px]">
                    <div className="truncate text-[15px] font-bold text-ink">{m.so.name}</div>
                    {m.pct >= 1 && (
                      <span title="Target achieved" className="flex-none text-sun">
                        <MdEmojiEvents size={17} />
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-hint">{m.so.territory}</div>
                </div>
                <div className="flex-none text-right">
                  <div className="font-display text-[17px] font-bold leading-[1.1] text-ink">
                    {inrShort(m.sales)}
                  </div>
                  <div className="text-[12px] text-hint">of {inrShort(m.target)}</div>
                </div>
              </div>

              <div className="flex w-full items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-well">
                  <div
                    className="h-full rounded-full transition-[width] duration-600"
                    style={{ width: `${Math.min(m.pct, 1) * 100}%`, background: cat.color }}
                  />
                </div>
                <div
                  className="min-w-[38px] flex-none text-right text-[13px] font-bold"
                  style={{ color: cat.color }}
                >
                  {percent(m.pct)}
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-1.5 text-[12px]">
                <span
                  className="rounded-full px-2 py-0.5 font-bold"
                  style={{ background: cat.soft, color: cat.color }}
                >
                  {cat.label}
                </span>
                {inactive && (
                  <span className="rounded-full bg-[#efeef3] px-2 py-0.5 font-bold text-sub">
                    Inactive
                  </span>
                )}
                <span className="ml-auto font-semibold text-sub">Earned {inrShort(m.earnings)}</span>
                <span className="flex items-center gap-0.5 font-semibold text-sub">
                  <MdStar size={15} className="text-sun" />
                  {m.so.rating.toFixed(1)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {matches.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 px-3 py-7 text-center">
          <MdOutlinePersonSearch size={34} className="text-[#b8b5ad]" />
          <div className="text-[16px] font-bold">No organizers match these filters</div>
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-xl bg-night px-4 py-2 text-[14px] font-bold text-white"
          >
            Clear filters
          </button>
        </div>
      )}

      {remaining > 0 && (
        <button
          type="button"
          onClick={onShowMore}
          className="cursor-pointer self-center rounded-full border-[1.5px] border-[#e2dfd8] bg-white px-4.5 py-2 text-[14px] font-bold text-night"
        >
          Show {Math.min(LIST_PAGE, remaining)} more · {remaining} remaining
        </button>
      )}
    </section>
  );
}
