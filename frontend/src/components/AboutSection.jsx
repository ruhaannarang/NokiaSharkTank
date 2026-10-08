export default function AboutSection() {
  return (
    <div className="bg-white rounded-2xl shadow-card border p-6 anim-in max-w-3xl">
      <h2 className="text-xl font-bold text-ink">Predictive Connectivity Intelligence</h2>
      <p className="text-slate-600 mt-2 text-sm leading-relaxed">
        Don&apos;t wait for your network to fail. Know when it will — and act before it does.
        ConnectIQ predicts future network quality along your route using location, time, speed,
        historical patterns, estimated load, tower characteristics and context — then warns you
        <b> before </b> the bad stretch and recommends an action.</p>
      <h3 className="font-bold text-ink text-sm mt-4">How it works</h3>
      <ol className="text-sm text-slate-600 mt-1 list-decimal ml-5 space-y-1">
        <li>Route scenario provides contextual conditions (load, tower distance, history…).</li>
        <li>ML model predicts a connectivity score per segment.</li>
        <li>Forecast groups weak segments into poor zones with distance + duration.</li>
        <li>Smart recommendations turn the prediction into action.</li>
        <li>Journey simulation shows the warning happening before the zone.</li>
      </ol>
      <ul className="text-sm text-slate-600 mt-3 list-disc ml-5 space-y-1">
        <li>ML model (HistGradientBoosting) trained on 60,000 synthetic measurements.</li>
        <li>FastAPI backend: /api/predict, /api/route-forecast, /api/simulate, /api/stationary-forecast, /api/model-info.</li>
        <li>Leaflet + OpenStreetMap route colored green / amber / red. Recharts forecast.</li>
        <li>All data is <b>synthetic</b> — architected so real operator data can be plugged in later.</li>
      </ul>
    </div>
  );
}
