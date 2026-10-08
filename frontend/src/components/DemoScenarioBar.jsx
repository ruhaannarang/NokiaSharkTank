import { Train, MapPin, Video, ArrowRight, FlaskConical } from 'lucide-react';

const SCENARIOS = [
  {
    n: 1, icon: Train, accent: '#38f28a',
    title: 'Bengaluru → Chennai',
    meta: 'Moving · Train · 6:00 PM',
    desc: 'The hero demo: green, amber, then red.'
  },
  {
    n: 2, icon: MapPin, accent: '#7dd3fc',
    title: 'Stationary @ MSRIT',
    meta: 'Staying put · evening peak',
    desc: 'What will the next 3 hours feel like here?'
  },
  {
    n: 3, icon: Video, accent: '#fbbf24',
    title: 'Video call @ 7:15 PM',
    meta: '19:00 departure · auto-plays',
    desc: 'Will the call survive the weak stretch?'
  }
];

export default function DemoScenarioBar({ loadScenario, active }) {
  return (
    <section aria-label="Demo scenarios"
      className="relative overflow-hidden rounded-3xl text-white p-5 md:p-6"
      style={{ background: 'linear-gradient(120deg,#0a2540 30%,#16406f 70%,#0a2540)' }}>
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full anim-blob pointer-events-none" style={{ background: 'rgba(56,242,138,.12)' }} />
      <div className="relative flex flex-wrap items-end gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.18em] px-2.5 py-1 rounded-lg"
            style={{ background: '#38f28a', color: '#0a2540' }}>
            <FlaskConical className="w-3 h-3" aria-hidden /> DEMO MODE
          </div>
          <h2 className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight">Pick a story to play</h2>
          <p className="text-xs text-slate-300 mt-0.5">Each scenario loads a full prediction in one click. Prototype prediction based on simulated measurements.</p>
        </div>
      </div>
      <div className="relative grid sm:grid-cols-3 gap-3">
        {SCENARIOS.map((s) => {
          const isActive = active === s.n;
          return (
            <button key={s.n} onClick={() => loadScenario(s.n)}
              aria-pressed={isActive}
              className="group text-left rounded-2xl p-4 border transition duration-300 hover:-translate-y-0.5"
              style={isActive
                ? { background: 'rgba(56,242,138,.12)', borderColor: s.accent, boxShadow: `0 0 24px ${s.accent}44` }
                : { background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.12)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.accent}22`, border: `1px solid ${s.accent}66` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.accent }} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">0{s.n}</span>
                    <span className="truncate">{s.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">{s.meta}</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition" aria-hidden />
              </div>
              <div className="mt-2 text-xs text-slate-300/90 leading-relaxed">{s.desc}</div>
              {isActive && (
                <div className="mt-2.5 h-1 rounded-full overflow-hidden bg-white/10">
                  <div className="h-full w-full rounded-full" style={{ background: s.accent }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
