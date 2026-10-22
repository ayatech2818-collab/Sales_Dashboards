import { Fragment } from "react";
import { LuArrowLeft, LuNetwork } from "react-icons/lu";
import type { SmScope } from "@/data/sm";
import { STATUS, type Filters, type SmAnalysis, type ViewKind } from "./model";

const PILL: Record<ViewKind, string> = {
  zone: "ZONE OVERVIEW",
  csdos: "CSDO REGIONS",
  csdo: "CSDO REGION",
  sdos: "SDO TEAMS",
  sdo: "SDO TEAM",
  direct: "DIRECT SOs",
  sos: "ALL SOs",
  so: "INDIVIDUAL SO",
};

interface ViewHeaderProps {
  scope: SmScope;
  an: SmAnalysis;
  filters: Filters;
  canGoBack: boolean;
  onBack: () => void;
  onZone: () => void;
  onOpenCsdo: (id: string) => void;
  onOpenSdo: (id: string) => void;
}

export function ViewHeader({
  scope,
  an,
  filters,
  canGoBack,
  onBack,
  onZone,
  onOpenCsdo,
  onOpenSdo,
}: ViewHeaderProps) {
  const { view, range, so, sdo, csdo } = an;

  const context =
    view === "so"
      ? range.label
      : `${an.totals.n} of ${scope.sos.length} SOs across ${scope.csdos.length} CSDO regions · ${range.label}${
          an.statusOn && filters.status !== "all" ? ` · ${STATUS[filters.status].label} only` : ""
        }`;

  // Breadcrumbs
  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: `SM: ${scope.sm.name} (${scope.sm.zone})`, onClick: view === "zone" ? undefined : onZone },
  ];

  if (view === "csdos") {
    crumbs.push({ label: "All CSDO Regions" });
  } else if (view === "sdos") {
    crumbs.push({ label: "All SDO Teams" });
  } else if (view === "direct") {
    crumbs.push({ label: "Direct SOs under CSDOs" });
  } else if (view === "sos") {
    crumbs.push({ label: "All Sales Organizers" });
  } else if (view === "csdo" && csdo) {
    crumbs.push({ label: `CSDO: ${csdo.name} (${csdo.region})` });
  } else if (view === "sdo" && sdo) {
    const parentCsdo = scope.csdos.find((c) => scope.sdoToCsdo[sdo.id] === c.id);
    if (parentCsdo) {
      crumbs.push({
        label: `CSDO: ${parentCsdo.name}`,
        onClick: () => onOpenCsdo(parentCsdo.id),
      });
    }
    crumbs.push({ label: `SDO: ${sdo.name} (${sdo.region})` });
  } else if (view === "so" && so) {
    const rel = scope.rel[so.id];
    if (rel) {
      const parentCsdo = scope.csdos.find((c) => c.id === rel.csdoId);
      if (parentCsdo) {
        crumbs.push({
          label: `CSDO: ${parentCsdo.name}`,
          onClick: () => onOpenCsdo(parentCsdo.id),
        });
      }
      if (rel.type === "sdo") {
        const parentSdo = scope.sdos.find((d) => d.id === rel.sdoId);
        if (parentSdo) {
          crumbs.push({
            label: `SDO: ${parentSdo.name}`,
            onClick: () => onOpenSdo(parentSdo.id),
          });
        }
        crumbs.push({ label: `SO: ${so.name}` });
      } else {
        crumbs.push({ label: `Direct SO: ${so.name}` });
      }
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
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-seam bg-white text-navy shadow-sm transition hover:bg-wash"
          >
            <LuArrowLeft size={17} strokeWidth={2.2} />
          </button>
        )}
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#0f172a] px-3 text-[11.5px] font-bold tracking-widest text-white">
          <LuNetwork size={13} className="text-sky-400" />
          {PILL[view]}
        </span>
        <span className="text-[14px] font-medium text-steel">{context}</span>
      </div>

      <nav aria-label="Executive Reporting Hierarchy" className="flex flex-wrap items-center gap-1.5 text-[14px]">
        {crumbs.map((c, i) => (
          <Fragment key={c.label}>
            {i > 0 && (
              <span aria-hidden="true" className="text-mist font-bold">
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
              <span
                aria-current={i === crumbs.length - 1 ? "page" : undefined}
                className="font-bold text-navy"
              >
                {c.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
