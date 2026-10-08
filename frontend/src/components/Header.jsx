import { Signal } from 'lucide-react';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['route', 'Route Forecast'],
  ['insights', 'Insights'],
  ['about', 'About']
];

export default function Header({ tab, setTab, backendUp }) {
  const active = tab === 'dashboard' ? 'dashboard' : tab;
  return (
    <header className="sticky top-0 z-50 text-white shadow-lg" style={{ background: 'linear-gradient(120deg,#0a2540,#123a63)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#38f28a' }} aria-hidden>
          <Signal className="w-5 h-5 text-ink" />
        </div>
        <div>
          <div className="font-extrabold tracking-wide text-lg leading-none">CONNECTIQ</div>
          <div className="text-[12px] text-slate-300">Predict your connectivity before it changes.</div>
        </div>
        <nav className="ml-6 hidden md:flex gap-1 text-sm" aria-label="Primary">
          {TABS.map(([key, label]) => {
            const isActive = key === active || (key === 'route' && active === 'dashboard');
            return (
              <button key={key} onClick={() => setTab(key === 'route' ? 'dashboard' : key)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
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
    </header>
  );
}
