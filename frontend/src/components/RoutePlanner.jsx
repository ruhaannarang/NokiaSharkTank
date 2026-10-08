import { Navigation, MapPin } from 'lucide-react';

export default function RoutePlanner({
  mode, setMode, origin, setOrigin, destination, setDestination,
  departure, setDeparture, transport, setTransport, loading, runForecast
}) {
  return (
    <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 anim-in" aria-label="Route planner">
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="w-4 h-4 text-ink" aria-hidden />
        <h2 className="font-bold text-ink">Where are you going?</h2>
        <div className="ml-auto flex bg-slate-100 rounded-lg p-0.5 text-xs" role="tablist" aria-label="Travel mode">
          <button role="tab" aria-selected={mode === 'moving'} onClick={() => setMode('moving')}
            className={`px-3 py-1 rounded-md ${mode === 'moving' ? 'bg-white shadow font-bold' : 'text-slate-500'}`}>Moving</button>
          <button role="tab" aria-selected={mode === 'stationary'} onClick={() => setMode('stationary')}
            className={`px-3 py-1 rounded-md ${mode === 'stationary' ? 'bg-white shadow font-bold' : 'text-slate-500'}`}>Stationary</button>
        </div>
      </div>
      {mode === 'moving' ? (
        <div className="grid md:grid-cols-5 gap-3">
          <label className="text-xs font-semibold text-slate-500">ORIGIN
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} aria-label="Origin"
              className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 focus:ring-2 focus:ring-ink outline-none" />
          </label>
          <label className="text-xs font-semibold text-slate-500">DESTINATION
            <input value={destination} onChange={(e) => setDestination(e.target.value)} aria-label="Destination"
              className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 focus:ring-2 focus:ring-ink outline-none" />
          </label>
          <label className="text-xs font-semibold text-slate-500">DATE / TIME
            <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} aria-label="Departure time"
              className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 outline-none" />
          </label>
          <label className="text-xs font-semibold text-slate-500">TRANSPORT
            <select value={transport} onChange={(e) => setTransport(e.target.value)} aria-label="Transport mode"
              className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 outline-none">
              <option value="train">Train</option><option value="car">Car</option><option value="bus">Bus</option>
            </select>
          </label>
          <button onClick={runForecast} disabled={loading}
            className="mt-5 rounded-xl text-white font-bold text-sm py-2.5 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>
            {loading ? 'Predicting…' : 'Predict My Connectivity'}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2 text-sm border rounded-xl px-3 py-2.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ink" aria-hidden /> MS Ramaiah Institute of Technology
            <span className="text-slate-400 text-xs ml-auto">13.0337, 77.5649</span>
          </div>
          <label className="text-xs font-semibold text-slate-500">TIME
            <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} aria-label="Forecast time"
              className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 outline-none" />
          </label>
          <button onClick={runForecast} disabled={loading}
            className="mt-5 rounded-xl text-white font-bold text-sm py-2.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>
            {loading ? 'Predicting…' : 'Predict My Connectivity'}
          </button>
        </div>
      )}
    </section>
  );
}
