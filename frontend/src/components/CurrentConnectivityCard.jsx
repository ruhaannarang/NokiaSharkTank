import { Wifi } from 'lucide-react';
import { statusColor, statusBg, STATUS_LABEL } from '../constants.js';

export default function CurrentConnectivityCard({ segment }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
      <div className="text-xs font-bold text-slate-400 tracking-wider">CURRENT CONNECTIVITY</div>
      {segment ? (
        <>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-extrabold num-pop" style={{ color: statusColor(segment.status) }}>
              {Math.round(segment.quality_score)}
            </span>
            <span className="text-slate-400 mb-1">/ 100</span>
            <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full border ${statusBg(segment.status)}`}>
              {STATUS_LABEL[segment.status].toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            {[['Signal', `${segment.signal_strength} dBm`], ['Latency', `${segment.latency} ms`],
              ['Throughput', `${segment.throughput} Mbps`],
              ['Confidence', `${Math.round(segment.confidence * 100)}%`]].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border rounded-xl px-3 py-2">
                <div className="text-[11px] text-slate-400">{k}</div><div className="font-bold">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Wifi className="w-3 h-3" aria-hidden /> Network: 5G · {segment.place} · {segment.time} · {segment.speed} km/h
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400 mt-2">Run a forecast to see live metrics.</div>
      )}
    </div>
  );
}
