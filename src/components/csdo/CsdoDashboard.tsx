"use client";

import { useEffect, useMemo, useState } from "react";
import { ForbiddenError, csdoApi, type Assignment, type SupervisorType } from "@/data/csdo";
import { prefersReducedMotion } from "@/lib/utils";
import { SdoProfile, SoProfile, type ReassignDraft } from "./AssociateProfile";
import { AssociateSections } from "./AssociateSections";
import { CsdoProfileCard } from "./CsdoProfileCard";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { LoadingState, ProblemNotice, type Problem } from "./DataStates";
import { Insights } from "./Insights";
import { KpiGrid } from "./KpiGrid";
import { Leaderboards } from "./Leaderboards";
import {
  DEFAULT_FILTERS,
  SCENARIOS,
  analyze,
  buildInsights,
  plural,
  type AssignFilter,
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
import { ScenarioSwitcher } from "./ScenarioSwitcher";
import { StatusBreakdown } from "./StatusBreakdown";
import { TargetHero } from "./TargetHero";
import { ViewHeader } from "./ViewHeader";

/** How long the simulated fetch takes after a scenario, period or filter reset. */
const LOAD_MS = 420;
const TOAST_MS = 3800;
/** Back-navigation history kept. */
const NAV_DEPTH = 30;

interface DashState {
  scenario: ScenarioKey;
  /** Reporting lines, edited in place by reassignment. */
  assignments: Assignment[];
  filters: Filters;
  /** Places visited, newest last, for the back button. */
  nav: Place[];
  layout: Layout;
  sorts: Partial<Record<string, SortKey>>;
  expanded: Partial<Record<string, boolean>>;
  teamSdo: string;
  assign: AssignFilter;
  reassign: ReassignDraft | null;
  /** An out-of-scope id the viewer tried to open. */
  forbidden: string | null;
}

const placeOf = ({ type, sdoId, soId }: Filters): Place => ({ type, sdoId, soId });

interface CsdoDashboardProps {
  scenario?: ScenarioKey;
  /** Make the first load fail, to show the error state; Retry then succeeds. */
  simulateError?: boolean;
  defaultLayout?: Layout;
  /** Let the announcement slides advance on their own. */
  autoplay?: boolean;
}

/**
 * Chief SDO view of everyone in their reporting scope: SOs assigned directly,
 * and SDOs with their teams. Drills from the organization down to one SDO's
 * team or one SO, with every read going through the viewer's scope.
 */
export function CsdoDashboard({
  scenario = "C",
  simulateError = false,
  defaultLayout = "grouped",
  autoplay = true,
}: CsdoDashboardProps) {
  const [state, setState] = useState<DashState>(() => ({
    scenario,
    assignments: csdoApi.getAssignments(),
    filters: DEFAULT_FILTERS,
    nav: [],
    layout: defaultLayout,
    sorts: {},
    expanded: {},
    teamSdo: "",
    assign: "all",
    reassign: null,
    forbidden: null,
  }));
  const [loads, setLoads] = useState(0);
  const [loading, setLoading] = useState(true);
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
    () => csdoApi.buildScope(SCENARIOS[state.scenario].csdoId, state.assignments),
    [state.scenario, state.assignments],
  );
  const an = useMemo(() => analyze(scope, state.filters), [scope, state.filters]);
  const insights = useMemo(() => buildInsights(an, scope.csdo.name), [an, scope.csdo.name]);
  const { filters: f } = state;

  const set = (patch: Partial<DashState> | ((s: DashState) => Partial<DashState>)) =>
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  const load = () => {
    setLoading(true);
    setLoads((n) => n + 1);
  };
  const toTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  /** Move to another place in the org, remembering where we were. */
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
        : {},
    );

  /** Run a scoped read; an out-of-scope id shows Access denied instead. */
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
    const t = f.type;
    if (rel.type === "direct") go({ soId: id, sdoId: "", type: t === "direct" || t === "all" ? t : "all" });
    else go({ soId: id, sdoId: rel.sdoId, type: t === "direct" ? "all" : t });
  };
  const openSdo = (id: string) => go({ sdoId: id, soId: "", type: f.type === "direct" ? "all" : f.type });
  const toOrg = () => go({ type: "all", sdoId: "", soId: "" });
  const setType = (type: TypeFilter) => {
    set({ teamSdo: "" });
    go({ type, sdoId: "", soId: "" });
  };
  const setFilters = (patch: Partial<Filters>) => set((s) => ({ filters: { ...s.filters, ...patch } }));

  const clearFilters = () => {
    set((s) => ({
      filters: { ...DEFAULT_FILTERS, from: s.filters.from, to: s.filters.to },
      nav: [...s.nav, placeOf(s.filters)].slice(-NAV_DEPTH),
      teamSdo: "",
      assign: "all",
      forbidden: null,
      reassign: null,
    }));
    load();
  };

  const setScenario = (key: ScenarioKey) => {
    set((s) => ({
      scenario: key,
      filters: { ...DEFAULT_FILTERS, period: s.filters.period, from: s.filters.from, to: s.filters.to },
      nav: [],
      expanded: {},
      teamSdo: "",
      assign: "all",
      forbidden: null,
      reassign: null,
    }));
    load();
  };

  const testAccess = () => {
    guarded(() => scope.getSO(SCENARIOS[state.scenario].probe));
    toTop();
  };

  const confirmReassign = () => {
    const draft = state.reassign;
    if (!draft) return;
    const [type, id] = draft.value.split(":") as [SupervisorType, string];
    const next = guarded(() => csdoApi.reassign(state.assignments, scope.csdo.id, draft.soId, { type, id }));
    if (next === undefined) return;
    if (next === null) {
      set({ reassign: null });
      return;
    }
    const name = scope.getSO(draft.soId).name;
    const sdo = scope.sdos.find((d) => d.id === id);
    set((s) => ({
      assignments: next,
      reassign: null,
      filters: {
        ...s.filters,
        sdoId: type === "SDO" ? id : "",
        type: type === "SDO" && s.filters.type === "direct" ? "all" : s.filters.type,
      },
    }));
    setToast(
      `${name} now reports ${type === "CSDO" ? "directly to you" : `to SDO ${sdo?.name}`}. Totals updated.`,
    );
  };

  const problem: Problem | null = state.forbidden
    ? { kind: "forbidden", id: state.forbidden }
    : failing
      ? { kind: "network" }
      : null;
  const activeCount = [
    f.type !== "all",
    !!an.sdo,
    !!an.so,
    f.status !== "all",
    !!f.q.trim(),
    f.period !== "month",
  ].filter(Boolean).length;
  const place = `${an.view}:${an.sdo?.id ?? ""}:${an.so?.id ?? ""}`;

  return (
    <div className="min-h-dvh bg-backdrop font-display leading-[normal] text-navy">
      <main className="mx-auto flex min-h-dvh max-w-140 flex-col gap-3.5 bg-linen px-3.5 pb-12 pt-4 md:max-w-6xl md:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-3.5">
          <div className="flex flex-col gap-3.5">
            <CsdoProfileCard scope={scope} view={an.view} onType={setType} />
            <PromoCarousel slides={csdoApi.getSlides()} autoSlide={autoplay} />
            <ScenarioSwitcher scenario={state.scenario} onScenario={setScenario} onTestAccess={testAccess} />
          </div>
          <PeopleFilters
            scope={scope}
            an={an}
            filters={f}
            activeCount={activeCount}
            onQuery={(q) => setFilters({ q })}
            onOpenSdo={openSdo}
            onOpenSo={openSo}
            onType={setType}
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
        </div>

        <ViewHeader
          scope={scope}
          an={an}
          filters={f}
          canGoBack={state.nav.length > 0}
          onBack={back}
          onOrg={toOrg}
          onOpenSdo={openSdo}
        />

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
            {an.so && (
              <SoProfile
                scope={scope}
                an={an}
                so={an.so}
                draft={state.reassign}
                onStart={() => {
                  const a = scope.rel[an.so!.id].assignment;
                  set({ reassign: { soId: an.so!.id, value: `${a.supType}:${a.supId}` } });
                }}
                onDraft={(value) => set((s) => ({ reassign: s.reassign && { ...s.reassign, value } }))}
                onConfirm={confirmReassign}
                onCancel={() => set({ reassign: null })}
              />
            )}
            {an.view === "sdo" && <SdoProfile scope={scope} sdo={an.sdo!} />}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-3.5">
              <TargetHero an={an} period={f.period} />
              <KpiGrid scope={scope} an={an} />
            </div>

            <Insights key={place} items={insights} />

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

            <AssociateSections
              scope={scope}
              an={an}
              filters={f}
              layout={state.layout}
              onLayout={(layout) => set({ layout })}
              sorts={state.sorts}
              onSort={(key, sort) => set((s) => ({ sorts: { ...s.sorts, [key]: sort } }))}
              expanded={state.expanded}
              onExpand={(key) => set((s) => ({ expanded: { ...s.expanded, [key]: !s.expanded[key] } }))}
              teamSdo={state.teamSdo}
              onTeamSdo={(teamSdo) => set({ teamSdo })}
              assign={state.assign}
              onAssign={(assign) => set({ assign })}
              onOpenSo={openSo}
              onOpenSdo={openSdo}
              onClear={clearFilters}
            />

            <Leaderboards an={an} onOpenSo={openSo} onOpenSdo={openSdo} />

            <p className="text-pretty px-2 text-center text-[12px] leading-normal text-fog">
              Showing only associates in {scope.csdo.id}&rsquo;s authorized scope (
              {plural(scope.sos.length, "SO")}, {plural(scope.sdos.length, "SDO")}). Team totals follow
              the current reporting line. Each SO and enrolment is counted once;{" "}
              {csdoApi.duplicatesIgnored} duplicate feed records were ignored. Earnings are shown as
              reported.
            </p>
          </div>
        )}
      </main>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 w-max max-w-[min(520px,calc(100vw-32px))] -translate-x-1/2 animate-toast-in rounded-2xl bg-navy px-4 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(29,35,52,.28)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
