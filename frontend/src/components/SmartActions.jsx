import { Activity, Video, Download, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

function iconFor(icon) {
  if (icon === 'video') return <Video className="w-4 h-4" aria-hidden />;
  if (icon === 'download') return <Download className="w-4 h-4" aria-hidden />;
  if (icon === 'message') return <MessageSquare className="w-4 h-4" aria-hidden />;
  if (icon === 'alert') return <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden />;
  return <CheckCircle className="w-4 h-4 text-green-600" aria-hidden />;
}

export default function SmartActions({ actions }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
      <h3 className="font-bold text-ink text-sm mb-2 flex items-center gap-1">
        <Activity className="w-4 h-4" aria-hidden /> SMART ACTIONS
      </h3>
      <div className="space-y-2">
        {actions.map((r, i) => (
          <div key={i} className="border rounded-xl p-3 bg-slate-50">
            <div className="text-sm font-bold flex items-center gap-1.5">{iconFor(r.icon)}{r.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{r.body}</div>
            <button className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-white hover:opacity-90">
              [ {r.action} ]
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
