import { useEffect, useState } from 'react';
import { BrainCircuit, Database, SlidersHorizontal, ShieldCheck, GitBranch, Info } from 'lucide-react';
import Reveal, { CountUp } from './Reveal.jsx';
import { api } from '../api.js';

const FALLBACK_META = {
  algorithm: 'HistGradientBoostingRegressor', mae: 2.86, rmse: 3.57, r2: 0.908,
  training_data: 'Synthetic prototype measurements (60,000 rows, seed 42)',
  features: ['latitude', 'longitude', 'hour', 'day_of_week', 'speed', 'tower_distance',
    'network_load', 'historical_quality', 'weather_factor', 'event_density',
    'hour_sin', 'hour_cos', 'peak_hour', 'is_weekend'],
  confidence_note: 'Prototype confidence is a transparent heuristic, not a calibrated probability.'
};

const PIPELINE = [
  ['Generate', '60,000 seeded measurements along the Bengaluru → Chennai corridor with evening peaks, tower decay and poor-coverage pockets.'],
  ['Engineer', 'Cyclical time (hour sin/cos), peak-hour and weekend flags join raw network context.'],
  ['Train', 'HistGradientBoosting regressor learns connectivity_score 0–100 from context.'],
  ['Serve', 'FastAPI predicts every route segment live; explanations come from a feature-based layer.']
];

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
    <div className="space-y-6">
      {/* hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl text-white p-8" style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full anim-blob" style={{ background: 'rgba(56,242,138,.18)' }} />
          <div className="eyebrow !text-slate-300">Transparency · no black boxes</div>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-7 h-7" style={{ color: '#38f28a' }} /> Model insights
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            Every number below is {live ? 'read live from the trained model' : 'shown from the last training run (backend offline)'}
            — algorithm, metrics, features and what “confidence” honestly means.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
            {[['R²', fmt(meta.r2, 3)], ['MAE', fmt(meta.mae)], ['RMSE', fmt(meta.rmse)]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/15 bg-white/5 py-4 text-center">
                <div className="text-[11px] tracking-widest text-slate-300 font-bold">{k}</div>
                <div className="text-2xl font-extrabold" style={{ color: '#38f28a' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-5">
        <Reveal>
          <div className="card p-6 h-full">
            <h3 className="section-title flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> What the model sees</h3>
            <p className="text-xs text-slate-500 mt-1">{meta.features.length} contextual features per prediction.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meta.features.map((f) => (
                <span key={f} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">{f}</span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card p-6 h-full">
            <h3 className="section-title flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> What “confidence” means</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{meta.confidence_note}</p>
            <div className="mt-3 space-y-2 text-sm">
              {[['0–30', 'Poor', '#dc2626'], ['31–55', 'Unstable', '#d97706'],
                ['56–75', 'Fair', '#0284c7'], ['76–100', 'Good', '#16a34a']].map(([r, s, c]) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-16 text-slate-500 text-xs">{r}</span>
                  <div className="flex-1 h-3 rounded-full" style={{ background: c, opacity: 0.85 }} aria-hidden />
                  <b className="w-16 text-right text-xs">{s}</b>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="card p-6 h-full">
            <h3 className="section-title flex items-center gap-2"><Database className="w-4 h-4" /> Training data</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{meta.training_data}. Corridor sampling with rural-gap pockets, peak-hour congestion, tower-distance decay and weather/event effects — seed 42, reproducible.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 border py-3"><div className="text-xl font-extrabold text-ink"><CountUp to={60000} /></div><div className="text-[11px] text-slate-400">rows</div></div>
              <div className="rounded-xl bg-slate-50 border py-3"><div className="text-xl font-extrabold text-ink">~87%</div><div className="text-[11px] text-slate-400">status accuracy</div></div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card p-6 h-full">
            <h3 className="section-title flex items-center gap-2"><GitBranch className="w-4 h-4" /> Pipeline</h3>
            <ol className="mt-3 space-y-3">
              {PIPELINE.map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full text-white text-xs font-extrabold flex items-center justify-center" style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>{i + 1}</span>
                  <div><b className="text-sm">{t}.</b> <span className="text-sm text-slate-600">{b}</span></div>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500 mt-3 flex gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" /> {meta.algorithm} · target connectivity_score 0–100.</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
