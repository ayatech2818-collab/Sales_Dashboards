"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ForbiddenError,
  smApi,
  type SdoAssignment,
  type SmAssignment,
  type SmSupervisorType,
} from "@/data/sm";
import { prefersReducedMotion } from "@/lib/utils";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { CsdoProfile, SdoProfile, SoProfile, type ReassignDraft } from "./AssociateProfile";
import { AssociateSections } from "./AssociateSections";
import { CsdoComparisonMatrix } from "./CsdoComparisonMatrix";
import { LoadingState, ProblemNotice, type Problem } from "./DataStates";
import { Insights } from "./Insights";
import { KpiGrid } from "./KpiGrid";
import { Leaderboards } from "./Leaderboards";
import {
  DEFAULT_FILTERS,
  SCENARIOS,
  analyzeSm,
  buildSmInsights,
  plural,
  type Filters,
  type Layout,
  type Place,
  type ScenarioKey,
  type SortKey,
  type TypeFilter,
} from "./model";
import { PeopleFilters } from "./PeopleFilters";
import { RecentEnrolments } from "./RecentEnrolments";
import { SalesTrend } from "./SalesTrend";
import { RoleSwitcher } from "@/components/common/RoleSwitcher";
import { SmProfileCard } from "./SmProfileCard";
import { StatusBreakdown } from "./StatusBreakdown";
import { TargetHero } from "./TargetHero";
import { ViewHeader } from "./ViewHeader";

const LOAD_MS = 400;
const TOAST_MS = 3800;
const NAV_DEPTH = 30;

interface DashState {
  scenario: ScenarioKey;
  soAssignments: SmAssignment[];
  sdoAssignments: SdoAssignment[];
  filters: Filters;
  nav: Place[];
  layout: Layout;
  sorts: Partial<Record<string, SortKey>>;
  expanded: Partial<Record<string, boolean>>;
  reassign: ReassignDraft | null;
  forbidden: string | null;
}

const placeOf = ({ type, csdoId, sdoId, soId }: Filters): Place => ({
  type,
  csdoId,
  sdoId,
  soId,
});

interface SmDashboardProps {
  scenario?: ScenarioKey;
  simulateError?: boolean;
  defaultLayout?: Layout;
  autoplay?: boolean;
}

/**
 * Sales Manager (SM) Executive Dashboard:
 * Supervises CSDOs and their respective SDO teams and direct SOs across a zone/state.
 * Supports complete 4-tier drill-down (Zone -> CSDO -> SDO -> SO), state-wide KPIs,
 * regional comparison matrix, coaching compliance, and executive reassignment.
 */
