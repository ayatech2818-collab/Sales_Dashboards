import { LuChevronRight, LuUsers } from "react-icons/lu";
import { TODAY_DAY, type Scope } from "@/data/csdo";
import { dayLabel, parseDay } from "@/lib/calendar";
import { inrShort, percent } from "@/lib/format";
import {
  NO_STATUS,
  SORTS,
  STATUS,
  byKey,
  firstName,
  plural,
  rankStyle,
  type Analysis,
  type AssignFilter,
  type Filters,
  type Layout,
  type SdoMetric,
  type SoMetric,
  type SortKey,
} from "./model";
import { Avatar, CardTitle, Eyebrow, PANEL, Star, Tint, chipClass, segmentClass } from "./parts";

/** Rows shown before "Show more". */
const PAGE = 5;

const TAGS = {
  direct: { label: "DIRECT", bg: "#EEEDFC", ink: "#4B3FC7" },
  indirect: { label: "VIA SDOs", bg: "#F7E9F4", ink: "#8E3479" },
  sdos: { label: "SDOs", bg: "#F7E9F4", ink: "#8E3479" },
  all: { label: "ALL", bg: "#F1F0EC", ink: "#3A4152" },
  team: { label: "TEAM", bg: "#F7E9F4", ink: "#8E3479" },
};

interface Chip {
  label: string;
  active: boolean;
  onClick: () => void;
}

interface SectionBase {
  key: string;
  title: string;
  sub: string;
  tag: { label: string; bg: string; ink: string };
  chips?: Chip[];
  /** Empty because of how the org is set up, not because of filters. */
  structural: boolean;
  emptyTitle: string;
  emptyBody: string;
}

type Section =
  | (SectionBase & { kind: "so"; items: SoMetric[]; showRel: boolean })
  | (SectionBase & { kind: "sdo"; items: SdoMetric[] });

interface AssociateSectionsProps {
  scope: Scope;
  an: Analysis;
  filters: Filters;
  layout: Layout;
  onLayout: (layout: Layout) => void;
  sorts: Partial<Record<string, SortKey>>;
  onSort: (section: string, key: SortKey) => void;
  expanded: Partial<Record<string, boolean>>;
  onExpand: (section: string) => void;
  /** SDO chip picked on the "SOs under SDOs" list; "" for all. */
  teamSdo: string;
  onTeamSdo: (id: string) => void;
  assign: AssignFilter;
  onAssign: (assign: AssignFilter) => void;
  onOpenSo: (id: string) => void;
  onOpenSdo: (id: string) => void;
  onClear: () => void;
}

