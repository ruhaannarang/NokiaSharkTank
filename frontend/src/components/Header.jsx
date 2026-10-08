import { Signal } from 'lucide-react';

const TABS = [
  ['home', 'Home'],
  ['dashboard', 'Dashboard'],
  ['insights', 'Insights'],
  ['about', 'About']
];

export default function Header({ tab, setTab, backendUp, onHome }) {
  const go = (key) => {
    if (key === 'home') { onHome?.(); return; }
    setTab(key);
  };
  return (
    <header className="sticky top-0 z-50 text-white shadow-[0_10px_40px_-10px_rgba(10,37,64,.6)]" style={{ background: 'linear-gradient(120deg,#071c33,#0a2540 45%,#14467e)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={() => onHome?.()} aria-label="Back to home"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:brightness-110 transition" style={{ background: '#38f28a' }}>
          <Signal className="w-5 h-5 text-ink" />
        </button>
        <div>
          <div className="font-extrabold tracking-wide text-lg leading-none">CONNECTIQ</div>
          <div className="text-[12px] text-slate-300">Predict your connectivity before it changes.</div>
        </div>
        <nav className="ml-6 hidden md:flex gap-1 text-sm rounded-full border border-white/10 bg-white/5 p-1" aria-label="Primary">
          {TABS.map(([key, label]) => {
            const isActive = key === tab;
            return (
              <button key={key} onClick={() => go(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-1.5 rounded-full capitalize transition font-semibold ${isActive ? 'text-[#0a2540]' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                style={isActive ? { background: '#38f28a', boxShadow: '0 0 18px rgba(56,242,138,.45)' } : undefined}>
                {label}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span role="status"
            className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${backendUp === false ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-emerald-500/15 border-emerald-400 text-emerald-200'}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" aria-hidden />
            {backendUp === false ? 'Demo Data Mode' : 'Prototype Mode'}
          </span>
        </div>
      </div>
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#38f28a 30%,#7dd3fc 60%,transparent)' }} aria-hidden />
    </header>
  );
}
