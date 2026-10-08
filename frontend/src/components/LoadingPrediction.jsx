import { CheckCircle } from 'lucide-react';

export const LOADING_STEPS = [
  'Loading historical patterns',
  'Estimating network load',
  'Predicting route quality',
  'Generating recommendations'
];

export default function LoadingPrediction({ loadStep }) {
  return (
    <div className="mt-4 bg-slate-50 border rounded-xl p-4 text-sm" role="status" aria-live="polite">
      <div className="font-bold text-ink mb-2">Analyzing route…</div>
      {LOADING_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 text-slate-600 py-0.5">
          {i < loadStep
            ? <CheckCircle className="w-4 h-4 text-green-600" aria-label="done" />
            : <span className="w-4 h-4 rounded-full border-2 border-slate-300 animate-spin border-t-ink" aria-hidden />}
          {s}
        </div>
      ))}
      {loadStep >= LOADING_STEPS.length && <div className="font-bold text-green-700 mt-1">Forecast ready.</div>}
    </div>
  );
}
