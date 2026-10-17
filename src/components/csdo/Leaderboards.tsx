import { useRef } from "react";
import { LuChevronLeft, LuChevronRight, LuTrophy } from "react-icons/lu";
import { inrShort, percent, shortName } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/utils";
import {
  NO_STATUS,
  STATUS,
  byKey,
  firstName,
  plural,
  rankStyle,
  type Analysis,
  type RelationTag,
  type StatusStyle,
} from "./model";
import { Avatar, Star, Tint } from "./parts";

/** Distance one arrow tap scrolls: two cards and their gaps. */
const STEP = 324;

interface Entry {
  id: string;
  name: string;
  status: StatusStyle;
  sales: number;
  ach: string;
  score: string;
  tag: RelationTag;
  aria: string;
  onOpen: () => void;
}

interface LeaderboardsProps {
  an: Analysis;
  onOpenSo: (id: string) => void;
  onOpenSdo: (id: string) => void;
}

/** Top 10 SDO teams and SOs for the view, ranked by target achievement. */
export function Leaderboards({ an, onOpenSo, onOpenSdo }: LeaderboardsProps) {
  const { view, range } = an;
  const sub = (scope: string) => `${range.label} · ranked by target achievement · ${scope}`;

  const soBoard = (list: Analysis["all"], scope: string) => ({
    key: "so",
    title: "Top 10 SOs",
    sub: sub(scope),
    entries: list
      .slice()
      .sort(byKey("ach"))
      .slice(0, 10)
      .map(
        (m, i): Entry => ({
          id: m.id,
          name: m.name,
          status: STATUS[m.status],
          sales: m.sales,
          ach: percent(m.ach),
          score: m.rating.toFixed(1),
          tag: an.relation(m.id),
          aria: `Rank ${i + 1}, ${m.name}, ${percent(m.ach)} of target`,
          onOpen: () => onOpenSo(m.id),
        }),
      ),
  });

  const sdoBoard = () => ({
    key: "sdo",
    title: "Top 10 SDOs",
    sub: sub("team size shown on each"),
    entries: an.sdos
      .slice()
      .sort(byKey("ach"))
      .slice(0, 10)
      .map(
        (d, i): Entry => ({
          id: d.id,
          name: d.name,
          status: d.status ? STATUS[d.status] : NO_STATUS,
          sales: d.sales,
          ach: d.n ? percent(d.ach) : "—",
          score: d.n ? d.rating.toFixed(1) : "—",
          tag: { label: `Team · ${plural(d.n, "SO")}`, bg: "#F7E9F4", ink: "#8E3479" },
          aria: `Rank ${i + 1}, ${d.name}`,
          onOpen: () => onOpenSdo(d.id),
        }),
      ),
  });

  const boards = [];
  if (view === "org") {
    if (an.sdos.length) boards.push(sdoBoard());
    if (an.all.length) boards.push(soBoard(an.all, "direct and SDO-managed SOs"));
  } else if (view === "direct" && an.direct.length) {
    boards.push(soBoard(an.direct, "direct SOs only"));
  } else if (view === "sdos" && an.sdos.length) {
    boards.push(sdoBoard());
  } else if (view === "indirect" && an.indirect.length) {
    boards.push(soBoard(an.indirect, "SOs under your SDOs"));
  } else if (view === "sdo" && an.sdo!.n) {
    boards.push(soBoard(an.sdo!.team, `${firstName(an.sdo!.name)}'s team only`));
  }

  return boards.map((b) => <Board key={b.key} title={b.title} sub={b.sub} entries={b.entries} />);
}

function Board({ title, sub, entries }: { title: string; sub: string; entries: Entry[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    strip.current?.scrollBy({ left: dir * STEP, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-[linear-gradient(160deg,#f9cb4f,#f0a81a)] text-[#3b2a00]">
          <LuTrophy size={21} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-[1.25]">
          <h2 className="text-[19px] font-extrabold">{title}</h2>
          <span className="text-pretty text-[13px] text-pewter">{sub}</span>
        </div>
        <div className="flex flex-none gap-1.5">
          {[
            { dir: -1, label: "Previous", Icon: LuChevronLeft },
            { dir: 1, label: "Next", Icon: LuChevronRight },
          ].map(({ dir, label, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => scroll(dir)}
              aria-label={label}
              className="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-[#e1ddd3] bg-white text-navy"
            >
              <Icon size={16} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      </div>
      <div ref={strip} className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto p-0.5">
        {entries.map((e, i) => {
          const rank = rankStyle(i);
          return (
            <button
              key={e.id}
              type="button"
              onClick={e.onOpen}
              aria-label={e.aria}
              className="relative flex flex-[0_0_152px] cursor-pointer snap-start flex-col items-center gap-0.75 rounded-[20px] border px-2.5 pb-3 pt-3.5 text-navy"
              style={{ background: rank.cardBg, borderColor: rank.cardBd }}
            >
              <span
                className="absolute left-2.5 top-2.5 flex size-6 items-center justify-center rounded-full text-[12px] font-extrabold"
                style={{ background: rank.badgeBg, color: rank.badgeInk }}
              >
                {i + 1}
              </span>
              <Avatar
                person={e}
                ring={{ gap: 3, width: 2.5, color: e.status.dot }}
                className="mt-1 size-14.5 text-[19px]"
              />
              <span className="mt-1.5 text-[14px] font-bold">{shortName(e.name)}</span>
              <span className="text-[18px] font-extrabold leading-[1.1]">{inrShort(e.sales)}</span>
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold">
                <span className="inline-flex items-center gap-0.5">
                  <Star size={13} />
                  {e.score}
                </span>
                <Tint bg={e.status.bg} ink={e.status.ink} className="px-1.75">
                  {e.ach}
                </Tint>
              </span>
              <Tint bg={e.tag.bg} ink={e.tag.ink} className="mt-0.75 px-2 py-px text-[11px]">
                {e.tag.label}
              </Tint>
            </button>
          );
        })}
      </div>
    </section>
  );
}
