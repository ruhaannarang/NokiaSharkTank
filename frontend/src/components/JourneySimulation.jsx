import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * Transport bar for the command deck: glowing circular play control,
 * progress track with poor-zone tick markers, segmented speed switch.
 */
export default function JourneySimulation({
  playing, setPlaying, progress, setProgress, simSpeed, setSimSpeed,
  current, simMsg, isPoor, zones = [], totalKm = 1
}) {
  const pct = Math.round(progress * 100);
  return (
    <div className="rounded-2xl border border-[#1d3a5f] p-4 shadow-[inset_0_2px_18px_rgba(0,0,0,.35)]"
      style={{ background: 'linear-gradient(150deg,#081b32,#0e3058)' }}>
      {/* track with poor-zone ticks seated on it */}
      <div className="relative">
        <input type="range" min="0" max="1000" value={Math.round(progress * 1000)}
          onChange={(e) => setProgress(e.target.value / 1000)} aria-label="Journey progress"
          className="sim-range w-full h-5" style={{ '--fill': `${pct}%` }} />
        <div className="absolute top-[6px] left-[10px] right-[10px] h-2 pointer-events-none" aria-hidden>
          {zones.map((z, i) => {
            const left = Math.max(0, Math.min(100, (z.distance_from_start_km / totalKm) * 100));
            return (
              <span key={i} title={`Poor zone ${z.start_time}–${z.end_time}`}
                className="absolute top-0 -translate-x-1/2 w-[3px] h-2 rounded-full bg-red-500"
                style={{ left: `${left}%`, boxShadow: '0 0 8px #ef4444' }} />
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={() => setPlaying(!playing)}
          aria-label={playing ? 'Pause journey simulation' : 'Start journey simulation'}
          className="w-12 h-12 rounded-full flex items-center justify-center text-[#0a2540] font-extrabold hover:brightness-110 hover:scale-105 active:scale-95 transition shrink-0"
          style={{ background: '#38f28a', boxShadow: '0 0 28px rgba(56,242,138,.55)' }}>
          {playing ? <Pause className="w-5 h-5" aria-hidden /> : <Play className="w-5 h-5 ml-0.5" aria-hidden />}
        </button>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-white leading-tight">
            {playing ? 'Simulating…' : pct >= 100 ? 'Journey complete' : 'Start journey simulation'}
          </div>
          <div className="text-xs text-slate-300">
            {pct}% · {current?.place} · {current?.time}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { setPlaying(false); setProgress(0); }} aria-label="Restart simulation"
            className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-white/10 transition">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Reset
          </button>
          <div className="flex rounded-xl border border-white/15 bg-white/5 p-0.5" role="group" aria-label="Simulation speed">
            {[0.5, 1, 2, 4].map((s) => (
              <button key={s} onClick={() => setSimSpeed(s)} aria-pressed={simSpeed === s}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition ${simSpeed === s ? 'text-[#0a2540]' : 'text-slate-300 hover:text-white'}`}
                style={simSpeed === s ? { background: '#38f28a' } : undefined}>
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {simMsg && (
        <div role="status"
          className={`mt-3 text-sm px-3.5 py-2.5 rounded-xl border font-semibold flex items-center gap-2 anim-in ${isPoor ? 'bg-red-500/15 border-red-400/40 text-red-200 alert-pulse' : 'bg-sky-400/10 border-sky-300/25 text-sky-200'}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${isPoor ? 'bg-red-400' : 'bg-sky-300'}`} aria-hidden />
          {simMsg}
        </div>
      )}
    </div>
  );
}
