import { AlertTriangle, ArrowRight, Cpu, Map, MessagesSquare, Radar, Route as RouteIcon, Sparkles } from 'lucide-react';
import Reveal from './Reveal.jsx';

const STEPS = [
  ['Scenario', 'Route + departure + transport set the context: load, tower distance, history, weather, crowds.', RouteIcon],
  ['Predict', 'The trained model scores every 8–9 km segment 0–100 with prototype confidence.', Radar],
  ['Locate zones', 'Contiguous weak segments become poor zones with distance, time window and cause.', Map],
  ['Recommend', 'Rules turn context into actions: download now, send messages, switch to audio.', MessagesSquare],
  ['Simulate', 'The traveler marker drives the route live — warning before, POOR inside, recovery after.', Sparkles]
];

const STACK = ['React 18', 'Vite 7', 'Tailwind 3', 'Leaflet + OSM', 'Recharts', 'FastAPI', 'scikit-learn', 'SQLite'];

export default function AboutSection({ onLaunchDemo }) {
  return (
    <div className="space-y-6">
      {/* hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl text-white p-8 md:p-10" style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>
          <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full anim-blob" style={{ background: 'rgba(56,242,138,.16)' }} />
          <div className="eyebrow !text-slate-300">Predictive Connectivity Intelligence</div>
          <h2 className="mt-1 text-2xl md:text-4xl font-extrabold tracking-tight max-w-2xl">
            Don&apos;t wait for your network to fail. Know when it will.
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            Coverage maps tell you what connectivity <i>was like</i> in an area. ConnectIQ tells you
            what <b className="text-white">yours</b> will be like — where it degrades, when, for how
            long, why, and what to do before it happens.
          </p>
          {onLaunchDemo && (
            <button onClick={onLaunchDemo}
              className="mt-5 px-5 py-2.5 rounded-xl font-extrabold text-sm text-[#0a2540] flex items-center gap-2 hover:brightness-110 transition"
              style={{ background: '#38f28a' }}>
              Run the hero demo <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </Reveal>

      {/* problem / solution */}
      <div className="grid md:grid-cols-2 gap-5">
        <Reveal>
          <div className="card p-6 h-full border-l-4 !border-l-red-400">
            <h3 className="section-title">Today: reactive</h3>
            <ul className="mt-2 text-sm text-slate-600 space-y-1.5 list-disc ml-5">
              <li>Calls drop, video freezes, messages fail — discovered after the fact.</li>
              <li>Static coverage maps answer “this area”, never “my route, my time”.</li>
              <li>No when, no how-long, no what-to-do.</li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card p-6 h-full border-l-4 !border-l-emerald-400">
            <h3 className="section-title">ConnectIQ: predictive</h3>
            <ul className="mt-2 text-sm text-slate-600 space-y-1.5 list-disc ml-5">
              <li>“Poor in 1.4 km, ~8 minutes, 89% confidence.”</li>
              <li>Personal route forecast with cause + duration.</li>
              <li>Smart actions before you enter the zone — then recovery.</li>
            </ul>
          </div>
        </Reveal>
      </div>

      {/* how it works */}
      <Reveal>
        <div className="card p-6">
          <div className="eyebrow">How it works</div>
          <h3 className="section-title">Predict → Explain → Warn → Act → Recover</h3>
          <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {STEPS.map(([t, b, Icon], i) => (
              <li key={t} className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg text-white text-xs font-extrabold flex items-center justify-center" style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>{i + 1}</span>
                  <Icon className="w-4 h-4 text-ink" />
                </div>
                <div className="mt-2 font-bold text-sm">{t}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{b}</div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {/* stack + roadmap */}
      <div className="grid md:grid-cols-2 gap-5">
        <Reveal>
          <div className="card p-6 h-full">
            <h3 className="section-title flex items-center gap-2"><Cpu className="w-4 h-4" /> Stack</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STACK.map((s) => (
                <span key={s} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-ink text-white">{s}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">Pinned to Vite 7 + Tailwind 3 · no API keys · SQLite file DB, Postgres-ready.</p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card p-6 h-full">
            <h3 className="section-title">Production roadmap</h3>
            <ul className="mt-2 text-sm text-slate-600 space-y-1.5 list-disc ml-5">
              <li>Crowdsourced measurements + operator KPIs replace synthetic data.</li>
              <li>Real tower DB, live load, weather and event feeds.</li>
              <li>Calibrated uncertainty, per-user calibration, push alerts.</li>
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span><b>Honest prototype.</b> The current prototype uses synthetic/simulated network measurements and a predefined Bengaluru–Chennai demonstration route. It is not a representation of live operator network coverage.</span>
        </div>
      </Reveal>
    </div>
  );
}
