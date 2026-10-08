import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import {
  Signal, MapPin, Train, Play, Pause, RotateCcw, AlertTriangle, Download,
  MessageSquare, Video, CheckCircle, Navigation, Clock, Activity, Info, Sparkles, Wifi
} from 'lucide-react';
import RouteMap from './components/RouteMap.jsx';
import { ForecastChart, RouteTimeline } from './components/Charts.jsx';
import { api, statusColor, statusBg } from './api.js';

/* ---------- offline fallback forecast (mirrors backend zone profile) ---------- */
function heuristicScore(tower, load, hist, weather, event) {
  const towerComp = 100 * Math.exp(-tower / 1.2);
  return Math.max(4, Math.min(98, 0.30 * hist + 0.28 * (100 - load) + 0.22 * towerComp + 0.10 * weather * 100 - event * 8));
}
function toStatus(s) { return s <= 30 ? 'poor' : s <= 55 ? 'unstable' : s <= 75 ? 'fair' : 'good'; }
const WAYPOINTS = [
  ['Bengaluru', 12.9716, 77.5946], ['Hosur', 12.7402, 77.8253], ['Krishnagiri', 12.5186, 78.2137],
  ['Dharmapuri', 12.1211, 78.1582], ['Salem', 11.6643, 78.1460], ['Attur', 11.60, 78.60],
  ['Vellore', 12.9165, 79.1325], ['Chennai', 13.0827, 80.2707]
];
function zoneProfile(t) {
  if (t < 0.16) return [0.35, 28, 90, 0.12, 1.0];
  if (t < 0.30) return [0.7, 45, 78, 0.25, 0.97];
  if (t < 0.42) return [1.5, 68, 58, 0.45, 0.90];
  if (t < 0.58) return [2.6, 88, 38, 0.70, 0.82];
  if (t < 0.68) return [1.7, 72, 52, 0.55, 0.88];
  if (t < 0.82) return [0.9, 50, 72, 0.30, 0.95];
  return [0.4, 30, 88, 0.15, 1.0];
}
function fallbackForecast(departure = '18:00', mode = 'train') {
  const N = 60;
  // linear interp through waypoints (approx by index)
  const pts = [];
  for (let k = 0; k < N; k++) {
    const f = k / (N - 1) * (WAYPOINTS.length - 1);
    const i = Math.min(WAYPOINTS.length - 2, Math.floor(f));
    const r = f - i;
    const lat = WAYPOINTS[i][1] + r * (WAYPOINTS[i + 1][1] - WAYPOINTS[i][1]);
    const lon = WAYPOINTS[i][2] + r * (WAYPOINTS[i + 1][2] - WAYPOINTS[i][2]);
    pts.push([lat, lon, r < 0.5 ? WAYPOINTS[i][0] : WAYPOINTS[i + 1][0]]);
  }
  const speed = { train: 85, car: 65, bus: 55 }[mode] || 85;
  const totalKm = 512, totalMin = Math.round(totalKm / speed * 60);
  const [dh, dm] = departure.split(':').map(Number);
  const perMin = totalMin / N;
  const segments = pts.map(([lat, lon, place], i) => {
    const t = i / (N - 1);
    const [tower, load, hist, event, weather] = zoneProfile(t);
    const mins = perMin * i;
    const d = new Date(); d.setHours(dh, dm, 0, 0); d.setMinutes(d.getMinutes() + mins);
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    const score = Math.round(heuristicScore(tower, load, hist, weather, event) * 10) / 10;
    return {
      segment: i, latitude: +lat.toFixed(5), longitude: +lon.toFixed(5), place, time: `${hh}:${mm}`,
      speed, tower_distance: tower, network_load: load, historical_quality: hist,
      weather_factor: weather, event_density: event, quality_score: score, status: toStatus(score),
      confidence: 0.85, signal_strength: Math.round((-50 - (100 - score) * 0.62) * 10) / 10,
      latency: Math.round((14 + (100 - score) * 1.75) * 10) / 10,
      throughput: Math.round(Math.max(0.4, (score / 100) ** 2 * 85) * 10) / 10
    };
  });
  const good = Math.round(segments.filter(s => s.status === 'good' || s.status === 'fair').length * perMin);
  const unst = Math.round(segments.filter(s => s.status === 'unstable').length * perMin);
  const poor = Math.round(segments.filter(s => s.status === 'poor').length * perMin);
  // poor zones
  const zones = []; let i = 0;
  while (i < N) {
    if (segments[i].status === 'poor') {
      let j = i;
      while (j + 1 < N && segments[j + 1].status === 'poor') j++;
      zones.push({ start_segment: i, end_segment: j, start_time: segments[i].time, end_time: segments[j].time, duration_min: Math.max(2, Math.round((j - i + 1) * perMin)), cause: 'High network load + weak tower coverage', confidence: 0.89 });
      i = j + 1;
    } else i++;
  }
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return {
    origin: 'Bengaluru', destination: 'Chennai', departure_time: departure, transport_mode: mode,
    total_km: totalKm, total_min: totalMin, total_label: `${h}h ${String(m).padStart(2, '0')}m`,
    good_min: good, unstable_min: unst, poor_min: poor, fair_min: 0,
    route: segments.map(s => [s.latitude, s.longitude]), segments, poor_zones: zones,
    warnings: zones.map(z => `Poor connectivity predicted near ${segments[z.start_segment].place} (${z.start_time}–${z.end_time}, ~${z.duration_min} min).`),
    recommendations: [{ icon: 'download', title: 'Download important files now', body: 'Poor connectivity expected. Save offline copies before entering this zone.', action: 'Prepare Offline' }],
    fallback: true
  };
}

