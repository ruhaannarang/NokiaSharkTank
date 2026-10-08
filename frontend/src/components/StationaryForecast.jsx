import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, MousePointerClick } from 'lucide-react';
import { statusBg, statusColor, STATUS_LABEL } from '../constants.js';

function emojiFor(status) {
  if (status === 'good') return '🟢';
  if (status === 'fair') return '🔵';
  if (status === 'unstable') return '🟡';
  return '🔴';
}

const GOOD = new Set(['good', 'fair']);

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + mins, 0, 0);
  let hh = d.getHours();
  const ap = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}

/** Group consecutive points into reliable (good/fair) vs weak windows. */
function buildWindows(points) {
  const wins = [];
  let cur = null;
  points.forEach((p) => {
    const good = GOOD.has(p.status);
    if (!cur || cur.good !== good) {
      if (cur) wins.push(cur);
      cur = { good, start: p, end: p };
    } else {
      cur.end = p;
    }
  });
  if (cur) wins.push(cur);
  return wins;
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export default function StationaryForecast({ stationary }) {
  const points = stationary?.points ?? [];
  const [selected, setSelected] = useState(null);
  useEffect(() => { setSelected(null); }, [stationary]);
  const sel = selected != null ? points[selected] : null;
  const stepMin = points.length > 1
    ? (toMin(points[1].time) - toMin(points[0].time) + 1440) % 1440 || 60
    : 60;
  const windows = useMemo(
    () => (points.length ? buildWindows(points) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stationary]
  );
  const reliable = windows.filter((w) => w.good);
  const weak = windows.filter((w) => !w.good);
  return (
    <section className="card p-5 anim-in" aria-label="Stationary forecast">
      <div className="eyebrow">Staying put</div>
      <h3 className="section-title">MS Ramaiah Institute of Technology · next 24 hours</h3>
      {stationary ? (
        <>
          {/* 24-hour day overview */}
          <div className="mt-3">
            <div className="flex h-4 rounded-full overflow-hidden border border-slate-200" role="img" aria-label="24 hour connectivity overview">
              {stationary.points.map((p, i) => (
                <div key={i} className="h-full flex-1" title={`${p.label ?? p.time}: ${STATUS_LABEL[p.status] ?? p.status}`}
                  style={{ background: statusColor(p.status) }} />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>{stationary.points[0]?.label ?? stationary.points[0]?.time}</span>
              <span>{stationary.points[Math.floor(stationary.points.length / 2)]?.label}</span>
              <span>{stationary.points[stationary.points.length - 1]?.label ?? stationary.points[stationary.points.length - 1]?.time}</span>
            </div>
          </div>
          {/* good-connectivity windows up front */}
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-3.5">
              <div className="flex items-center gap-1.5 text-green-800 font-extrabold text-sm">
                <CheckCircle className="w-4 h-4" aria-hidden /> Good times to be online
              </div>
              {reliable.length ? (
                <ul className="mt-1.5 space-y-1 text-sm text-green-900">
                  {reliable.map((w, i) => (
                    <li key={i}>
                      <b>{w.start.label ?? w.start.time}</b>
                      <span className="text-green-700"> → </span>
                      <b>{addMinutes(w.end.time, stepMin)}</b>
                      <span className="text-green-600 text-xs"> · reliable</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-sm text-green-800">No reliable window in the next 24 hours.</div>
              )}
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5">
              <div className="flex items-center gap-1.5 text-red-800 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4" aria-hidden /> Times to avoid heavy use
              </div>
              {weak.length ? (
                <ul className="mt-1.5 space-y-1 text-sm text-red-900">
                  {weak.map((w, i) => (
                    <li key={i}>
                      <b>{w.start.label ?? w.start.time}</b>
                      <span className="text-red-700"> → </span>
                      <b>{addMinutes(w.end.time, stepMin)}</b>
                      <span className="text-red-600 text-xs"> · {STATUS_LABEL[w.end.status]?.toLowerCase()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-sm text-red-800">Nothing to avoid — enjoy.</div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {stationary.points.map((p, i) => (
              <button key={i} onClick={() => setSelected(i === selected ? null : i)}
                aria-pressed={selected === i} title={`Why ${STATUS_LABEL[p.status] ?? p.status} at ${p.label ?? p.time}? Click for reasoning.`}
                className={`min-w-[110px] border rounded-xl p-2 text-center transition hover:-translate-y-0.5 ${statusBg(p.status)} ${GOOD.has(p.status) ? 'ring-2 ring-green-400/60' : ''} ${selected === i ? '!border-ink ring-2 ring-ink/40' : ''}`}>
                <div className="text-[11px] font-bold">{p.label ?? p.time}</div>
                <div className="text-lg" aria-hidden>{emojiFor(p.status)}</div>
                <div className="text-xs font-bold">{STATUS_LABEL[p.status] ?? p.status}</div>
                <div className="text-[11px]">{Math.round(p.connectivity_score)}</div>
              </button>
            ))}
          </div>

          {/* per-hour reasoning inspector */}
          {sel?.explanation ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 anim-in" key={selected}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-extrabold text-ink">Why {STATUS_LABEL[sel.status]?.toLowerCase() ?? sel.status} at {sel.label ?? sel.time}?</span>
                <span className="text-sm font-bold" style={{ color: statusColor(sel.status) }}>
                  {Math.round(sel.connectivity_score)} / 100
                </span>
                <span className="text-xs text-slate-400">prototype confidence {Math.round(sel.confidence * 100)}%</span>
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Network load', `${sel.explanation.network_load}%`, Math.min(100, sel.explanation.network_load)],
                  ['Tower distance', `${sel.explanation.tower_distance} km`, Math.min(100, (sel.explanation.tower_distance / 3) * 100)],
                  ['Historical quality', `${sel.explanation.historical_quality}`, Math.min(100, sel.explanation.historical_quality)],
                  ['Event density', `${sel.explanation.event_density}`, Math.min(100, sel.explanation.event_density * 100)],
                  ['Weather factor', `${sel.explanation.weather_factor}`, Math.min(100, sel.explanation.weather_factor * 100)]
                ].map(([k, label, pct]) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">{k}</span><b>{label}</b></div>
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0a2540,#1d5cab)' }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Feature-based explanation (not generated by the ML model itself): {sel.explanation.summary}
              </p>
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" aria-hidden /> Click any hour above to see exactly why it scored that way.
            </div>
          )}
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
