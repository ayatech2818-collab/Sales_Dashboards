import { Fragment } from "react";
import { LuChevronDown, LuRefreshCw } from "react-icons/lu";
import { TODAY, type Assignment, type Scope } from "@/data/csdo";
import {
  NO_STATUS,
  STATUS,
  firstName,
  longDate,
  plural,
  type Analysis,
  type SdoMetric,
  type SoMetric,
} from "./model";
import { Avatar, Eyebrow, IdPill, PANEL, Tint } from "./parts";

export interface ReassignDraft {
  soId: string;
  /** "CSDO:CSDO-203" or "SDO:SDO-118" */
  value: string;
}

interface SoProfileProps {
  scope: Scope;
  an: Analysis;
  so: SoMetric;
  draft: ReassignDraft | null;
  onStart: () => void;
  onDraft: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** One SO, their reporting line and, on request, a form to move them. */
export function SoProfile({ scope, an, so, draft, onStart, onDraft, onConfirm, onCancel }: SoProfileProps) {
  const S = STATUS[so.status];
  const relation = scope.rel[so.id];
  const current = relation.assignment;
  const parent = an.sdoOf(so.id);
  const previous = scope.history(so.id).find((a) => a !== current && a.to && a.to < TODAY);
  const direct = !parent;

  const supervisorOf = (a: Assignment) =>
    a.supType === "CSDO"
      ? a.supId === scope.csdo.id
        ? "you directly (CSDO)"
        : "another CSDO"
      : an.sdoById[a.supId]
        ? `SDO ${an.sdoById[a.supId].name}`
        : "another SDO";

  const chain = [
    { role: "CSDO", name: scope.csdo.name, bg: "#1D2334", ink: "#FFFFFF", bd: "#1D2334" },
    ...(parent ? [{ role: "SDO", name: parent.name, bg: "#F7E9F4", ink: "#8E3479", bd: "#EBD3E5" }] : []),
    direct
      ? { role: "DIRECT SO", name: so.name, bg: "#EEEDFC", ink: "#4B3FC7", bd: "#D9D7F6" }
      : { role: "SO", name: so.name, bg: "#FFFFFF", ink: "#1D2334", bd: "#E6E3DB" },
  ];
  const currentKey = `${current.supType}:${current.supId}`;

  return (
    <section className={`flex flex-col gap-3.5 rounded-[22px] p-4 ${PANEL}`}>
      <div className="flex items-center gap-3">
        <Avatar
          person={so}
          ring={{ gap: 3, width: 2.5, color: S.dot }}
          className="size-14 text-[19px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[20px] font-extrabold leading-[1.1]">{so.name}</h2>
            <IdPill id={so.id} />
          </div>
          <span className="text-[13.5px] text-steel">Sales Organizer · {so.loc}</span>
        </div>
        <Tint bg={S.bg} ink={S.ink} className="flex-none px-2.5 py-0.75 text-[12px]">
          {S.label}
        </Tint>
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl bg-wash px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>REPORTING LINE</Eyebrow>
          {!draft && (
            <button
              type="button"
              onClick={onStart}
              className="h-7.5 cursor-pointer rounded-full border border-edge bg-white px-3 text-[12.5px] font-bold text-navy"
            >
              Reassign
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {chain.map((n, i) => (
            <Fragment key={n.role}>
              {i > 0 && (
                <span aria-hidden="true" className="text-[15px] text-mist">
                  →
                </span>
              )}
              <span
                className="inline-flex flex-col rounded-xl border px-2.75 py-1.5 leading-[1.15]"
                style={{ background: n.bg, color: n.ink, borderColor: n.bd }}
              >
                <span className="text-[10.5px] font-bold tracking-[.08em]">{n.role}</span>
                <span className="text-[14px] font-bold">{n.name}</span>
              </span>
            </Fragment>
          ))}
        </div>
        <span className="text-pretty text-[13px] text-steel">
          Responsible supervisor:{" "}
          {parent
            ? `${parent.name} (SDO)`
            : `${scope.csdo.name} (CSDO) · direct assignment, not part of any SDO team`}{" "}
          · since {longDate(current.from)}
        </span>
        {previous?.to && (
          <span className="flex items-center gap-1.5 text-[13px] text-steel">
            <LuRefreshCw size={14} className="flex-none" />
            Reported to {supervisorOf(previous)} until {longDate(previous.to)}
          </span>
        )}

        {draft && (
          <div className="flex flex-col gap-2 border-t border-dashed border-edge pt-2.5">
            <span className="text-[13.5px] font-bold">Move {firstName(so.name)} to</span>
            <span className="relative block">
              <select
                value={draft.value}
                onChange={(e) => onDraft(e.target.value)}
                aria-label="New supervisor"
                className="h-11 w-full appearance-none rounded-[14px] border border-seam bg-white pl-3 pr-8.5 text-[14px] font-semibold text-navy"
              >
                {scope.supervisors.map((o) => {
                  const key = `${o.type}:${o.id}`;
                  return (
                    <option key={key} value={key}>
                      {o.label + (key === currentKey ? " (current)" : "")}
                    </option>
                  );
                })}
              </select>
              <LuChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-3.25 text-pewter"
              />
            </span>
            <span className="text-[12.5px] text-pewter">
              Effective today, {longDate(TODAY)}. Team and organization totals follow the new
              reporting line; the previous assignment is kept in history.
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="h-10 cursor-pointer rounded-full bg-navy px-4 text-[13.5px] font-bold text-white"
              >
                Confirm reassignment
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="h-10 cursor-pointer rounded-full border border-edge bg-white px-4 text-[13.5px] font-semibold text-navy"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** One SDO: their region, team size and who they report to. */
export function SdoProfile({ scope, sdo }: { scope: Scope; sdo: SdoMetric }) {
  const ring = sdo.status ? STATUS[sdo.status].dot : NO_STATUS.dot;
  return (
    <section className={`flex items-center gap-3 rounded-[22px] p-4 ${PANEL}`}>
      <Avatar person={sdo} ring={{ gap: 3, width: 2.5, color: ring }} className="size-14 text-[19px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[20px] font-extrabold leading-[1.1]">{sdo.name}</h2>
          <IdPill id={sdo.id} />
        </div>
        <span className="text-[13.5px] text-steel">Sales Development Officer · {sdo.region}</span>
        <div className="flex flex-wrap gap-1.5">
          <Tint bg="#F7E9F4" ink="#8E3479" className="px-2.25 py-px text-[12px]">
            {plural(sdo.n, "SO")}
          </Tint>
          <span className="rounded-full bg-pill px-2.25 py-px text-[12px] font-semibold text-graphite">
            Reports to CSDO: {scope.csdo.name}
          </span>
        </div>
      </div>
    </section>
  );
}