const LOADING_STEPS = ['Loading historical patterns', 'Estimating network load', 'Predicting route quality', 'Generating recommendations'];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [mode, setMode] = useState('moving'); // moving | stationary
  const [origin, setOrigin] = useState('Bengaluru');
  const [destination, setDestination] = useState('Chennai');
  const [departure, setDeparture] = useState('18:00');
  const [transport, setTransport] = useState('train');
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [forecast, setForecast] = useState(null);
  const [backendUp, setBackendUp] = useState(null);
  const [stationary, setStationary] = useState(null);
  const [current, setCurrent] = useState(null);
  // simulation
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [simMsg, setSimMsg] = useState('');
  const [simSpeed, setSimSpeed] = useState(1);
  const timer = useRef(null);

  useEffect(() => {
    api.health().then(() => setBackendUp(true)).catch(() => setBackendUp(false));
  }, []);

  const simIndex = useMemo(() => {
    if (!forecast) return null;
    return Math.max(0, Math.min(forecast.segments.length - 1, Math.floor(progress * (forecast.segments.length - 1))));
  }, [forecast, progress]);

  const curSeg = simIndex != null && forecast ? forecast.segments[simIndex] : null;

  const nextPoor = useMemo(() => {
    if (!forecast || simIndex == null) return null;
    for (const z of forecast.poor_zones) {
      if (z.end_segment >= simIndex) {
        const ahead = Math.max(0, z.start_segment - simIndex);
        const km = Math.round(ahead * (forecast.total_km / forecast.segments.length) * 10) / 10;
        return { ...z, segments_ahead: ahead, km_ahead: km };
      }
    }
    return null;
  }, [forecast, simIndex]);

  // simulation ticker
  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setProgress((p) => {
          const np = p + 0.004 * simSpeed;
          if (np >= 1) { setPlaying(false); return 1; }
          return np;
        });
      }, 150);
    }
    return () => clearInterval(timer.current);
  }, [playing, simSpeed]);

  // simulation message
  useEffect(() => {
    if (!forecast || simIndex == null) return;
    const s = forecast.segments[simIndex];
    if (s.status === 'poor') setSimMsg('Entering predicted poor connectivity zone.');
    else if (nextPoor) setSimMsg(`Poor connectivity predicted ${nextPoor.km_ahead} km ahead.`);
    else if (forecast.segments.slice(0, simIndex).some(x => x.status === 'poor')) setSimMsg('Connectivity recovered.');
    else setSimMsg('Connectivity looks good.');
  }, [simIndex, forecast, nextPoor]);

  async function runForecast() {
    setLoading(true); setLoadStep(0);
    const stepTimer = setInterval(() => setLoadStep((s) => Math.min(s + 1, LOADING_STEPS.length)), 550);
    try {
      const body = { origin, destination, departure_time: departure, transport_mode: transport, day_of_week: 4 };
      const data = await api.routeForecast(body);
      setForecast(data);
      setProgress(0); setPlaying(false);
    } catch (e) {
      const fb = fallbackForecast(departure, transport);
      setForecast(fb);
      setProgress(0); setPlaying(false);
    }
    // stationary + current in parallel (best effort)
    try {
      const [st, cu] = await Promise.all([
        api.stationary(13.0337, 77.5649, parseInt(departure.split(':')[0])).catch(() => null),
        api.current(13.0337, 77.5649, parseInt(departure.split(':')[0])).catch(() => null)
      ]);
      if (st) setStationary(st);
      if (cu) setCurrent(cu);
    } catch { /* ignore */ }
    clearInterval(stepTimer);
    setLoading(false);
  }

  function loadScenario(n) {
    if (n === 1) { setMode('moving'); setOrigin('Bengaluru'); setDestination('Chennai'); setDeparture('18:00'); setTransport('train'); }
    if (n === 2) { setMode('stationary'); setDeparture('18:00'); }
    if (n === 3) { setMode('moving'); setOrigin('Bengaluru'); setDestination('Chennai'); setDeparture('19:00'); setTransport('train'); }
    setTimeout(runForecast, 50);
  }

  const smartActions = useMemo(() => {
    if (!forecast) return [];
    const acts = [...(forecast.recommendations || [])];
    // video-call scenario card
    acts.push({ icon: 'video', title: 'Your 7:15 PM video call may be unstable', body: 'Recommended: switch to audio-only for the weak stretch.', action: 'Switch Recommendation' });
    if (nextPoor) acts.unshift({ icon: 'alert', title: `Connectivity degrades near ${forecast.segments[nextPoor.start_segment]?.place}`, body: `Download important files now — poor zone in ~${nextPoor.km_ahead} km.`, action: 'Prepare Offline' });
    return acts.slice(0, 4);
  }, [forecast, nextPoor]);

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-ink text-white shadow-lg" style={{ background: 'linear-gradient(120deg,#0a2540,#123a63)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#38f28a' }}>
            <Signal className="w-5 h-5 text-ink" />
          </div>
          <div>
            <div className="font-extrabold tracking-wide text-lg leading-none">CONNECTIQ</div>
            <div className="text-[12px] text-slate-300">Predict your connectivity before it changes.</div>
          </div>
          <nav className="ml-6 hidden md:flex gap-1 text-sm">
            {['dashboard', 'route', 'insights', 'about'].map((t) => (
              <button key={t} onClick={() => setTab(t === 'route' ? 'dashboard' : t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${tab === t || (t === 'route' && tab === 'dashboard') ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
                {t === 'route' ? 'Route Forecast' : t}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${backendUp === false ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-emerald-500/15 border-emerald-400 text-emerald-200'}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {backendUp === false ? 'Demo Data Mode' : 'Prototype Mode'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* DEMO MODE */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 flex flex-wrap items-center gap-2 anim-in">
          <span className="text-xs font-bold px-2 py-1 rounded bg-ink text-white flex items-center gap-1"><Sparkles className="w-3 h-3" /> DEMO MODE</span>
          <button onClick={() => loadScenario(1)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700">Scenario 1: Bengaluru → Chennai · 6 PM</button>
          <button onClick={() => loadScenario(2)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 border hover:bg-slate-200">Scenario 2: Stationary @ MSRIT</button>
          <button onClick={() => loadScenario(3)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 border hover:bg-slate-200">Scenario 3: Video call @ 7:15 PM</button>
          <span className="ml-auto text-[11px] text-slate-400 hidden lg:block">Prototype prediction based on simulated/historical network measurements.</span>
        </div>

        {tab === 'about' && (
          <div className="bg-white rounded-2xl shadow-card border p-6 anim-in max-w-3xl">
            <h2 className="text-xl font-bold text-ink">Predictive Connectivity Intelligence</h2>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Don't wait for your network to fail. Know when it will — and act before it does.
              ConnectIQ predicts future network quality along your route using location, time, speed,
              historical patterns, estimated load, tower characteristics and context — then warns you
              <b> before </b> the bad stretch and recommends an action.</p>
            <ul className="text-sm text-slate-600 mt-3 list-disc ml-5 space-y-1">
              <li>ML model (HistGradientBoosting) trained on 60,000 synthetic measurements (R² ≈ 0.91).</li>
              <li>FastAPI backend: /api/predict, /api/route-forecast, /api/simulate, /api/stationary-forecast.</li>
              <li>Leaflet + OpenStreetMap route colored green / amber / red. Recharts forecast.</li>
              <li>All data is <b>synthetic</b> — architected so real operator data can be plugged in later.</li>
            </ul>
          </div>
        )}

        {(tab === 'dashboard') && (
          <>
            {/* WHERE ARE YOU GOING */}
            <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 anim-in">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-ink" />
                <h2 className="font-bold text-ink">Where are you going?</h2>
                <div className="ml-auto flex bg-slate-100 rounded-lg p-0.5 text-xs">
                  <button onClick={() => setMode('moving')} className={`px-3 py-1 rounded-md ${mode === 'moving' ? 'bg-white shadow font-bold' : 'text-slate-500'}`}>Moving</button>
                  <button onClick={() => setMode('stationary')} className={`px-3 py-1 rounded-md ${mode === 'stationary' ? 'bg-white shadow font-bold' : 'text-slate-500'}`}>Stationary</button>
                </div>
              </div>
              {mode === 'moving' ? (
                <div className="grid md:grid-cols-5 gap-3">
                  <label className="text-xs font-semibold text-slate-500">ORIGIN
                    <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 focus:ring-2 focus:ring-ink outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-500">DESTINATION
                    <input value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 focus:ring-2 focus:ring-ink outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-500">DATE / TIME
                    <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-500">TRANSPORT
                    <select value={transport} onChange={(e) => setTransport(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 outline-none">
                      <option value="train">Train</option><option value="car">Car</option><option value="bus">Bus</option>
                    </select>
                  </label>
                  <button onClick={runForecast} disabled={loading}
                    className="mt-5 rounded-xl bg-ink text-white font-bold text-sm py-2.5 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>
                    {loading ? 'Predicting…' : 'Predict My Connectivity'}
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="md:col-span-2 text-sm border rounded-xl px-3 py-2.5 flex items-center gap-2"><MapPin className="w-4 h-4 text-ink" /> MS Ramaiah Institute of Technology <span className="text-slate-400 text-xs ml-auto">13.0337, 77.5649</span></div>
                  <label className="text-xs font-semibold text-slate-500">TIME
                    <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm font-normal text-slate-900 outline-none" />
                  </label>
                  <button onClick={runForecast} disabled={loading} className="mt-5 rounded-xl text-white font-bold text-sm py-2.5" style={{ background: 'linear-gradient(120deg,#0a2540,#1d5cab)' }}>{loading ? 'Predicting…' : 'Predict My Connectivity'}</button>
                </div>
              )}
              {loading && (
                <div className="mt-4 bg-slate-50 border rounded-xl p-4 text-sm">
                  <div className="font-bold text-ink mb-2">Analyzing route…</div>
                  {LOADING_STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 text-slate-600 py-0.5">
                      {i < loadStep ? <CheckCircle className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-300 animate-spin border-t-ink" />}
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* MAP + SIDE */}
            <section className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="anim-in"><RouteMap forecast={forecast} simIndex={simIndex} /></div>
                {forecast && (
                  <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-ink text-sm">Personal Connectivity Route <span className="text-slate-400 font-normal">{forecast.origin} → {forecast.destination} · {forecast.total_label} · {forecast.total_km} km</span></h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="rounded-xl bg-green-50 border border-green-200 py-2"><div className="text-[11px] text-green-700 font-bold">GOOD</div><div className="font-extrabold text-green-800">{Math.floor(forecast.good_min / 60)}h {forecast.good_min % 60}m</div></div>
                      <div className="rounded-xl bg-amber-50 border border-amber-200 py-2"><div className="text-[11px] text-amber-700 font-bold">UNSTABLE</div><div className="font-extrabold text-amber-800">{Math.floor(forecast.unstable_min / 60)}h {forecast.unstable_min % 60}m</div></div>
                      <div className="rounded-xl bg-red-50 border border-red-200 py-2"><div className="text-[11px] text-red-700 font-bold">POOR</div><div className="font-extrabold text-red-800">{Math.floor(forecast.poor_min / 60)}h {forecast.poor_min % 60}m</div></div>
                    </div>
                    <RouteTimeline segments={forecast.segments} simIndex={simIndex} />
                    {/* simulation controls */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 bg-slate-50 border rounded-xl p-3">
                      <button onClick={() => setPlaying(!playing)} disabled={!forecast}
                        className="px-4 py-2 rounded-xl bg-ink text-white text-sm font-bold flex items-center gap-2 hover:opacity-90">
                        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {playing ? 'Pause' : 'Start Journey Simulation'}
                      </button>
                      <button onClick={() => { setPlaying(false); setProgress(0); }} className="px-3 py-2 rounded-xl border bg-white text-sm flex items-center gap-1"><RotateCcw className="w-4 h-4" /> Reset</button>
                      <input type="range" min="0" max="1000" value={Math.round(progress * 1000)} onChange={(e) => setProgress(e.target.value / 1000)} className="flex-1 min-w-[140px]" />
                      <select value={simSpeed} onChange={(e) => setSimSpeed(+e.target.value)} className="text-xs border rounded-lg px-2 py-1.5">
                        <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
                      </select>
                      <span className="text-xs text-slate-500 w-24 text-right">{Math.round(progress * 100)}% · {curSeg?.place} {curSeg?.time}</span>
                    </div>
                    {simMsg && (
                      <div className={`mt-2 text-sm px-3 py-2 rounded-xl border font-medium anim-in ${curSeg?.status === 'poor' ? 'bg-red-50 border-red-200 text-red-800 alert-pulse' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
                        {simMsg}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">
                {nextPoor && forecast && (
                  <div className="bg-white rounded-2xl shadow-card border-2 border-red-200 p-4 anim-in alert-pulse">
                    <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm"><AlertTriangle className="w-4 h-4" /> Connectivity degradation predicted</div>
                    <div className="mt-2 text-sm space-y-1">
                      <div>Poor connectivity predicted: <b>{nextPoor.km_ahead} km ahead</b></div>
                      <div>Expected duration: <b>{nextPoor.duration_min} minutes</b> ({nextPoor.start_time}–{nextPoor.end_time})</div>
                      <div>Confidence: <b>{Math.round(nextPoor.confidence * 100)}%</b></div>
                      <div>Expected cause: <b>{nextPoor.cause}</b></div>
                      <div className="bg-red-50 rounded-lg p-2 mt-1">Recommended action: <b>Download important files before entering this zone.</b></div>
                    </div>
                  </div>
                )}
                {/* current connectivity */}
                <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                  <div className="text-xs font-bold text-slate-400 tracking-wider">CURRENT CONNECTIVITY</div>
                  {curSeg ? (
                    <>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-extrabold num-pop" style={{ color: statusColor(curSeg.status) }}>{Math.round(curSeg.quality_score)}</span>
                        <span className="text-slate-400 mb-1">/ 100</span>
                        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full border ${statusBg(curSeg.status)}`}>{curSeg.status.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        {[['Signal', `${curSeg.signal_strength} dBm`], ['Latency', `${curSeg.latency} ms`], ['Throughput', `${curSeg.throughput} Mbps`], ['Confidence', `${Math.round(curSeg.confidence * 100)}%`]].map(([k, v]) => (
                          <div key={k} className="bg-slate-50 border rounded-xl px-3 py-2"><div className="text-[11px] text-slate-400">{k}</div><div className="font-bold">{v}</div></div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1"><Wifi className="w-3 h-3" /> Network: 5G · {curSeg.place} · {curSeg.time} · {curSeg.speed} km/h</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 mt-2">Run a forecast to see live metrics.</div>
                  )}
                </div>
                {/* next 3 hours */}
                {forecast && (
                  <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                    <div className="text-xs font-bold text-slate-400 tracking-wider mb-2">FUTURE FORECAST · NEXT 3 HOURS</div>
                    <ForecastChart segments={forecast.segments} />
                  </div>
                )}
              </div>
            </section>

            {/* LOWER GRID */}
            {forecast && (
              <section className="grid lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                  <h3 className="font-bold text-ink text-sm mb-2 flex items-center gap-1"><Activity className="w-4 h-4" /> SMART ACTIONS</h3>
                  <div className="space-y-2">
                    {smartActions.map((r, i) => (
                      <div key={i} className="border rounded-xl p-3 bg-slate-50">
                        <div className="text-sm font-bold flex items-center gap-1.5">
                          {r.icon === 'video' ? <Video className="w-4 h-4" /> : r.icon === 'download' ? <Download className="w-4 h-4" /> : r.icon === 'message' ? <MessageSquare className="w-4 h-4" /> : r.icon === 'alert' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                          {r.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{r.body}</div>
                        <button className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-white hover:opacity-90">[ {r.action} ]</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                  <h3 className="font-bold text-ink text-sm mb-2">WHY THIS PREDICTION?</h3>
                  {curSeg ? (
                    <>
                      {[['Network load', curSeg.network_load, 100], ['Tower distance', Math.min(100, curSeg.tower_distance / 3 * 100), 100], ['Historical quality', curSeg.historical_quality, 100], ['Movement density', curSeg.event_density * 100, 100]].map(([k, v]) => (
                        <div key={k} className="mb-2">
                          <div className="flex justify-between text-xs"><span className="text-slate-500">{k}</span><span className="font-bold">{Math.round(v)}%</span></div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: 'linear-gradient(90deg,#0a2540,#1d5cab)' }} /></div>
                        </div>
                      ))}
                      <div className="text-2xl font-extrabold mt-1">{Math.round(curSeg.quality_score)} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
                      <p className="text-xs text-slate-500 mt-1">High expected network load combined with weak tower availability and historically lower reliability in this segment.</p>
                    </>
                  ) : <div className="text-sm text-slate-400">No segment selected.</div>}
                </div>
                <div className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                  <h3 className="font-bold text-ink text-sm mb-2">CONTEXT</h3>
                  {curSeg ? (
                    <div className="text-sm space-y-1.5">
                      {[['📍 Location', curSeg.place], ['🕐 Time', curSeg.time], ['🚆 Speed', `${curSeg.speed} km/h`], ['📡 Tower distance', `${curSeg.tower_distance} km`], ['📊 Estimated network load', `${curSeg.network_load}%`], ['🌦 Weather', curSeg.weather_factor > 0.93 ? 'Clear' : curSeg.weather_factor > 0.85 ? 'Cloudy' : 'Rain'], ['👥 Event/crowding', curSeg.event_density > 0.5 ? 'High' : curSeg.event_density > 0.3 ? 'Medium' : 'Low']].map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">{k}</span><b>{v}</b></div>
                      ))}
                    </div>
                  ) : <div className="text-sm text-slate-400">No context yet.</div>}
                  {current?.reliability && (
                    <div className="mt-3 text-xs">
                      <div className="font-bold mb-1">COMMUNICATION RELIABILITY</div>
                      {[['📞 Voice', current.reliability.voice], ['🎥 Video', current.reliability.video], ['💬 Text', current.reliability.text]].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span>{k}</span><b>{v}%</b></div>
                      ))}
                      <div className="text-slate-500 mt-1">Text messaging is currently the most reliable method.</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* stationary panel */}
            {mode === 'stationary' && (
              <section className="bg-white rounded-2xl shadow-card border p-4 anim-in">
                <h3 className="font-bold text-ink text-sm">STATIONARY FORECAST · MS Ramaiah Institute of Technology</h3>
                {stationary ? (
                  <>
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                      {stationary.points.map((p, i) => (
                        <div key={i} className={`min-w-[110px] border rounded-xl p-2 text-center ${statusBg(p.status)}`}>
                          <div className="text-[11px] font-bold">{p.time}</div>
                          <div className="text-lg">{p.status === 'good' ? '🟢' : p.status === 'fair' ? '🔵' : p.status === 'unstable' ? '🟡' : '🔴'}</div>
                          <div className="text-xs font-bold capitalize">{p.status}</div>
                          <div className="text-[11px]">{Math.round(p.connectivity_score)}</div>
                        </div>
                      ))}
                    </div>
                    {stationary.alert && <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded-xl p-2">⚠ Poor connectivity predicted between {stationary.alert.start} and {stationary.alert.end}. Cause: {stationary.alert.cause}</div>}
                  </>
                ) : <div className="text-sm text-slate-400 mt-2">Run a forecast to load the stationary prediction.</div>}
              </section>
            )}
          </>
        )}

        {tab === 'insights' && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-card border p-4">
              <h3 className="font-bold text-ink text-sm mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> MODEL PERFORMANCE</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['MAE', '2.86'], ['RMSE', '3.58'], ['R²', '0.908']].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 border rounded-xl py-3"><div className="text-[11px] text-slate-400">{k}</div><div className="text-xl font-extrabold text-ink">{v}</div></div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2 flex gap-1"><Info className="w-3 h-3 mt-0.5" /> HistGradientBoostingRegressor · 60,000 synthetic rows · status accuracy ≈ 87%. Confidence shown in UI is a transparent prototype heuristic (sample density + model error), not a calibrated probability.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-card border p-4">
              <h3 className="font-bold text-ink text-sm mb-2">THRESHOLDS</h3>
              <div className="space-y-2 text-sm">
                {[['0–30', 'Poor', '#dc2626'], ['31–55', 'Unstable', '#d97706'], ['56–75', 'Fair', '#0284c7'], ['76–100', 'Good', '#16a34a']].map(([r, s, c]) => (
                  <div key={s} className="flex items-center gap-2"><span className="w-16 text-slate-500 text-xs">{r}</span><div className="flex-1 h-3 rounded-full" style={{ background: c, opacity: 0.8 }} /><b className="w-16 text-right text-xs">{s}</b></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-8 text-[11px] text-slate-400 text-center">
        ConnectIQ prototype · prediction based on simulated/historical network measurements — not real operator data · Bengaluru → Chennai demo route
      </footer>
    </div>
  );
}
