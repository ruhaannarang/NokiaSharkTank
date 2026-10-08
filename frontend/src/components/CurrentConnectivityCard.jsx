import { Wifi } from 'lucide-react';
import { statusColor, statusBg, STATUS_LABEL } from '../constants.js';

const R = 40;
const CIRC = 2 * Math.PI * R;

export default function CurrentConnectivityCard({ segment }) {
  const score = segment ? Math.round(segment.quality_score) : 0;
  const color = segment ? statusColor(segment.status) : '#cbd5e1';
  return (
    <div className="bg-white rounded-2xl shadow-card border p-5 anim-in">
      <div className="eyebrow">Now</div>
      <h3 className="section-title">Current connectivity</h3>
      {segment ? (
        <>
          <div className="flex items-center gap-4 mt-3">
            <div className="relative shrink-0" role="img" aria-label={`Connectivity score ${score} out of 100, ${STATUS_LABEL[segment.status]}`}>
              <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90">
                <circle cx="52" cy="52" r={R} fill="none" stroke="#eef2f7" strokeWidth="11" />
                <circle cx="52" cy="52" r={R} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
                  className="gauge-arc" strokeDasharray={CIRC} strokeDashoffset={CIRC - (CIRC * score) / 100}
                  style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold num-pop leading-none" style={{ color }}>{score}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="min-w-0">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${statusBg(segment.status)}`}>
                {STATUS_LABEL[segment.status].toUpperCase()}
              </span>
              <div className="mt-1.5 text-sm font-semibold text-slate-700">{segment.place}</div>
              <div className="text-xs text-slate-400">{segment.time} · confidence {Math.round(segment.confidence * 100)}%</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
            {[['Signal', `${segment.signal_strength} dBm`], ['Latency', `${segment.latency} ms`], ['Throughput', `${segment.throughput} Mbps`]].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{k}</div>
                <div className="font-bold text-[13px]">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center gap-1">
            <Wifi className="w-3 h-3" aria-hidden /> Network: 5G · {segment.speed} km/h
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400 mt-3">Run a forecast to see live metrics.</div>
      )}
    </div>
  );
}
