import { statusBg, STATUS_LABEL } from '../constants.js';

function emojiFor(status) {
  if (status === 'good') return '🟢';
  if (status === 'fair') return '🔵';
  if (status === 'unstable') return '🟡';
  return '🔴';
}

export default function StationaryForecast({ stationary }) {
  return (
    <section className="bg-white rounded-2xl shadow-card border p-4 anim-in" aria-label="Stationary forecast">
      <h3 className="font-bold text-ink text-sm">STATIONARY FORECAST · MS Ramaiah Institute of Technology</h3>
      {stationary ? (
        <>
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {stationary.points.map((p, i) => (
              <div key={i} className={`min-w-[110px] border rounded-xl p-2 text-center ${statusBg(p.status)}`}>
                <div className="text-[11px] font-bold">{p.time}</div>
                <div className="text-lg" aria-hidden>{emojiFor(p.status)}</div>
                <div className="text-xs font-bold">{STATUS_LABEL[p.status] ?? p.status}</div>
                <div className="text-[11px]">{Math.round(p.connectivity_score)}</div>
              </div>
            ))}
          </div>
          {stationary.alert && (
            <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded-xl p-2">
              ⚠ Poor connectivity predicted between {stationary.alert.start} and {stationary.alert.end}. Cause: {stationary.alert.cause}
            </div>
          )}
        </>
      ) : <div className="text-sm text-slate-400 mt-2">Run a forecast to load the stationary prediction.</div>}
    </section>
  );
}
