import { Signal, Radar, BellRing, Zap, ArrowRight, Play, MapPin, Activity, BrainCircuit } from 'lucide-react';
import Reveal, { CountUp } from '../Reveal.jsx';

const NAVY = '#0a2540';

function LandingNav({ onLaunch }) {
  return (
    <nav className="absolute top-0 inset-x-0 z-20">
      <div className="max-w-7xl mx-auto px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#38f28a' }}>
          <Signal className="w-5 h-5" color={NAVY} />
        </div>
        <div className="font-extrabold tracking-wide text-white text-lg leading-none">
          CONNECTIQ
          <div className="text-[11px] font-normal text-slate-300 tracking-normal">Predictive Connectivity Intelligence</div>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#story" className="hover:text-white transition">The idea</a>
          <a href="#demo-strip" className="hover:text-white transition">Live route</a>
          <a href="#model" className="hover:text-white transition">The model</a>
          <button onClick={() => onLaunch()}
            className="px-4 py-2 rounded-xl font-bold text-sm text-[#0a2540] hover:brightness-110 transition"
            style={{ background: '#38f28a' }}>
            Launch live demo
          </button>
        </div>
      </div>
    </nav>
  );
}

/** Animated hero route: data flowing along the path, traveler dot, pulsing poor zone. */
function HeroRoute() {
  const d = 'M 30 210 C 110 210, 130 150, 210 150 S 300 195, 345 160 S 460 95, 570 95';
  return (
    <svg viewBox="0 0 600 260" className="w-full h-auto" role="img" aria-label="Animated connectivity route from Bengaluru to Chennai with a poor zone ahead">
      {/* track */}
      <path d={d} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="10" strokeLinecap="round" />
      {/* connectivity segments */}
      <path d={d} fill="none" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray="34 66" strokeDashoffset="0" />
      <path d={d} fill="none" stroke="#d97706" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray="20 80" strokeDashoffset="-34" />
      <path d={d} fill="none" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray="15 85" strokeDashoffset="-54">
        <animate attributeName="opacity" values="1;.55;1" dur="2.2s" repeatCount="indefinite" />
      </path>
      {/* flowing data dashes */}
      <path d={d} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" className="route-flow" />
      {/* poor-zone pulse */}
      <g>
        <circle cx="352" cy="158" r="16" fill="none" stroke="#f87171" strokeWidth="2" className="ping-ring" />
        <circle cx="352" cy="158" r="16" fill="none" stroke="#f87171" strokeWidth="2" className="ping-ring" style={{ animationDelay: '1.1s' }} />
        <circle cx="352" cy="158" r="7" fill="#dc2626" stroke="white" strokeWidth="2.5" />
      </g>
      {/* traveler */}
      <g>
        <circle r="9" fill={NAVY} stroke="#38f28a" strokeWidth="3.5">
          <animateMotion dur="7s" repeatCount="indefinite" path={d} />
        </circle>
      </g>
      {/* endpoints */}
      <circle cx="30" cy="210" r="8" fill="#16a34a" stroke="white" strokeWidth="3" />
      <circle cx="570" cy="95" r="8" fill="#38f28a" stroke={NAVY} strokeWidth="3" />
      <text x="30" y="242" fill="#cbd5e1" fontSize="13" fontWeight="700" textAnchor="middle">Bengaluru · 6:00 PM</text>
      <text x="352" y="132" fill="#fca5a5" fontSize="12" fontWeight="700" textAnchor="middle">POOR · 8 min</text>
      <text x="570" y="127" fill="#cbd5e1" fontSize="13" fontWeight="700" textAnchor="middle">Chennai</text>
    </svg>
  );
}

const STOPS = [
  ['Bengaluru', '#16a34a', 'Good'], ['Hosur', '#16a34a', 'Good'], ['Krishnagiri', '#d97706', 'Unstable'],
  ['Dharmapuri', '#dc2626', 'Poor'], ['Salem', '#d97706', 'Unstable'], ['Vellore', '#0284c7', 'Fair'], ['Chennai', '#16a34a', 'Good']
];

