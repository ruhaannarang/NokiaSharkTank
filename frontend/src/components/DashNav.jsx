import { Map as MapIcon, TrendingUp, Zap, MapPin } from 'lucide-react';

/**
 * Workspace switcher: every part of the live demo opens directly —
 * no scrolling through a long page. The warning rail stays pinned
 * beside whichever panel is open.
 */
const PANELS = [
  ['map', 'Map & Journey', MapIcon, 'Route, timeline and simulation together'],
  ['trends', 'Trends', TrendingUp, 'Score over time'],
  ['actions', 'Actions', Zap, 'What to do about it']
];

export default function DashNav({ panel, setPanel, hasForecast, isStationary, poorCount }) {
  const items = isStationary
    ? [...PANELS.slice(0, 1), ['stationary', 'Stationary', MapPin, 'MSRIT forecast'], ...PANELS.slice(1)]
    : PANELS;
  return (
    <nav aria-label="Demo sections"
      className="rounded-2xl px-2 py-2 flex gap-1 overflow-x-auto border border-[#1d3a5f] shadow-[0_14px_40px_-16px_rgba(10,37,64,.6)]"
      style={{ background: 'linear-gradient(120deg,#0a2540,#14386a)' }}>
      {items.map(([key, label, Icon, hint]) => {
        const active = panel === key;
        const disabled = !hasForecast && key !== 'map' && key !== 'stationary';
        return (
          <button key={key} title={hint} disabled={disabled}
            onClick={() => setPanel(key)} aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition
              ${active ? 'text-[#0a2540]' : disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            style={active ? { background: '#38f28a', boxShadow: '0 0 20px rgba(56,242,138,.4)' } : undefined}>
            <Icon className="w-4 h-4" aria-hidden />
            {label}
            {key === 'map' && poorCount > 0 && (
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${active ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-300 border border-red-400/40'}`}>
                {poorCount} poor
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
