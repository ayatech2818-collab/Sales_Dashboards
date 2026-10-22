import { useRef } from "react";
import { LuChevronLeft, LuChevronRight, LuTrophy } from "react-icons/lu";
import { inrShort, percent, shortName } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/utils";
import {
  NO_STATUS,
  STATUS,
  byKey,
  plural,
  rankStyle,
  type RelationTag,
  type SmAnalysis,
  type StatusStyle,
} from "./model";
import { Avatar, Star, Tint } from "./parts";

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
  an: SmAnalysis;
  onOpenCsdo: (id: string) => void;
  onOpenSdo: (id: string) => void;
  onOpenSo: (id: string) => void;
}

export function Leaderboards({
  an,
  onOpenCsdo,
  onOpenSdo,
  onOpenSo,
}: LeaderboardsProps) {
  const { view, range } = an;
  const sub = (scope: string) => `${range.label} · ranked by target achievement · ${scope}`;

  // 1. Top CSDO Regions Board
  const csdoBoard = () => ({
    key: "csdos",
    title: "Top CSDO Regions",
    sub: sub("all regional divisions under this Sales Manager"),
    entries: an.csdos
      .slice()
      .sort(byKey("ach"))
      .map(
        (c, i): Entry => ({
          id: c.id,
          name: c.name,
          status: c.status ? STATUS[c.status] : STATUS.on,
          sales: c.sales,
          ach: c.n ? percent(c.ach) : "—",
          score: c.n ? c.rating.toFixed(1) : "—",
          tag: { label: c.region, bg: "#F0FDF4", ink: "#15803D" },
          aria: `Rank ${i + 1}, CSDO ${c.name}, ${c.region}`,
          onOpen: () => onOpenCsdo(c.id),
        })
      ),
  });

  // 2. Top SDO Teams Board
  const sdoBoard = () => ({
    key: "sdos",
    title: "Top SDO Teams",
    sub: sub("field team leaders across all divisions"),
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
          aria: `Rank ${i + 1}, SDO ${d.name}`,
          onOpen: () => onOpenSdo(d.id),
        })
      ),
  });

  // 3. Top 10 Frontline SOs Board
  const soBoard = () => ({
    key: "sos",
    title: "Top 10 Sales Organizers",
    sub: sub("all frontline producers across the state"),
    entries: an.allSos
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
          aria: `Rank ${i + 1}, SO ${m.name}`,
          onOpen: () => onOpenSo(m.id),
        })
      ),
  });

  const boards = [];
  if (view === "zone" || view === "csdos") {
    if (an.csdos.length > 1) boards.push(csdoBoard());
    if (an.sdos.length) boards.push(sdoBoard());
    if (an.allSos.length) boards.push(soBoard());
  } else if (view === "csdo") {
    if (an.csdo?.sdos.length) boards.push(sdoBoard());
    if (an.csdo?.allSos.length) boards.push(soBoard());
  } else if (view === "sdos" || view === "sdo") {
    boards.push(sdoBoard());
    if (an.allSos.length) boards.push(soBoard());
  } else {
    boards.push(soBoard());
  }

  return (
    <div className="flex flex-col gap-4">
      {boards.map((b) => (
        <Board key={b.key} title={b.title} sub={b.sub} entries={b.entries} />
      ))}
    </div>
  );
}

function Board({ title, sub, entries }: { title: string; sub: string; entries: Entry[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    strip.current?.scrollBy({
      left: dir * STEP,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-[linear-gradient(160deg,#f9cb4f,#f0a81a)] text-[#3b2a00] shadow-sm">
          <LuTrophy size={21} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <h2 className="text-[19px] font-extrabold text-navy">{title}</h2>
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
              className="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-[#e1ddd3] bg-white text-navy transition hover:bg-wash"
            >
              <Icon size={16} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={strip}
        className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto p-0.5"
      >
        {entries.map((e, i) => {
          const rank = rankStyle(i);
          return (
            <button
              key={e.id}
              type="button"
              onClick={e.onOpen}
              aria-label={e.aria}
              className="relative flex flex-[0_0_155px] cursor-pointer snap-start flex-col items-center gap-0.75 rounded-[20px] border px-2.5 pb-3 pt-3.5 text-navy transition hover:scale-[1.02]"
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
              <span className="mt-1.5 text-[14px] font-bold truncate max-w-full text-navy">
                {shortName(e.name)}
              </span>
              <span className="text-[18px] font-extrabold leading-[1.1] text-navy">
                {inrShort(e.sales)}
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold">
                <span className="inline-flex items-center gap-0.5 text-navy">
                  <Star size={13} />
                  {e.score}
                </span>
                <Tint bg={e.status.bg} ink={e.status.ink} className="px-1.75">
                  {e.ach}
                </Tint>
              </span>
              <Tint bg={e.tag.bg} ink={e.tag.ink} className="mt-0.75 px-2 py-px text-[11px] truncate max-w-full">
                {e.tag.label}
              </Tint>
            </button>
          );
        })}
      </div>
    </section>
  );
}
