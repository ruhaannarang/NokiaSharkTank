import { Sparkles } from 'lucide-react';

export default function DemoScenarioBar({ loadScenario }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 flex flex-wrap items-center gap-2 anim-in">
      <span className="text-xs font-bold px-2 py-1 rounded bg-ink text-white flex items-center gap-1">
        <Sparkles className="w-3 h-3" aria-hidden /> DEMO MODE
      </span>
      <button onClick={() => loadScenario(1)} aria-label="Load scenario 1: Bengaluru to Chennai at 6 PM"
        className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 font-bold">
        Scenario 1: Bengaluru → Chennai · 6 PM
      </button>
      <button onClick={() => loadScenario(2)}
        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 border hover:bg-slate-200">
        Scenario 2: Stationary @ MSRIT
      </button>
      <button onClick={() => loadScenario(3)}
        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 border hover:bg-slate-200">
        Scenario 3: Video call @ 7:15 PM
      </button>
      <span className="ml-auto text-[11px] text-slate-400 hidden lg:block">
        Prototype prediction based on simulated/historical network measurements.
      </span>
    </div>
  );
}
