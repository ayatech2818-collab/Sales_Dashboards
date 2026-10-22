import { LuCircleAlert, LuLock } from "react-icons/lu";
import { PANEL } from "./parts";

export function LoadingState() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3.5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-3.5">
        <div className="flex h-64 flex-col gap-3.5 rounded-[26px] bg-[#1e293b] p-5.5">
          <div className="h-3 w-[45%] rounded-md bg-[#334155]" />
          <div className="h-9 w-[62%] rounded-[10px] bg-[#334155]" />
          <div className="h-3 w-2/5 rounded-md bg-[#334155]" />
          <div className="mt-auto h-2.5 rounded-md bg-[#334155]" />
          <div className="h-11.5 rounded-[14px] bg-[#27354a]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-30 rounded-[20px] bg-[#eceae4]" />
          ))}
        </div>
      </div>
      <span role="status" className="text-center text-[13px] text-fog">
        Loading state executive sales data…
      </span>
    </div>
  );
}

export type Problem =
  | { kind: "forbidden"; id: string }
  | { kind: "network" };

export function ProblemNotice({
  problem,
  onAction,
}: {
  problem: Problem;
  onAction: () => void;
}) {
  const locked = problem.kind === "forbidden";
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-2.5 rounded-[22px] px-5.5 py-7 text-center ${PANEL}`}
    >
      <div
        className={`flex size-14 items-center justify-center rounded-2xl ${
          locked ? "bg-pill text-graphite" : "bg-[#fdecec] text-brick"
        }`}
      >
        {locked ? <LuLock size={26} /> : <LuCircleAlert size={26} />}
      </div>
      <h2 className="text-[20px] font-extrabold text-navy">
        {locked ? "Access denied" : "Couldn’t load state performance data"}
      </h2>
      <p className="max-w-105 text-pretty text-[14px] leading-[1.45] text-steel">
        {locked
          ? `${problem.id} is outside this Sales Manager's reporting zone. The data layer strictly isolates regional divisions, so records outside your assigned CSDO territories cannot be loaded.`
          : "The state performance service didn’t respond. Your filters and reporting period are kept. Please retry."}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-1 flex h-10.5 cursor-pointer items-center gap-1.5 rounded-full bg-navy px-5 text-[14px] font-bold text-white shadow-sm hover:bg-[#151a27]"
      >
        {locked ? "Back to Zone Dashboard" : "Retry"}
      </button>
    </div>
  );
}