export function SmDashboard({
  scenario = "A",
  simulateError = false,
  defaultLayout = "grouped",
  autoplay = true,
}: SmDashboardProps) {
  const [state, setState] = useState<DashState>(() => ({
    scenario,
    soAssignments: smApi.getAssignments(),
    sdoAssignments: smApi.getSdoAssignments(),
    filters: DEFAULT_FILTERS,
    nav: [],
    layout: defaultLayout,
    sorts: {},
    expanded: {},
    reassign: null,
    forbidden: null,
  }));

  const [loads, setLoads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failing, setFailing] = useState(simulateError);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(timer);
  }, [loads]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const scope = useMemo(
    () =>
      smApi.buildScope(
        SCENARIOS[state.scenario].smId,
        state.soAssignments,
        state.sdoAssignments
      ),
    [state.scenario, state.soAssignments, state.sdoAssignments]
  );

  const an = useMemo(() => analyzeSm(scope, state.filters), [scope, state.filters]);
  const insights = useMemo(() => buildSmInsights(an, scope.sm.name), [an, scope.sm.name]);
  const { filters: f } = state;

  const set = (patch: Partial<DashState> | ((s: DashState) => Partial<DashState>)) =>
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));

  const load = () => {
    setLoading(true);
    setLoads((n) => n + 1);
  };

  const toTop = () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  const go = (patch: Partial<Place>) => {
    set((s) => ({
      nav: [...s.nav, placeOf(s.filters)].slice(-NAV_DEPTH),
      filters: { ...s.filters, ...patch },
      reassign: null,
      forbidden: null,
    }));
    toTop();
  };

  const back = () =>
    set((s) =>
      s.nav.length
        ? {
            nav: s.nav.slice(0, -1),
            filters: { ...s.filters, ...s.nav[s.nav.length - 1] },
            reassign: null,
            forbidden: null,
          }
        : {}
    );

  const guarded = <T,>(read: () => T): T | undefined => {
    try {
      return read();
    } catch (e) {
      if (!(e instanceof ForbiddenError)) throw e;
      set({ forbidden: e.id, reassign: null });
      return undefined;
    }
  };

  const openSo = (id: string) => {
    const rel = guarded(() => {
      scope.getSO(id);
      return scope.rel[id];
    });
    if (!rel) return;

    if (rel.type === "csdo-direct") {
      go({ soId: id, sdoId: "", csdoId: rel.csdoId });
    } else {
      go({ soId: id, sdoId: rel.sdoId, csdoId: rel.csdoId });
    }
  };

  const openSdo = (id: string) => {
    const sdo = guarded(() => scope.getSdo(id));
    if (!sdo) return;
    const parentCsdoId = scope.sdoToCsdo[id] || "";
    go({ sdoId: id, soId: "", csdoId: parentCsdoId });
  };

  const openCsdo = (id: string) => {
    const csdo = guarded(() => scope.getCsdo(id));
    if (!csdo) return;
    go({ csdoId: id, sdoId: "", soId: "" });
  };

  const toZone = () => go({ type: "all", csdoId: "", sdoId: "", soId: "" });

  const setType = (type: TypeFilter) => {
    go({ type, csdoId: "", sdoId: "", soId: "" });
  };

  const setFilters = (patch: Partial<Filters>) =>
    set((s) => ({ filters: { ...s.filters, ...patch } }));

  const clearFilters = () => {
    set((s) => ({
      filters: { ...DEFAULT_FILTERS, from: s.filters.from, to: s.filters.to },
      nav: [...s.nav, placeOf(s.filters)].slice(-NAV_DEPTH),
      forbidden: null,
      reassign: null,
    }));
    load();
  };


  const confirmReassign = () => {
    const draft = state.reassign;
    if (!draft) return;
    const [type, id] = draft.value.split(":") as [SmSupervisorType, string];

    const next = guarded(() =>
      smApi.reassignSo(state.soAssignments, scope.sm.id, draft.soId, { type, id })
    );

    if (next === undefined) return;
    if (next === null) {
      set({ reassign: null });
      return;
    }

    const soName = scope.getSO(draft.soId).name;
    const supName =
      type === "CSDO"
        ? `CSDO ${scope.getCsdo(id)?.name}`
        : `SDO ${scope.getSdo(id)?.name}`;

    set((s) => ({
      soAssignments: next,
      reassign: null,
      filters: {
        ...s.filters,
        sdoId: type === "SDO" ? id : "",
        csdoId: type === "CSDO" ? id : scope.sdoToCsdo[id] || s.filters.csdoId,
      },
    }));

    setToast(`${soName} successfully reassigned to ${supName}. State aggregates updated.`);
  };

  const problem: Problem | null = state.forbidden
    ? { kind: "forbidden", id: state.forbidden }
    : failing
      ? { kind: "network" }
      : null;

  const activeCount = [
    f.type !== "all",
    !!an.csdo,
    !!an.sdo,
    !!an.so,
    f.status !== "all",
    !!f.q.trim(),
    f.period !== "month",
  ].filter(Boolean).length;

  const place = `${an.view}:${an.csdo?.id ?? ""}:${an.sdo?.id ?? ""}:${an.so?.id ?? ""}`;

  return (
    <div className="min-h-dvh bg-backdrop font-display leading-[normal] text-navy">
      <main className="mx-auto flex min-h-dvh max-w-140 flex-col gap-3.5 bg-linen px-3.5 pb-12 pt-4 md:max-w-6xl md:px-6">
        {/* Top Executive Header */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-3.5">
          <SmProfileCard scope={scope} view={an.view} onType={setType} />
          <div className="flex flex-col gap-3.5">
            <PromoCarousel slides={smApi.getSlides()} autoSlide={autoplay} />
            <RoleSwitcher />
          </div>
        </div>

        {/* View Header with Breadcrumbs */}
        <ViewHeader
          scope={scope}
          an={an}
          filters={f}
          canGoBack={state.nav.length > 0}
          onBack={back}
          onZone={toZone}
          onOpenCsdo={openCsdo}
          onOpenSdo={openSdo}
        />

        {/* Main Content Area */}
        {loading ? (
          <LoadingState />
        ) : problem ? (
          <ProblemNotice
            problem={problem}
            onAction={() => {
              if (problem.kind === "forbidden") {
                set({ forbidden: null });
              } else {
                setFailing(false);
                load();
              }
            }}
          />
        ) : (
          <div className="flex flex-col gap-3.5">
            {/* Contextual Profile Cards */}
            {an.so && (
              <SoProfile
                scope={scope}
                an={an}
                so={an.so}
                draft={state.reassign}
                onStart={() => {
                  const a = scope.rel[an.so!.id]?.assignment;
                  if (a) {
                    set({ reassign: { soId: an.so!.id, value: `${a.supType}:${a.supId}` } });
                  }
                }}
                onDraft={(value) =>
                  set((s) => ({ reassign: s.reassign && { ...s.reassign, value } }))
                }
                onConfirm={confirmReassign}
                onCancel={() => set({ reassign: null })}
              />
            )}

            {an.view === "sdo" && an.sdo && <SdoProfile scope={scope} sdo={an.sdo} />}

            {an.view === "csdo" && an.csdo && <CsdoProfile scope={scope} csdo={an.csdo} />}

            {/* Target Hero & Macro KPI Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-3.5">
              <TargetHero an={an} period={f.period} />
              <KpiGrid scope={scope} an={an} />
            </div>

            {/* Strategic Intelligence Insights */}
            <Insights key={place} items={insights} />

            {/* Side-by-side CSDO Regional Comparison (Shown on Zone or CSDOs views) */}
            {(an.view === "zone" || an.view === "csdos") && an.csdos.length > 0 && (
              <CsdoComparisonMatrix an={an} onOpenCsdo={openCsdo} />
            )}

            {/* Performance Health & Trajectory */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-3.5">
              {!an.so && (
                <StatusBreakdown
                  an={an}
                  status={f.status}
                  onStatus={(status) => setFilters({ status })}
                  onOpenSo={openSo}
                />
              )}
              {an.range.to > an.range.from && an.totals.n > 0 && <SalesTrend an={an} />}
              {an.so && <RecentEnrolments so={an.so} range={an.range} />}
            </div>

            {/* Workforce & Scope Filters */}
            <PeopleFilters
              scope={scope}
              an={an}
              filters={f}
              activeCount={activeCount}
              onQuery={(q) => setFilters({ q })}
              onOpenCsdo={openCsdo}
              onOpenSdo={openSdo}
              onOpenSo={openSo}
              onType={setType}
              onAllCsdos={() => go({ csdoId: "", sdoId: "", soId: "" })}
              onAllSdos={() => go({ sdoId: "", soId: "" })}
              onAllSos={() => go({ soId: "" })}
              onPeriod={(period) => {
                setFilters({ period });
                load();
              }}
              onDates={(patch) => {
                setFilters(patch);
                load();
              }}
              onStatus={(status) => setFilters({ status })}
              onClear={clearFilters}
            />

            {/* Associate Directory & Roaster */}
            <AssociateSections
              an={an}
              filters={f}
              layout={state.layout}
              onLayout={(layout) => set({ layout })}
              sorts={state.sorts}
              onSort={(key, sort) => set((s) => ({ sorts: { ...s.sorts, [key]: sort } }))}
              expanded={state.expanded}
              onExpand={(key) =>
                set((s) => ({ expanded: { ...s.expanded, [key]: !s.expanded[key] } }))
              }
              onOpenCsdo={openCsdo}
              onOpenSdo={openSdo}
              onOpenSo={openSo}
              onClear={clearFilters}
            />

            {/* State Leaderboards */}
            <Leaderboards
              an={an}
              onOpenCsdo={openCsdo}
              onOpenSdo={openSdo}
              onOpenSo={openSo}
            />

            {/* Executive Compliance & Security Footnote */}
            <p className="text-pretty px-2 text-center text-[12px] leading-normal text-fog">
              Showing authorized state operations for {scope.sm.name} ({scope.sm.id}) covering{" "}
              {plural(scope.csdos.length, "CSDO region")}, {plural(scope.sdos.length, "SDO team")}, and{" "}
              {plural(scope.sos.length, "unique SO")}. Multi-level authorization enforced. Each transaction
              is deduplicated across feeds ({smApi.duplicatesIgnored} duplicate feed records dropped).
            </p>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 w-max max-w-[min(520px,calc(100vw-32px))] -translate-x-1/2 animate-toast-in rounded-2xl bg-[#0f172a] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,.35)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
