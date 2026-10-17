import { Fragment } from "react";
import { LuArrowLeft, LuNetwork } from "react-icons/lu";
import type { Scope } from "@/data/csdo";
import { STATUS, type Analysis, type Filters, type ViewKind } from "./model";

const PILL: Record<ViewKind, string> = {
  org: "ORGANIZATION VIEW",
  direct: "DIRECT SOs",
  sdos: "SDO TEAMS",
  indirect: "SOs UNDER SDOs",
  sdo: "TEAM VIEW",
  so: "INDIVIDUAL VIEW",
};

interface ViewHeaderProps {
  scope: Scope;
  an: Analysis;
  filters: Filters;
  /** Show the back button; there is somewhere to go back to. */
  canGoBack: boolean;
  onBack: () => void;
  onOrg: () => void;
  onOpenSdo: (id: string) => void;
}

/** What the content below covers, and the reporting line down to it. */
export function ViewHeader({ scope, an, filters, canGoBack, onBack, onOrg, onOpenSdo }: ViewHeaderProps) {
  const { view, range, so, sdo } = an;
  const context =
    view === "so"
      ? range.label
      : `${an.totals.n} of ${scope.sos.length} SOs · ${range.label}${
          an.statusOn && filters.status !== "all" ? ` · ${STATUS[filters.status].label} only` : ""
        }`;

  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: `CSDO: ${scope.csdo.name}`, onClick: view === "org" ? undefined : onOrg },
  ];
  if (view === "direct") crumbs.push({ label: "Direct SOs" });
  if (view === "sdos") crumbs.push({ label: "SDOs" });
  if (view === "indirect") crumbs.push({ label: "SOs under SDOs" });
  if (view === "sdo") crumbs.push({ label: `SDO: ${sdo!.name}` });
  if (view === "so") {
    const parent = an.sdoOf(so!.id);
    if (parent) {
      crumbs.push({ label: `SDO: ${parent.name}`, onClick: () => onOpenSdo(parent.id) });
      crumbs.push({ label: `SO: ${so!.name}` });
    } else {
      crumbs.push({ label: `Direct SO: ${so!.name}` });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-seam bg-white text-navy"
          >
            <LuArrowLeft size={17} strokeWidth={2.2} />
          </button>
        )}
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-navy px-3 text-[11.5px] font-bold tracking-[.1em] text-white">
          <LuNetwork size={13} />
          {PILL[view]}
        </span>
        <span className="text-[14px] font-medium text-steel">{context}</span>
      </div>
      <nav aria-label="Reporting line" className="flex flex-wrap items-center gap-1.5 text-[14px]">
        {crumbs.map((c, i) => (
          <Fragment key={c.label}>
            {i > 0 && (
              <span aria-hidden="true" className="text-mist">
                →
              </span>
            )}
            {c.onClick ? (
              <button
                type="button"
                onClick={c.onClick}
                className="cursor-pointer font-semibold text-iris underline underline-offset-3 hover:text-[#2f2699]"
              >
                {c.label}
              </button>
            ) : (
              <span aria-current={i === crumbs.length - 1 ? "page" : undefined} className="font-bold text-navy">
                {c.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
