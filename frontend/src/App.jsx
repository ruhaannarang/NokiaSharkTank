import { useEffect, useMemo, useRef, useState } from 'react';
import RouteMap from './components/RouteMap.jsx';
import Header from './components/Header.jsx';
import DemoScenarioBar from './components/DemoScenarioBar.jsx';
import DashNav from './components/DashNav.jsx';
import LoadingPrediction, { LOADING_STEPS } from './components/LoadingPrediction.jsx';
import PredictionAlert from './components/PredictionAlert.jsx';
import CurrentConnectivityCard from './components/CurrentConnectivityCard.jsx';
import ConnectivitySummary from './components/ConnectivitySummary.jsx';
import JourneySimulation from './components/JourneySimulation.jsx';
import SmartActions from './components/SmartActions.jsx';
import WhyPrediction from './components/WhyPrediction.jsx';
import ContextPanel from './components/ContextPanel.jsx';
import StationaryForecast from './components/StationaryForecast.jsx';
import InsightsPanel from './components/InsightsPanel.jsx';
import AboutSection from './components/AboutSection.jsx';
import LandingPage from './components/landing/LandingPage.jsx';
import Footer from './components/Footer.jsx';
import { ForecastChart } from './components/Charts.jsx';
import { api } from './api.js';
import { round1 } from './constants.js';
import { fallbackForecast } from './fallback.js';

