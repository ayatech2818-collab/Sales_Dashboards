import { LuLock } from "react-icons/lu";
import { SCENARIOS, type ScenarioKey } from "./model";

interface ScenarioSwitcherProps {
  scenario: ScenarioKey;
  onScenario: (key: ScenarioKey) => void;
  /** Request an SO outside the viewer's scope, to show the access-denied path. */
  onTestAccess: () => void;
}

/** Prototype-only strip for switching between demo org shapes. */
export function ScenarioSwitcher({ scenario, onScenario, onTestAccess }: ScenarioSwitcherProps) {
  return (
    <section
      aria-label="Demo scenario"
      className="flex flex-col gap-2 rounded-[18px] border-[1.5px] border-dashed border-[#cfcbc1] bg-[#efede7] px-3 py-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[.12em] text-[#6f7483]">
          PROTOTYPE · ORG SCENARIO
        </span>
        <button
          type="button"
          onClick={onTestAccess}
          className="flex h-7 cursor-pointer items-center gap-1.25 rounded-full border border-[#cfcbc1] bg-white px-2.5 text-[12px] font-semibold text-graphite"
        >
          <LuLock size={13} />
          Test out-of-scope access
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
          const active = key === scenario;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onScenario(key)}
              className={`flex cursor-pointer flex-col rounded-xl px-2.25 py-1.75 text-left leading-[1.2] ${
                active ? "bg-navy text-white" : "bg-white text-navy shadow-[0_1px_2px_rgba(29,35,52,.06)]"
              }`}
            >
              <span className="text-[13px] font-bold">{SCENARIOS[key].title}</span>
              <span className={`text-[11.5px] ${active ? "text-[#c9cedc]" : "text-pewter"}`}>
                {SCENARIOS[key].sub}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