/** Ranked lists of the SOs and SDOs the view covers, grouped by reporting line or combined. */
export function AssociateSections(props: AssociateSectionsProps) {
  const { scope, an, filters, layout, onLayout, sorts, expanded } = props;
  const { view } = an;
  const q = filters.q.trim().toLowerCase();
  const matchesQuery = (o: { name: string; id: string; loc?: string; region?: string }, extra = "") =>
    !q || `${o.name} ${o.id} ${o.loc || o.region || ""} ${extra}`.toLowerCase().includes(q);
  const matchesStatus = (status: string | null) => filters.status === "all" || status === filters.status;

  const direct = (): Section => ({
    key: "A",
    kind: "so",
    title: "Direct SO performance",
    sub: `${plural(an.direct.length, "SO")} assigned directly to you · not part of any SDO team`,
    tag: TAGS.direct,
    items: an.direct,
    showRel: false,
    structural: an.direct.length === 0,
    emptyTitle: "No direct SOs",
    emptyBody: "Every SO in your scope reports through an SDO. Review them under SOs under SDOs.",
  });

  const sdos = (): Section => ({
    key: "B",
    kind: "sdo",
    title: "SDO performance",
    sub: `${plural(an.sdos.length, "SDO")} assigned to you · team metrics include only their own SOs`,
    tag: TAGS.sdos,
    items: an.sdos,
    structural: an.sdos.length === 0,
    emptyTitle: "No SDOs assigned",
    emptyBody:
      "You supervise SOs directly. SDO team performance appears here once an SDO is assigned to you.",
  });

  const indirect = (): Section => {
    const picked = props.teamSdo && an.sdoById[props.teamSdo] ? props.teamSdo : "";
    return {
      key: "C",
      kind: "so",
      title: "SOs under SDOs",
      sub: `${plural(an.indirect.length, "SO")} managed by your ${plural(an.sdos.length, "SDO")} · responsible SDO shown on each`,
      tag: TAGS.indirect,
      chips:
        an.sdos.length > 1
          ? [
              { label: "All SDOs", active: !picked, onClick: () => props.onTeamSdo("") },
              ...an.sdos.map((d) => ({
                label: `${firstName(d.name)} · ${d.n}`,
                active: picked === d.id,
                onClick: () => props.onTeamSdo(d.id),
              })),
            ]
          : undefined,
      items: picked ? an.indirect.filter((m) => an.sdoOf(m.id)!.id === picked) : an.indirect,
      showRel: true,
      structural: an.indirect.length === 0,
      emptyTitle: an.sdos.length ? "No SOs under your SDOs" : "No SDOs assigned",
      emptyBody: an.sdos.length
        ? "Your SDOs have no SOs assigned yet."
        : "You supervise SOs directly. SDO-managed SOs appear here once an SDO is assigned to you.",
    };
  };

  const combined = (): Section => {
    const options: [AssignFilter, string, SoMetric[]][] = [
      ["all", "All", an.all],
      ["direct", "Direct", an.direct],
      ["sdo", "Under SDOs", an.indirect],
    ];
    return {
      key: "ALL",
      kind: "so",
      title: "All SOs",
      sub: `${plural(an.all.length, "unique SO")} · each listed once with their reporting line`,
      tag: TAGS.all,
      chips: options.map(([key, label, list]) => ({
        label: `${label} · ${list.length}`,
        active: props.assign === key,
        onClick: () => props.onAssign(key),
      })),
      items: options.find(([key]) => key === props.assign)![2],
      showRel: true,
      structural: an.all.length === 0,
      emptyTitle: "No SOs in your scope",
      emptyBody: "SOs appear here once they are assigned to you or your SDOs.",
    };
  };

  const team = (sdo: SdoMetric): Section => ({
    key: "T",
    kind: "so",
    title: `${sdo.name}'s team`,
    sub: `${plural(sdo.n, "SO")} assigned to this SDO · direct SOs excluded`,
    tag: TAGS.team,
    items: sdo.team,
    showRel: false,
    structural: sdo.n === 0,
    emptyTitle: `No SOs assigned to ${firstName(sdo.name)} yet`,
    emptyBody: "Team KPIs start when an SO is assigned. This SDO's own field-visit KPI is shown above.",
  });

  const sections: Section[] =
    view === "org"
      ? layout === "combined"
        ? [combined()]
        : [direct(), sdos(), indirect()]
      : view === "direct"
        ? [direct()]
        : view === "sdos"
          ? [sdos()]
          : view === "indirect"
            ? [indirect()]
            : view === "sdo"
              ? [team(an.sdo!)]
              : [];

  return (
    <>
      {view === "org" && scope.sos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Eyebrow>ASSOCIATE PERFORMANCE</Eyebrow>
          <div className="grid grid-cols-2 gap-0.5 rounded-[14px] bg-[#eae8e2] p-1 md:max-w-120">
            {(
              [
                ["grouped", "Grouped by assignment"],
                ["combined", "All SOs combined"],
              ] as [Layout, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={layout === key}
                onClick={() => onLayout(key)}
                className={`h-9 cursor-pointer rounded-[10px] text-[13px] ${segmentClass(layout === key)}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-3.5">
          {sections.map((sec) => {
            const sortKey = sorts[sec.key] ?? "ach";
            const open = !!expanded[sec.key];
            const items =
              sec.kind === "so"
                ? sec.items
                    .filter((m) => matchesQuery(m, an.relation(m.id).label) && matchesStatus(m.status))
                    .sort(byKey(sortKey))
                : sec.items.filter((d) => matchesQuery(d) && matchesStatus(d.status)).sort(byKey(sortKey));
            const shown = open ? items : items.slice(0, PAGE);

            return (
              <section key={sec.key} className={`flex flex-col gap-3 rounded-[22px] p-4 ${PANEL}`}>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle title={sec.title} sub={sec.sub} />
                  <Tint
                    bg={sec.tag.bg}
                    ink={sec.tag.ink}
                    className="flex-none px-2.25 py-0.75 text-[10.5px] tracking-[.1em]"
                  >
                    {sec.tag.label}
                  </Tint>
                </div>

                {sec.chips && (
                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                    {sec.chips.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        aria-pressed={c.active}
                        onClick={c.onClick}
                        className={`h-8 flex-none cursor-pointer rounded-full border px-3 text-[12.5px] font-semibold ${chipClass(c.active)}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                {items.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Eyebrow className="mr-0.5">SORT</Eyebrow>
                    {SORTS.map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        aria-pressed={o.key === sortKey}
                        onClick={() => props.onSort(sec.key, o.key)}
                        className={`h-7.5 cursor-pointer rounded-full border px-2.75 text-[12.5px] font-semibold ${chipClass(o.key === sortKey)}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {items.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {sec.kind === "so"
                      ? (shown as SoMetric[]).map((m, i) => (
                          <SoRow
                            key={m.id}
                            an={an}
                            m={m}
                            index={i}
                            showRel={sec.showRel}
                            onOpen={() => props.onOpenSo(m.id)}
                          />
                        ))
                      : (shown as SdoMetric[]).map((d) => (
                          <SdoRow key={d.id} d={d} onOpen={() => props.onOpenSdo(d.id)} />
                        ))}
                  </div>
                ) : (
                  <EmptySection
                    title={sec.structural ? sec.emptyTitle : sec.kind === "so" ? "No SOs match these filters" : "No SDOs match these filters"}
                    body={
                      sec.structural
                        ? sec.emptyBody
                        : sec.kind === "so"
                          ? "Try another status, search term or SDO."
                          : "Try another status or search term."
                    }
                    onClear={sec.structural ? undefined : props.onClear}
                  />
                )}

                {items.length > PAGE && (
                  <button
                    type="button"
                    onClick={() => props.onExpand(sec.key)}
                    className="h-9.5 cursor-pointer self-center rounded-full border border-edge bg-white px-4.5 text-[13px] font-bold text-navy"
                  >
                    {open ? "Show fewer" : `Show ${items.length - PAGE} more`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Bar({ value, color, paceAt }: { value: number; color: string; paceAt?: string }) {
  return (
    <span className="relative block h-2 flex-1 rounded-full bg-well">
      <span
        className="block h-full rounded-full"
        style={{ width: `${Math.min(value, 1) * 100}%`, background: color }}
      />
      {paceAt && (
        <span
          className="absolute -top-0.75 h-3.5 w-0.5 rounded-[1px] bg-[#9aa0ae]"
          style={{ left: paceAt }}
        />
      )}
    </span>
  );
}

function SoRow({
  an,
  m,
  index,
  showRel,
  onOpen,
}: {
  an: Analysis;
  m: SoMetric;
  index: number;
  showRel: boolean;
  onOpen: () => void;
}) {
  const S = STATUS[m.status];
  const rank = rankStyle(index);
  const rel = an.relation(m.id);
  const parent = an.sdoOf(m.id);
  const podium = index < 3;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${m.name}, ${parent ? `SO under SDO ${parent.name}` : "direct SO"}`}
      className={`flex w-full cursor-pointer flex-col gap-2.5 rounded-[18px] border px-3.5 py-3 text-left text-navy transition-colors hover:border-[#cfcbc1] ${
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
        <Avatar person={m} ring={{ gap: 2, width: 2, color: S.dot }} className="size-10 text-[14px]" />
        <span className="flex min-w-0 flex-1 flex-col leading-[1.25]">
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
      <span className="flex w-full items-center gap-2.5">
        <Bar value={m.ach} color={S.dot} paceAt={`${Math.min(an.range.elapsed, 1) * 100}%`} />
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
}

function SdoRow({ d, onOpen }: { d: SdoMetric; onOpen: () => void }) {
  const S = d.status ? STATUS[d.status] : NO_STATUS;
  const joined = parseDay(d.joined);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${d.name}'s team`}
      className="flex w-full cursor-pointer flex-col gap-2.5 rounded-[18px] border border-[#eeebe4] bg-white px-3.5 py-3 text-left text-navy transition-colors hover:border-[#cfcbc1]"
    >
      <span className="flex w-full items-center gap-2.5">
        <Avatar person={d} ring={{ gap: 2, width: 2, color: S.dot }} className="size-11 text-[15px]" />
        <span className="flex min-w-0 flex-1 flex-col leading-[1.25]">
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
            <Bar value={d.ach} color={S.dot} />
            <span className="min-w-9.5 text-right text-[13px] font-extrabold" style={{ color: S.ink }}>
              {percent(d.ach)}
            </span>
          </span>
          <span className="flex w-full flex-wrap items-center gap-1.5">
            <Tint bg={S.bg} ink={S.ink} className="px-2.25 py-0.5 text-[11.5px]">
              {S.label}
            </Tint>
            <span className="text-[12px] font-semibold text-[#1f5fbf]">
              {d.counts.excellent + d.counts.on} on track or better
            </span>
            <span className="text-[12px] text-ash">·</span>
            <span className="text-[12px] font-semibold text-brick">{d.counts.risk} at risk</span>
            <span className="ml-auto inline-flex items-center gap-0.75 text-[12.5px] font-bold">
              <Star size={13} />
              {d.rating.toFixed(1)}
            </span>
          </span>
        </>
      ) : (
        <span className="flex w-full items-center gap-2 rounded-xl bg-wash px-2.5 py-2 text-[12.5px] text-steel">
          No SOs assigned yet{joined >= TODAY_DAY - 30 ? ` · joined ${dayLabel(joined)}` : ""}. Own KPIs
          below.
        </span>
      )}
      <span className="text-[12px] font-semibold text-plum">
        {d.visits} of {d.visitsDue} field visits due
      </span>
    </button>
  );
}

function EmptySection({ title, body, onClear }: { title: string; body: string; onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#e1ddd3] bg-[#faf9f6] px-4 py-4.5 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-pill text-fog">
        <LuUsers size={19} />
      </span>
      <span className="text-[15px] font-bold">{title}</span>
      <span className="max-w-90 text-pretty text-[13px] text-pewter">{body}</span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 h-8.5 cursor-pointer rounded-full border border-edge bg-white px-3.5 text-[13px] font-bold text-navy"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