export default function App() {
  const [view, setView] = useState('home'); // home | app
  const [tab, setTab] = useState('dashboard');
  const [panel, setPanel] = useState('map'); // map | trends | actions | stationary
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
  const [scenario, setScenario] = useState(null); // 1 | 2 | 3 | null (manual)
  const timer = useRef(null);
  // Monotonic id: only the latest forecast request may update state.
  // Prevents a slow older response (e.g. Scenario 1) overwriting a newer one.
  const requestId = useRef(0);

  useEffect(() => {
    api.health().then(() => setBackendUp(true)).catch(() => setBackendUp(false));
  }, []);

  const simIndex = useMemo(() => {
    if (!forecast) return null;
    return Math.max(0, Math.min(forecast.segments.length - 1, Math.floor(progress * (forecast.segments.length - 1))));
  }, [forecast, progress]);

  const curSeg = simIndex != null && forecast ? forecast.segments[simIndex] : null;

  // Distance-ahead from canonical backend km fields (haversine-accumulated),
  // with a uniform fallback only for legacy responses lacking them.
  const nextPoor = useMemo(() => {
    if (!forecast || simIndex == null) return null;
    const cur = forecast.segments[simIndex];
    for (const z of forecast.poor_zones) {
      if (z.end_segment >= simIndex) {
        let km;
        if (typeof z.distance_from_start_km === 'number' && typeof cur?.distance_from_start_km === 'number') {
          km = round1(Math.max(0, z.distance_from_start_km - cur.distance_from_start_km));
        } else {
          const ahead = Math.max(0, z.start_segment - simIndex);
          km = round1(ahead * (forecast.total_km / forecast.segments.length));
        }
        return { ...z, km_ahead: km };
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
    if (progress >= 1) setSimMsg('Journey complete — you have arrived. Connectivity recovered.');
    else if (s.status === 'poor') setSimMsg('Entering predicted poor connectivity zone.');
    else if (nextPoor) setSimMsg(`Poor connectivity predicted ${nextPoor.km_ahead} km ahead.`);
    else if (forecast.segments.slice(0, simIndex).some((x) => x.status === 'poor')) setSimMsg('Connectivity recovered.');
    else setSimMsg('Connectivity looks good.');
  }, [simIndex, forecast, nextPoor, progress]);

  // Explicit params (no stale-closure setTimeout): scenario buttons pass exact
  // values instead of relying on not-yet-committed state.
  async function runForecast(overrides = {}) {
    const params = {
      origin, destination, departure_time: departure, transport_mode: transport,
      ...overrides
    };
    const autoplay = overrides.autoplay === true;
    const myId = ++requestId.current;
    const isCurrent = () => myId === requestId.current;
    setLoading(true); setLoadStep(0);
    setPlaying(false);
    const stepTimer = setInterval(() => setLoadStep((s) => Math.min(s + 1, LOADING_STEPS.length)), 550);
    try {
      const body = { origin: params.origin, destination: params.destination,
        departure_time: params.departure_time, transport_mode: params.transport_mode,
        day_of_week: 4 };
      const data = await api.routeForecast(body);
      if (!isCurrent()) return;
      setForecast(data);
      setProgress(0);
      if (autoplay) setPlaying(true);
    } catch (e) {
      if (!isCurrent()) return;
      setForecast(fallbackForecast(params.departure_time, params.transport_mode));
      setProgress(0);
      if (autoplay) setPlaying(true);
    }
    // stationary + current in parallel (best effort, tied to same request)
    try {
      const hour = parseInt((params.departure_time || '18:00').split(':')[0], 10) || 18;
      const [st, cu] = await Promise.all([
        api.stationary(13.0337, 77.5649, hour).catch(() => null),
        api.current(13.0337, 77.5649, hour).catch(() => null)
      ]);
      if (!isCurrent()) return;
      if (st) setStationary(st);
      if (cu) setCurrent(cu);
    } catch { /* ignore */ }
    if (!isCurrent()) return;
    clearInterval(stepTimer);
    setLoading(false);
  }

  function loadScenario(n) {
    setScenario(n);
    if (n === 1) {
      setMode('moving'); setOrigin('Bengaluru'); setDestination('Chennai');
      setDeparture('18:00'); setTransport('train');
      setPanel('map');
      runForecast({ origin: 'Bengaluru', destination: 'Chennai', departure_time: '18:00', transport_mode: 'train' });
    }
    if (n === 2) {
      setMode('stationary'); setDeparture('18:00');
      setPanel('stationary');
      runForecast({ departure_time: '18:00' });
    }
    if (n === 3) {
      // Video-call scenario: 19:00 departure + simulation auto-starts so the
      // judge immediately sees the marker drive toward the poor zone.
      setMode('moving'); setOrigin('Bengaluru'); setDestination('Chennai');
      setDeparture('19:00'); setTransport('train');
      setPanel('map');
      runForecast({ origin: 'Bengaluru', destination: 'Chennai', departure_time: '19:00', transport_mode: 'train', autoplay: true });
    }
  }

  function handleLaunch() {
    setView('app');
    setTab('dashboard');
    setPanel('map');
    // Explicit params: safe to fire immediately, independent of view state.
    setScenario(1);
    setMode('moving'); setOrigin('Bengaluru'); setDestination('Chennai');
    setDeparture('18:00'); setTransport('train');
    runForecast({ origin: 'Bengaluru', destination: 'Chennai', departure_time: '18:00', transport_mode: 'train' });
  }

  const smartActions = useMemo(() => {
    if (!forecast) return [];
    const videoCard = { icon: 'video', title: 'Your 7:15 PM video call may be unstable', body: 'Recommended: switch to audio-only for the weak stretch.', action: 'Switch Recommendation' };
    const acts = [...(forecast.recommendations || [])];
    // video-call scenario card
    acts.push(videoCard);
    if (nextPoor) acts.unshift({ icon: 'alert', title: `Connectivity degrades near ${forecast.segments[nextPoor.start_segment]?.place}`, body: `Download important files now — poor zone in ~${nextPoor.km_ahead} km.`, action: 'Prepare Offline' });
    // Scenario 3 foregrounds the video-call action so it reads differently from Scenario 1.
    if (scenario === 3) return [videoCard, ...acts.filter((a) => a !== videoCard)].slice(0, 4);
    return acts.slice(0, 4);
  }, [forecast, nextPoor, scenario]);

  // Landing branch — must come AFTER every hook (Rules of Hooks: same hook
  // count on every render regardless of view).
  if (view === 'home') {
    return <LandingPage onLaunch={handleLaunch} />;
  }

  return (
    <div className="min-h-screen">
      <Header tab={tab} setTab={setTab} backendUp={backendUp} onHome={() => setView('home')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <DemoScenarioBar loadScenario={loadScenario} active={scenario} />

        {tab === 'about' && <AboutSection onLaunchDemo={() => { setTab('dashboard'); loadScenario(1); }} />}

        {tab === 'insights' && <InsightsPanel />}

        {tab === 'dashboard' && (
          <>
            {loading && <LoadingPrediction loadStep={loadStep} />}

            <DashNav
              panel={panel} setPanel={setPanel}
              hasForecast={!!forecast} isStationary={mode === 'stationary'}
              poorCount={forecast?.poor_zones?.length ?? 0}
            />

            {/* WORKSPACE: one panel open at a time + persistent warning rail. No scrolling needed. */}
            <div className="grid lg:grid-cols-3 gap-5 items-start">
              <div className="lg:col-span-2 min-w-0">
                {panel === 'map' && (
                  <section aria-label="Live connectivity map and journey" className="anim-in" key="p-map">
                    <div className="rounded-3xl p-3 md:p-4 border border-[#1d3a5f] shadow-[0_24px_70px_-20px_rgba(10,37,64,.65)]"
                      style={{ background: 'linear-gradient(165deg,#071c33,#0a2540 55%,#123c6b)' }}>
                      <div className="px-2 pt-1 pb-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                        <div>
                          <div className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">Live map + journey</div>
                          <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
                            <span className="inline-block w-2 h-[18px] rounded" style={{ background: 'linear-gradient(180deg,#38f28a,#1d5cab)' }} aria-hidden />
                            Where will it degrade — and when?
                          </h2>
                        </div>
                        {forecast && (
                          <div className="ml-auto text-xs text-slate-300">
                            <b className="text-white">{forecast.origin} → {forecast.destination}</b> · {forecast.total_label} · {forecast.total_km} km
                            {forecast.fallback && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-[10px] font-bold">demo data</span>}
                          </div>
                        )}
                      </div>
                      <RouteMap forecast={forecast} simIndex={simIndex} />
                      {forecast && (
                        <div className="mt-4">
                          <ConnectivitySummary
                            forecast={forecast} simIndex={simIndex}
                            simulation={
                              <JourneySimulation
                                playing={playing} setPlaying={setPlaying}
                                progress={progress} setProgress={setProgress}
                                simSpeed={simSpeed} setSimSpeed={setSimSpeed}
                                current={curSeg} simMsg={simMsg} isPoor={curSeg?.status === 'poor'}
                                zones={forecast.poor_zones ?? []} totalKm={forecast.total_km || 1}
                              />
                            }
                          />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {panel === 'trends' && forecast && (
                  <section aria-label="Connectivity over time" className="anim-in" key="p-trends">
                    <div className="mb-3">
                      <div className="eyebrow">Score over time</div>
                      <h2 className="section-title">Your next 3 hours, at a glance</h2>
                    </div>
                    <div className="card p-5">
                      <ForecastChart segments={forecast.segments} />
                    </div>
                  </section>
                )}

                {panel === 'actions' && forecast && (
                  <section aria-label="Actions and explanation" className="anim-in" key="p-actions">
                    <div className="mb-3">
                      <div className="eyebrow">Act before it happens</div>
                      <h2 className="section-title">What should you do about it?</h2>
                    </div>
                    <div className="space-y-5">
                      <SmartActions actions={smartActions} />
                      <div className="grid md:grid-cols-2 gap-5">
                        <WhyPrediction segment={curSeg} />
                        <ContextPanel segment={curSeg} reliability={current?.reliability} />
                      </div>
                    </div>
                  </section>
                )}

                {panel === 'stationary' && (
                  <section aria-label="Stationary forecast" className="anim-in" key="p-stationary">
                    <div className="mb-3">
                      <div className="eyebrow">Staying put</div>
                      <h2 className="section-title">What will my connectivity be like here?</h2>
                    </div>
                    <StationaryForecast stationary={stationary} />
                  </section>
                )}
              </div>

              {/* PERSISTENT RAIL — warning + now, always in view */}
              <div className="space-y-5 lg:sticky lg:top-[76px]">
                {forecast && (
                  <PredictionAlert
                    nextPoor={nextPoor}
                    startSegmentPlace={nextPoor ? forecast.segments[nextPoor.start_segment]?.place : null}
                  />
                )}
                <CurrentConnectivityCard segment={curSeg} />
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
