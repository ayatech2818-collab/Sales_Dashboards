import { LuCircleAlert, LuLock } from "react-icons/lu";
import { PANEL } from "./parts";

export function LoadingState() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3.5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-3.5">
        <div className="flex h-62.5 flex-col gap-3.5 rounded-[26px] bg-[#2a3049] p-5.5">
          <div className="h-3 w-[45%] rounded-md bg-[#3a4160]" />
          <div className="h-9 w-[62%] rounded-[10px] bg-[#3a4160]" />
          <div className="h-3 w-2/5 rounded-md bg-[#3a4160]" />
          <div className="mt-auto h-2.5 rounded-md bg-[#3a4160]" />
          <div className="h-11.5 rounded-[14px] bg-[#343b57]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-29.5 rounded-[20px] bg-[#eceae4]" />
          ))}
        </div>
      </div>
      <span role="status" className="text-center text-[13px] text-fog">
        Loading performance data…
      </span>
    </div>
  );
}

export type Problem =
  | { kind: "forbidden"; id: string }
  | { kind: "network" };

/** Access denied for an out-of-scope record, or the service not responding. */
export function ProblemNotice({ problem, onAction }: { problem: Problem; onAction: () => void }) {
  const locked = problem.kind === "forbidden";
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-2.5 rounded-[22px] px-5.5 py-7 text-center ${PANEL}`}
    >
      <div
        className={`flex size-13.5 items-center justify-center rounded-2xl ${
          locked ? "bg-pill text-graphite" : "bg-[#fdecec] text-brick"
        }`}
      >
        {locked ? <LuLock size={24} /> : <LuCircleAlert size={24} />}
      </div>
      <h2 className="text-[19px] font-extrabold">
        {locked ? "Access denied" : "Couldn’t load performance data"}
      </h2>
      <p className="max-w-100 text-pretty text-[14px] leading-[1.45] text-steel">
        {locked
          ? `${problem.id} is outside your reporting scope. The data layer only returns associates assigned to you or to your SDOs, so no details for this record were loaded.`
          : "The performance service didn’t respond. Your filters and reporting period are kept. Try again."}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-1 flex h-10.5 cursor-pointer items-center gap-1.5 rounded-full bg-navy px-4.5 text-[14px] font-bold text-white"
      >
        {locked ? "Back to dashboard" : "Retry"}
      </button>
    </div>
  );
}
