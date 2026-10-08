import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { STATUS_LABEL, statusColor } from '../constants.js';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-card">
      <div className="font-bold">{p.time} · {p.place}</div>
      <div>Score: <b>{p.score} / 100</b> ({STATUS_LABEL[p.status] ?? p.status})</div>
      <div>Confidence (prototype): <b>{Math.round(p.confidence * 100)}%</b></div>
    </div>
  );
}

export function ForecastChart({ segments }) {
  if (!segments) return null;
  const data = segments.filter((_, i) => i % 2 === 0).map((s) => ({
    time: s.time, score: s.quality_score, status: s.status,
    place: s.place, confidence: s.confidence
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a2540" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0a2540" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={5} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceArea y1={0} y2={30} fill="#dc2626" fillOpacity={0.08} />
          <ReferenceArea y1={31} y2={55} fill="#d97706" fillOpacity={0.08} />
          <ReferenceArea y1={76} y2={100} fill="#16a34a" fillOpacity={0.07} />
          <Area type="monotone" dataKey="score" stroke="#0a2540" strokeWidth={2.5} fill="url(#gScore)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-3 text-[11px] text-slate-500 mt-1 px-1">
        <span><i className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1" />0–30 Poor</span>
        <span><i className="inline-block w-2 h-2 rounded-full bg-amber-600 mr-1" />31–55 Unstable</span>
        <span><i className="inline-block w-2 h-2 rounded-full bg-sky-600 mr-1" />56–75 Fair</span>
        <span><i className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1" />76–100 Good</span>
      </div>
    </div>
  );
}

export function RouteTimeline({ segments, simIndex }) {
  if (!segments) return null;
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden border border-slate-200">
        {segments.map((s, i) => (
          <div key={i} className="timeline-seg h-full"
            title={`${s.time} ${s.place}: ${s.status} (${s.quality_score})`}
            style={{
              flex: 1,
              background: statusColor(s.status),
              opacity: simIndex != null && i > simIndex ? 0.35 : 1,
              borderRight: i === simIndex ? '3px solid #0a2540' : 'none'
            }} />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
        <span>{segments[0]?.time}</span>
        <span>{segments[Math.floor(segments.length / 2)]?.time}</span>
        <span>{segments[segments.length - 1]?.time}</span>
      </div>
    </div>
  );
}
