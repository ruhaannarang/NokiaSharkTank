import { Play, Pause, RotateCcw } from 'lucide-react';

export default function JourneySimulation({
  playing, setPlaying, progress, setProgress, simSpeed, setSimSpeed, current, simMsg, isPoor
}) {
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2 bg-slate-50 border rounded-xl p-3">
        <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause journey simulation' : 'Start journey simulation'}
          className="px-4 py-2 rounded-xl bg-ink text-white text-sm font-bold flex items-center gap-2 hover:opacity-90"
          style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>
          {playing ? <Pause className="w-4 h-4" aria-hidden /> : <Play className="w-4 h-4" aria-hidden />}
          {playing ? 'Pause' : 'Start Journey Simulation'}
        </button>
        <button onClick={() => { setPlaying(false); setProgress(0); }} aria-label="Restart simulation"
          className="px-3 py-2 rounded-xl border bg-white text-sm flex items-center gap-1">
          <RotateCcw className="w-4 h-4" aria-hidden /> Reset
        </button>
        <input type="range" min="0" max="1000" value={Math.round(progress * 1000)}
          onChange={(e) => setProgress(e.target.value / 1000)} aria-label="Journey progress"
          className="flex-1 min-w-[140px]" />
        <select value={simSpeed} onChange={(e) => setSimSpeed(+e.target.value)}
          aria-label="Simulation speed" className="text-xs border rounded-lg px-2 py-1.5">
          <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
        </select>
        <span className="text-xs text-slate-500 w-28 text-right">
          {Math.round(progress * 100)}% · {current?.place} {current?.time}
        </span>
      </div>
      {simMsg && (
        <div role="status"
          className={`mt-2 text-sm px-3 py-2 rounded-xl border font-medium anim-in ${isPoor ? 'bg-red-50 border-red-200 text-red-800 alert-pulse' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
          {simMsg}
        </div>
      )}
    </>
  );
}
