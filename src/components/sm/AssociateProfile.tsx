import { Fragment } from "react";
import { LuChevronDown, LuMapPin, LuRefreshCw } from "react-icons/lu";
import { TODAY, type SmScope } from "@/data/sm";
import {
  NO_STATUS,
  STATUS,
  firstName,
  longDate,
  plural,
  type CsdoMetric,
  type SdoMetric,
  type SmAnalysis,
  type SoMetric,
} from "./model";
import { Avatar, Eyebrow, IdPill, PANEL, Tint } from "./parts";

export interface ReassignDraft {
  soId: string;
  value: string; // "CSDO:CSDO-201" or "SDO:SDO-114"
}

interface SoProfileProps {
  scope: SmScope;
  an: SmAnalysis;
  so: SoMetric;
  draft: ReassignDraft | null;
  onStart: () => void;
  onDraft: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SoProfile({
  scope,
  an,
  so,
  draft,
  onStart,
  onDraft,
  onConfirm,
  onCancel,
}: SoProfileProps) {
  const S = STATUS[so.status];
  const relation = scope.rel[so.id];
  const current = relation?.assignment;
  const history = scope.history(so.id);
  const previous = history.find((a) => a !== current && a.to && a.to < TODAY);
  const chain = an.chain(so.id);
  const currentKey = current ? `${current.supType}:${current.supId}` : "";

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
            <h2 className="text-[20px] font-extrabold leading-[1.1] text-navy">{so.name}</h2>
            <IdPill id={so.id} />
          </div>
          <span className="text-[13.5px] text-steel">Sales Organizer · {so.loc}</span>
        </div>
        <Tint bg={S.bg} ink={S.ink} className="flex-none px-2.5 py-0.75 text-[12px]">
          {S.label}
        </Tint>
      </div>

      {/* 4-Tier Reporting Line Chain */}
      <div className="flex flex-col gap-2.5 rounded-2xl bg-wash px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>ENTERPRISE REPORTING LINE</Eyebrow>
          {!draft && (
            <button
              type="button"
              onClick={onStart}
              className="h-7.5 cursor-pointer rounded-full border border-edge bg-white px-3 text-[12.5px] font-bold text-navy transition hover:bg-navy hover:text-white"
            >
              Executive Reassign
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {chain.map((n, i) => (
            <Fragment key={n.role + n.id}>
              {i > 0 && (
                <span aria-hidden="true" className="text-[15px] font-bold text-mist">
                  →
                </span>
              )}
              <span
                className="inline-flex flex-col rounded-xl border px-2.75 py-1.5 leading-[1.15]"
                style={{ background: n.bg, color: n.ink, borderColor: n.bd }}
              >
                <span className="text-[10px] font-bold tracking-[.08em]">{n.role}</span>
                <span className="text-[14px] font-bold">{n.name}</span>
              </span>
            </Fragment>
          ))}
        </div>

        {current && (
          <span className="text-pretty text-[13px] text-steel">
            Active assignment: {current.supType === "CSDO" ? "Direct CSDO Assignment" : "SDO Field Team"}{" "}
            · since {longDate(current.from)}
          </span>
        )}

        {previous?.to && (
          <span className="flex items-center gap-1.5 text-[13px] text-steel">
            <LuRefreshCw size={14} className="flex-none" />
            Previous assignment ended on {longDate(previous.to)}
          </span>
        )}

        {/* Reassignment Form */}
        {draft && (
          <div className="flex flex-col gap-2 border-t border-dashed border-edge pt-2.5">
            <span className="text-[13.5px] font-bold text-navy">
              Reassign {firstName(so.name)} to a supervisor in {scope.sm.name}&rsquo;s zone:
            </span>
            <span className="relative block">
              <select
                value={draft.value}
                onChange={(e) => onDraft(e.target.value)}
                aria-label="New supervisor"
                className="h-11 w-full appearance-none rounded-[14px] border border-seam bg-white pl-3 pr-8.5 text-[14px] font-semibold text-navy outline-none"
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
              Effective today ({longDate(TODAY)}). State and regional totals will follow the new
              supervisory hierarchy; previous assignment is preserved in the audit trail.
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onConfirm}
                className="h-10 cursor-pointer rounded-full bg-navy px-4.5 text-[13.5px] font-bold text-white transition hover:bg-[#151a27]"
              >
                Confirm Reassignment
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="h-10 cursor-pointer rounded-full border border-edge bg-white px-4 text-[13.5px] font-semibold text-navy transition hover:bg-wash"
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

export function SdoProfile({
  scope,
  sdo,
}: {
  scope: SmScope;
  sdo: SdoMetric;
}) {
  const S = sdo.status ? STATUS[sdo.status] : NO_STATUS;
  const parentCsdo = scope.csdos.find((c) => scope.sdoToCsdo[sdo.id] === c.id);

  return (
    <section className={`flex items-center gap-3.5 rounded-[22px] p-4 ${PANEL}`}>
      <Avatar
        person={sdo}
        ring={{ gap: 3, width: 2.5, color: S.dot }}
        className="size-14 text-[19px]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[20px] font-extrabold leading-[1.1] text-navy">{sdo.name}</h2>
          <IdPill id={sdo.id} />
        </div>
        <span className="text-[13.5px] text-steel">
          Sales Development Officer · {sdo.region}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Tint bg="#F7E9F4" ink="#8E3479" className="px-2.5 py-0.5 text-[12px]">
            {plural(sdo.n, "SO in team")}
          </Tint>
          {parentCsdo && (
            <span className="rounded-full bg-pill px-2.5 py-0.5 text-[12px] font-semibold text-graphite">
              Reports to CSDO: {parentCsdo.name} ({parentCsdo.region})
            </span>
          )}
          <span className="text-[12px] font-bold text-plum">
            {sdo.visits} of {sdo.visitsDue} coaching visits
          </span>
        </div>
      </div>
    </section>
  );
}

export function CsdoProfile({
  scope,
  csdo,
}: {
  scope: SmScope;
  csdo: CsdoMetric;
}) {
  const S = csdo.status ? STATUS[csdo.status] : STATUS.on;

  return (
    <section className={`flex flex-col gap-3 rounded-[22px] p-4 ${PANEL}`}>
      <div className="flex items-center gap-3.5">
        <Avatar
          person={csdo}
          ring={{ gap: 3, width: 2.5, color: S.dot }}
          className="size-15 text-[20px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[21px] font-extrabold leading-[1.1] text-navy">{csdo.name}</h2>
            <IdPill id={csdo.id} />
          </div>
          <span className="flex items-center gap-1 text-[14px] text-steel">
            <LuMapPin size={14} className="text-[#0284c7]" />
            Chief Sales Development Officer · {csdo.region}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="rounded-full bg-navy px-2.5 py-0.5 text-[12px] font-bold text-white">
              Reports to Sales Manager: {scope.sm.name}
            </span>
            <Tint bg={S.bg} ink={S.ink} className="px-2.5 py-0.5 text-[12px]">
              {S.label}
            </Tint>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 border-t border-[#f1f5f9] pt-3 text-[13px]">
        <div className="flex flex-col rounded-xl bg-wash p-2.5">
          <span className="text-[11px] font-semibold text-fog">REGIONAL SOs</span>
          <span className="text-[18px] font-extrabold text-navy">{csdo.n}</span>
          <span className="text-[11.5px] text-pewter">
            {csdo.directSos.length} direct + {csdo.n - csdo.directSos.length} via SDOs
          </span>
        </div>

        <div className="flex flex-col rounded-xl bg-wash p-2.5">
          <span className="text-[11px] font-semibold text-fog">SDO FIELD TEAMS</span>
          <span className="text-[18px] font-extrabold text-navy">{csdo.sdos.length}</span>
          <span className="text-[11.5px] text-pewter">Active team leaders</span>
        </div>

        <div className="flex flex-col rounded-xl bg-wash p-2.5">
          <span className="text-[11px] font-semibold text-fog">COACHING VISITS</span>
          <span className="text-[18px] font-extrabold text-plum">{csdo.visits}</span>
          <span className="text-[11.5px] text-pewter">of {csdo.visitsDue} due</span>
        </div>
      </div>
    </section>
  );
}