function DemoStrip() {
  const row = [...STOPS, ...STOPS];
  return (
    <div id="demo-strip" className="border-y border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex whitespace-nowrap py-3.5 anim-marquee w-max">
        {row.map(([place, color, status], i) => (
          <span key={i} className="mx-6 text-sm text-slate-300 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <b className="text-white font-semibold">{place}</b> · {status}
            <span className="ml-6 text-slate-600">→</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { icon: Radar, color: '#38f28a', title: 'Predict', body: 'A trained model forecasts connectivity for every stretch of your route — before you travel it — with confidence and cause.' },
  { icon: BellRing, color: '#fbbf24', title: 'Warn', body: '“Poor connectivity predicted 1.4 km ahead, lasting ~8 minutes.” You know where, when, and for how long.' },
  { icon: Zap, color: '#7dd3fc', title: 'Act', body: 'Download files now. Send pending messages. Switch the 7:15 PM video call to audio. Then watch yourself recover.' }
];

export default function LandingPage({ onLaunch }) {
  return (
    <div className="min-h-screen text-white" style={{ background: NAVY }}>
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full anim-blob" style={{ background: 'rgba(56,242,138,.14)' }} />
        <div className="absolute top-20 right-[-140px] w-[520px] h-[520px] rounded-full anim-blob" style={{ background: 'rgba(29,92,171,.35)', animationDelay: '-6s' }} />
        <LandingNav onLaunch={onLaunch} />

        <div className="relative max-w-7xl mx-auto px-5 pt-32 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-200">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#38f28a' }} />
              NOKIA SHARK TANK · PROTOTYPE
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Don&apos;t wait for your network to <span className="anim-gradient-text">fail.</span>
            </h1>
            <p className="mt-5 text-slate-300 text-lg leading-relaxed max-w-xl">
              Know when it will — and act before it does. ConnectIQ predicts connectivity
              along <b className="text-white">your route</b>, warns you <b className="text-white">before</b> the
              bad stretch, and tells you <b className="text-white">what to do</b> about it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onLaunch()}
                className="group px-6 py-3.5 rounded-2xl font-extrabold text-[#0a2540] flex items-center gap-2 hover:brightness-110 transition shadow-2xl"
                style={{ background: '#38f28a' }}>
                <Play className="w-4 h-4" /> Run the hero demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
              <a href="#story"
                className="px-6 py-3.5 rounded-2xl font-bold border border-white/20 text-white hover:bg-white/10 transition">
                See how it works
              </a>
            </div>
            <div className="mt-6 text-[12px] text-slate-400">
              Prototype prediction based on simulated measurements — not live operator data.
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur p-5 shadow-2xl anim-float">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Bengaluru → Chennai · Train · 6:00 PM</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-400/40 text-red-300 font-bold">1 poor zone</span>
              </div>
              <HeroRoute />
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-emerald-400/10 border border-emerald-300/20 py-2"><div className="font-extrabold text-emerald-300 text-base">2h 29m</div>Good</div>
                <div className="rounded-xl bg-amber-400/10 border border-amber-300/20 py-2"><div className="font-extrabold text-amber-300 text-base">1h 53m</div>Unstable</div>
                <div className="rounded-xl bg-red-400/10 border border-red-300/20 py-2"><div className="font-extrabold text-red-300 text-base">1h 35m</div>Poor</div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 md:-left-8 rounded-2xl bg-white text-slate-900 px-4 py-3 shadow-2xl anim-float-slow max-w-[260px]">
              <div className="text-[11px] font-bold text-red-600 flex items-center gap-1">⚠ DEGRADATION AHEAD</div>
              <div className="text-sm font-bold">Poor in 1.4 km · ~8 min</div>
              <div className="text-xs text-slate-500">Download important files now.</div>
            </div>
          </div>
        </div>
      </header>

      <DemoStrip />

      {/* STORY */}
      <section id="story" className="max-w-7xl mx-auto px-5 py-20">
        <Reveal>
          <div className="eyebrow !text-slate-400">The 30-second story</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Google Maps, <span className="anim-gradient-text">but for connectivity.</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07] hover:-translate-y-1 transition duration-300">
                <div className="text-5xl font-extrabold text-white/10">0{i + 1}</div>
                <div className="w-11 h-11 -mt-6 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}22`, border: `1px solid ${s.color}55` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h3 className="mt-4 text-xl font-extrabold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* animated journey bars */}
        <Reveal delay={100}>
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Activity className="w-4 h-4" /> Watch a journey degrade — then recover
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                ['6:00 PM · Bengaluru', 'Good · 84', '#16a34a', '92%'],
                ['7:05 PM · Krishnagiri', 'Unstable · 47', '#d97706', '70%'],
                ['7:40 PM · Dharmapuri gap', 'Poor · 24', '#dc2626', '45%'],
                ['8:50 PM · Vellore', 'Fair · 68', '#0284c7', '82%']
              ].map(([label, val, color, width], i) => (
                <div key={label} className="flex items-center gap-3 text-xs">
                  <span className="w-40 shrink-0 text-slate-400 truncate">{label}</span>
                  <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                    <div className="h-full rounded-lg anim-bar flex items-center justify-end pr-2 font-bold text-[11px] text-white"
                      style={{ width, background: color, animationDelay: `${i * 0.25}s` }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* MODEL */}
      <section id="model" className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-5 py-16 grid md:grid-cols-4 gap-8 items-center">
          <Reveal className="md:col-span-1">
            <div className="flex items-center gap-2 font-extrabold text-lg"><BrainCircuit className="w-5 h-5" style={{ color: '#38f28a' }} /> Real ML inside</div>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">HistGradientBoosting on 60,000 synthetic measurements. No faked outputs — the demo route feeds the model, the model scores it.</p>
          </Reveal>
          {[
            ['R²', 0.908, 3, ''], ['MAE', 2.86, 2, ''], ['RMSE', 3.57, 2, ''], ['Segments / route', 60, 0, '']
          ].map(([label, to, dec, suffix], i) => (
            <Reveal key={label} delay={i * 100}>
              <div className="text-center rounded-2xl border border-white/10 bg-white/[0.03] py-6">
                <div className="text-3xl font-extrabold" style={{ color: '#38f28a' }}>
                  <CountUp to={to} decimals={dec} suffix={suffix} />
                </div>
                <div className="text-xs text-slate-400 mt-1 font-semibold tracking-wider">{label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 py-20 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">See the prediction <span className="anim-gradient-text">happen.</span></h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">One click loads the Bengaluru → Chennai hero demo. Press play and watch ConnectIQ warn you before the poor zone — then recover.</p>
          <button onClick={() => onLaunch()}
            className="mt-8 px-8 py-4 rounded-2xl font-extrabold text-lg text-[#0a2540] hover:brightness-110 hover:scale-[1.02] transition shadow-2xl"
            style={{ background: '#38f28a' }}>
            Launch the live demo →
          </button>
        </Reveal>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-6 text-[11px] text-slate-500 text-center">
          ConnectIQ · Nokia Shark Tank prototype · predictions from simulated measurements, not operator data
        </div>
      </footer>
    </div>
  );
}
