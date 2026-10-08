export default function ContextPanel({ segment, reliability }) {
  const rows = segment ? [
    ['📍 Location', segment.place],
    ['🕐 Time', segment.time],
    ['🚆 Speed', `${segment.speed} km/h`],
    ['📡 Tower distance', `${segment.tower_distance} km`],
    ['📊 Estimated network load', `${segment.network_load}%`],
    ['🌦 Weather', segment.weather_factor > 0.93 ? 'Clear' : segment.weather_factor > 0.85 ? 'Cloudy' : 'Rain'],
    ['👥 Event/crowding', segment.event_density > 0.5 ? 'High' : segment.event_density > 0.3 ? 'Medium' : 'Low']
  ] : [];
  return (
    <div className="bg-white rounded-2xl shadow-card border p-5 anim-in h-full">
      <div className="eyebrow">Signals</div>
      <h3 className="section-title mb-3">Context</h3>
      {segment ? (
        <div className="text-sm space-y-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">{k}</span><b>{v}</b>
            </div>
          ))}
        </div>
      ) : <div className="text-sm text-slate-400">No context yet.</div>}
      {reliability && (
        <div className="mt-3 text-xs">
          <div className="font-bold mb-1">COMMUNICATION RELIABILITY</div>
          {[['📞 Voice', reliability.voice], ['🎥 Video', reliability.video], ['💬 Text', reliability.text]].map(([k, v]) => (
            <div key={k} className="flex justify-between"><span>{k}</span><b>{v}%</b></div>
          ))}
          <div className="text-slate-500 mt-1">Text messaging is currently the most reliable method.</div>
        </div>
      )}
    </div>
  );
}
