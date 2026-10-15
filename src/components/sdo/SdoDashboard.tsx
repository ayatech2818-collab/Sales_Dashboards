"use client";

import { useMemo, useState } from "react";
import { MdArrowBack, MdGroups, MdPerson } from "react-icons/md";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { sdoApi } from "@/data/sdo";
import { prefersReducedMotion } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "./DataStates";
import { FilterPanel } from "./FilterPanel";
import { Insights } from "./Insights";
import { KpiGrid } from "./KpiGrid";
import {
  DEFAULT_THRESHOLDS,
  LIST_PAGE,
  analyzeTeam,
  categoryStyles,
  resolvePeriod,
  type DataState,
  type Thresholds,
  type ViewState,
} from "./model";
import { OrganizerDetail } from "./OrganizerDetail";
import { OrganizerList } from "./OrganizerList";
import { SalesTrend } from "./SalesTrend";
import { SdoProfileCard } from "./SdoProfileCard";
import { TargetHero } from "./TargetHero";
import { TeamBreakdown } from "./TeamBreakdown";
import { TopOrganizers } from "./TopOrganizers";

const INITIAL_VIEW: ViewState = {
  person: "all",
  period: "month",
  customStart: "2026-10-01",
  customEnd: "2026-10-13",
  perf: "all",
  status: "all",
  sort: "sales",
  listQuery: "",
  shown: LIST_PAGE,
  peopleOpen: false,
  peopleQuery: "",
};

/** Filters that Reset clears; sort, custom dates and the people panel are kept. */
const CLEARED: Partial<ViewState> = {
  person: "all",
  period: "month",
  perf: "all",
  status: "all",
  listQuery: "",
  peopleQuery: "",
  shown: LIST_PAGE,
};

interface SdoDashboardProps {
  /** Force a loading, empty or error state; the data is live otherwise. */
  dataState?: DataState;
  /** Let the announcement slides and the Top 10 strip advance on their own. */
  autoplay?: boolean;
  thresholds?: Thresholds;
}

/**
 * Supervisor view of the Sales Organizers assigned to one SDO: team KPIs by
 * default, or a single organizer's KPIs once one is picked.
 */
export function SdoDashboard({
  dataState = "live",
  autoplay = true,
  thresholds = DEFAULT_THRESHOLDS,
}: SdoDashboardProps) {
  const [view, setView] = useState(INITIAL_VIEW);
  const [retried, setRetried] = useState(false);
  const state = retried ? "live" : dataState;

  const update = (patch: Partial<ViewState>) => setView((v) => ({ ...v, ...patch }));
  const reset = () => update(CLEARED);
  const pick = (person: string) => {
    update({ person, peopleOpen: false, peopleQuery: "" });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const sdo = sdoApi.getSdoProfile();
  const cats = useMemo(() => categoryStyles(thresholds), [thresholds]);
  const period = useMemo(
    () => resolvePeriod(view.period, view.customStart, view.customEnd),
    [view.period, view.customStart, view.customEnd],
  );
  const team = useMemo(
    () =>
      analyzeTeam(state === "empty" ? [] : sdoApi.getAssignedSOs(sdo.id), period, thresholds, {
        person: view.person,
        perf: view.perf,
        status: view.status,
      }),
    [state, sdo.id, period, thresholds, view.person, view.perf, view.status],
  );
  const { metrics, ranked, selected, filtered, scope, totals, isFiltered } = team;

  const hasFilters =
    view.person !== "all" ||
    view.perf !== "all" ||
    view.status !== "all" ||
    view.period !== "month" ||
    !!view.listQuery;

  return (
    <div className="min-h-dvh bg-paper font-sans leading-[normal] text-ink">
      <main className="mx-auto flex max-w-[440px] flex-col gap-4 px-3.5 pb-12 pt-4 md:max-w-6xl md:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
          <div className="flex flex-col gap-4">
            <SdoProfileCard sdo={sdo} count={metrics.length} />
            <PromoCarousel slides={sdoApi.getSlides()} autoSlide={autoplay} />
          </div>
          <FilterPanel
            view={view}
            metrics={metrics}
            selected={selected}
            cats={cats}
            hasFilters={hasFilters}
            onChange={update}
            onPick={pick}
            onReset={reset}
          />
        </div>

        {state === "loading" && <LoadingState />}
        {state === "empty" && <EmptyState />}
        {state === "error" && <ErrorState onRetry={() => setRetried(true)} />}

        {state === "live" && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className={`flex items-center gap-1.5 rounded-full py-[5px] pl-2 pr-3 text-[12px] font-bold tracking-[.08em] text-white ${
                  selected ? "bg-good" : "bg-night"
                }`}
              >
                {selected ? <MdPerson size={18} /> : <MdGroups size={18} />}
                {selected ? "INDIVIDUAL" : "TEAM VIEW"}
              </div>
              <div className="text-[15px] font-semibold text-label">
                {selected
                  ? `${selected.so.name} · ${period.label}`
                  : `${totals.count} of ${metrics.length} SOs · ${period.label}${isFiltered ? " · filtered" : ""}`}
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={() => update({ person: "all" })}
                  className="ml-auto flex cursor-pointer items-center gap-1 rounded-full border-[1.5px] border-[#e2dfd8] bg-white px-3 py-[5px] text-[14px] font-bold text-night"
                >
                  <MdArrowBack size={18} />
                  Back to team
                </button>
              )}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-stretch gap-4">
              <TargetHero totals={totals} period={period} selected={selected} />
              <KpiGrid
                totals={totals}
                period={period}
                scope={scope}
                selected={selected}
                rankedCount={ranked.length}
                thresholds={thresholds}
              />
            </div>

            <Insights
              totals={totals}
              period={period}
              selected={selected}
              ranked={ranked}
              isFiltered={isFiltered}
            />

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-4">
              {selected ? (
                <OrganizerDetail selected={selected} period={period} cat={cats[selected.cat]} />
              ) : (
                <TeamBreakdown
                  totals={totals}
                  period={period}
                  filtered={filtered}
                  cats={cats}
                  perf={view.perf}
                  isFiltered={isFiltered}
                  onPerf={(perf) => update({ perf, shown: LIST_PAGE })}
                  onPick={pick}
                />
              )}
              <SalesTrend scope={scope} period={period} totals={totals} selected={selected} />
            </div>

            <OrganizerList
              filtered={filtered}
              assigned={metrics.length}
              period={period}
              selected={selected}
              cats={cats}
              sort={view.sort}
              query={view.listQuery}
              shown={view.shown}
              onSort={(sort) => update({ sort })}
              onQuery={(listQuery) => update({ listQuery, shown: LIST_PAGE })}
              onShowMore={() => setView((v) => ({ ...v, shown: v.shown + LIST_PAGE }))}
              onPick={pick}
              onReset={reset}
            />

            <TopOrganizers
              ranked={ranked}
              selected={selected}
              period={period}
              autoplay={autoplay}
              onPick={pick}
            />

            <p className="text-center text-[12px] text-hint">
              Showing only the {metrics.length} organizers assigned to {sdo.id}. Earnings are
              illustrative figures.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
