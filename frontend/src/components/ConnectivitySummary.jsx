import { RouteTimeline } from './Charts.jsx';

function Hm({ min }) {
  return <>{Math.floor(min / 60)}h {min % 60}m</>;
}

/** Route totals (always from backend output) + timeline + simulation slot. */
export default function ConnectivitySummary({ forecast, simIndex, simulation }) {
  const summary = forecast.summary ?? {
    good_min: forecast.good_min, unstable_min: forecast.unstable_min,
    poor_min: forecast.poor_min, fair_min: forecast.fair_min ?? 0
  };
  return (
    <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <h3 className="font-bold text-ink text-sm">
          Personal Connectivity Route{' '}
          <span className="text-slate-400 font-normal">
            {forecast.origin} → {forecast.destination} · {forecast.total_label} · {forecast.total_km} km
          </span>
        </h3>
        {forecast.fallback && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
            Demo data — backend unavailable
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-xl bg-green-50 border border-green-200 py-2">
          <div className="text-[11px] text-green-700 font-bold">GOOD</div>
          <div className="font-extrabold text-green-800"><Hm min={summary.good_min} /></div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 py-2">
          <div className="text-[11px] text-amber-700 font-bold">UNSTABLE</div>
          <div className="font-extrabold text-amber-800"><Hm min={summary.unstable_min} /></div>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 py-2">
          <div className="text-[11px] text-red-700 font-bold">POOR</div>
          <div className="font-extrabold text-red-800"><Hm min={summary.poor_min} /></div>
        </div>
      </div>
      <RouteTimeline segments={forecast.segments} simIndex={simIndex} />
      {simulation}
    </div>
  );
}
