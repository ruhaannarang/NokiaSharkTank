import { AlertTriangle, CheckCircle, Download, Gauge, Navigation, ShieldAlert } from 'lucide-react';

/** Pre-arrival warning as a dark command-style alert with a hero distance number. */
export default function PredictionAlert({ nextPoor, startSegmentPlace }) {
  if (!nextPoor) {
    return (
      <div className="rounded-2xl shadow-card border border-green-200 bg-white p-5 anim-in">
        <div className="flex items-center gap-2 text-green-700 font-extrabold text-sm">
          <CheckCircle className="w-4 h-4" aria-hidden /> Route looks stable
        </div>
        <p className="mt-1 text-sm text-slate-600">Your predicted route remains stable — no poor connectivity zone detected.</p>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white anim-in alert-pulse border border-red-400/30"
      role="alert" style={{ background: 'linear-gradient(150deg,#3f0d12,#7f1d1d 60%,#991b1b)' }}>
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full anim-blob pointer-events-none" style={{ background: 'rgba(248,113,113,.25)' }} />
      <div className="relative flex items-center gap-2 text-red-200 font-extrabold text-xs tracking-[0.14em]">
        <AlertTriangle className="w-4 h-4" aria-hidden /> CONNECTIVITY DEGRADATION AHEAD
      </div>

      <div className="relative mt-3 flex items-end gap-2">
        <span className="text-5xl font-extrabold tracking-tight leading-none">{nextPoor.km_ahead}</span>
        <span className="text-red-200 font-bold mb-1">km ahead{startSegmentPlace ? ` · near ${startSegmentPlace}` : ''}</span>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Duration', `${nextPoor.duration_min} min`, `${nextPoor.start_time}–${nextPoor.end_time}`],
          ['Confidence', `${Math.round(nextPoor.confidence * 100)}%`, 'prototype'],
          ['Cause', 'Load + towers', null]
        ].map(([k, v, sub]) => (
          <div key={k} className="rounded-xl border border-white/15 bg-white/10 px-2 py-2">
            <div className="text-[10px] uppercase tracking-wider text-red-200/80">{k}</div>
            <div className="font-extrabold text-sm leading-tight mt-0.5">{v}</div>
            {sub && <div className="text-[10px] text-red-200/70">{sub}</div>}
          </div>
        ))}
      </div>
      <div className="relative mt-2 text-[11px] text-red-200/80 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden /> {nextPoor.cause}
      </div>

      <div className="relative mt-3 rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 flex items-center gap-2.5">
        <Download className="w-4 h-4 shrink-0 text-red-200" aria-hidden />
        <div className="text-xs"><b>Download important files now</b> — before entering this zone.</div>
      </div>
      <div className="relative mt-2 text-[11px] text-red-200/70 flex items-center gap-1.5">
        <Navigation className="w-3 h-3" aria-hidden /> Predicted window {nextPoor.start_time}–{nextPoor.end_time}
        <span className="ml-auto flex items-center gap-1"><Gauge className="w-3 h-3" aria-hidden /> AI forecast</span>
      </div>
    </div>
  );
}
