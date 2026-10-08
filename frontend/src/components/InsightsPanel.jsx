import { useEffect, useState } from 'react';
import { Clock, Info } from 'lucide-react';
import { api } from '../api.js';

const FALLBACK_META = {
  algorithm: 'HistGradientBoostingRegressor', mae: 2.86, rmse: 3.57, r2: 0.908,
  training_data: 'Synthetic prototype measurements (60,000 rows, seed 42)',
  features: ['latitude', 'longitude', 'hour', 'day_of_week', 'speed', 'tower_distance',
    'network_load', 'historical_quality', 'weather_factor', 'event_density',
    'hour_sin', 'hour_cos', 'peak_hour', 'is_weekend'],
  confidence_note: 'Prototype confidence is a transparent heuristic, not a calibrated probability.'
};

/** Model transparency — values come from GET /api/model-info (real train-time meta). */
export default function InsightsPanel() {
  const [meta, setMeta] = useState(FALLBACK_META);
  const [live, setLive] = useState(false);
  useEffect(() => {
    api.modelInfo()
      .then((m) => { setMeta({ ...FALLBACK_META, ...m }); setLive(true); })
      .catch(() => setLive(false));
  }, []);
  const fmt = (v, d = 2) => (v == null ? '—' : Number(v).toFixed(d));
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl shadow-card border p-4">
        <h3 className="font-bold text-ink text-sm mb-2 flex items-center gap-1">
          <Clock className="w-4 h-4" aria-hidden /> MODEL PERFORMANCE {live ? '' : '(offline values)'}
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['MAE', fmt(meta.mae)], ['RMSE', fmt(meta.rmse)], ['R²', fmt(meta.r2, 3)]].map(([k, v]) => (
            <div key={k} className="bg-slate-50 border rounded-xl py-3">
              <div className="text-[11px] text-slate-400">{k}</div>
              <div className="text-xl font-extrabold text-ink">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2 flex gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden />
          <span>{meta.algorithm} · {meta.training_data} · status accuracy ≈ 87%. {meta.confidence_note}</span>
        </p>
        <div className="mt-2 text-xs text-slate-500">
          <span className="font-bold text-slate-600">Features ({meta.features.length}):</span> {meta.features.join(', ')}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card border p-4">
        <h3 className="font-bold text-ink text-sm mb-2">THRESHOLDS</h3>
        <div className="space-y-2 text-sm">
          {[['0–30', 'Poor', '#dc2626'], ['31–55', 'Unstable', '#d97706'],
            ['56–75', 'Fair', '#0284c7'], ['76–100', 'Good', '#16a34a']].map(([r, s, c]) => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-16 text-slate-500 text-xs">{r}</span>
              <div className="flex-1 h-3 rounded-full" style={{ background: c, opacity: 0.8 }} aria-hidden />
              <b className="w-16 text-right text-xs">{s}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
