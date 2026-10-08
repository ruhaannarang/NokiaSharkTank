import { AlertTriangle, CheckCircle } from 'lucide-react';

/** Prominent pre-arrival warning. Shows a stable-route state when no poor zone exists. */
export default function PredictionAlert({ nextPoor, startSegmentPlace }) {
  if (!nextPoor) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-green-200 p-4 anim-in">
        <div className="flex items-center gap-2 text-green-700 font-extrabold text-sm">
          <CheckCircle className="w-4 h-4" aria-hidden /> Route looks stable
        </div>
        <p className="mt-1 text-sm text-slate-600">Your predicted route remains stable — no poor connectivity zone detected.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow-card border-2 border-red-200 p-4 anim-in alert-pulse" role="alert">
      <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
        <AlertTriangle className="w-4 h-4" aria-hidden /> CONNECTIVITY DEGRADATION AHEAD
      </div>
      <div className="mt-2 text-sm space-y-1">
        <div>Poor connectivity predicted{startSegmentPlace ? ` near ${startSegmentPlace}` : ''}: <b>{nextPoor.km_ahead} km ahead</b></div>
        <div>Expected duration: <b>{nextPoor.duration_min} minutes</b> ({nextPoor.start_time}–{nextPoor.end_time})</div>
        <div>Confidence (prototype): <b>{Math.round(nextPoor.confidence * 100)}%</b></div>
        <div>Expected cause: <b>{nextPoor.cause}</b></div>
        <div className="bg-red-50 rounded-lg p-2 mt-1">Recommended: <b>Download important files before entering this zone.</b></div>
      </div>
    </div>
  );
}
