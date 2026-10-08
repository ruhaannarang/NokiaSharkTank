import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, ZoomControl, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { statusColor, STATUS_LABEL } from '../constants.js';

const { BaseLayer } = LayersControl;

function FitBounds({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(route, { padding: [36, 36] });
    }
  }, [route, map]);
  return null;
}

function makeEndpoint(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 4px rgba(255,255,255,.15),0 4px 14px rgba(0,0,0,.5)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function makePoorZone() {
  return L.divIcon({
    className: '',
    html: `<div class="pz-wrap"><span class="pz-ping"></span><span class="pz-ping pz-delay"></span><span class="pz-dot"></span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

function makeUserDot() {
  return L.divIcon({
    className: '',
    html: `<div class="user-wrap"><span class="user-ring"></span><span class="user-ring user-delay"></span><span class="user-dot"></span></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
}

export default function RouteMap({ forecast, simIndex }) {
  if (!forecast) {
    return (
      <div className="h-[460px] rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 flex flex-col items-center justify-center text-slate-400 gap-2">
        <span className="text-4xl" aria-hidden>🗺️</span>
        <div className="font-bold text-slate-500">Your connectivity route will appear here</div>
        <div className="text-sm">Pick a demo scenario or press “Predict My Connectivity”.</div>
      </div>
    );
  }
  const route = forecast.route;
  const segs = forecast.segments;
  const center = route[Math.floor(route.length / 2)];

  // Colored sub-polylines: group consecutive same-status segments.
  const lines = [];
  let cur = [];
  let curStatus = segs[0]?.status;
  segs.forEach((s, i) => {
    cur.push([s.latitude, s.longitude]);
    const next = segs[i + 1];
    if (!next || next.status !== curStatus) {
      lines.push({ status: curStatus, pts: [...cur, ...(next ? [[next.latitude, next.longitude]] : [])] });
      cur = [];
      curStatus = next?.status;
    }
  });

  const userSeg = simIndex != null && segs[simIndex] ? segs[simIndex] : null;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#1d3a5f] shadow-[0_20px_60px_-15px_rgba(10,37,64,.55)]">
      <MapContainer center={center} zoom={7} zoomControl={false}
        className="h-[460px] w-full !rounded-none" scrollWheelZoom>
        <LayersControl position="topright">
          <BaseLayer checked name="Standard">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          </BaseLayer>
          <BaseLayer name="Dark glow">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' />
          </BaseLayer>
        </LayersControl>
        <ZoomControl position="topright" />
        <FitBounds route={route} />
        {/* glow underlay per segment group */}
        {lines.map((l, i) => (
          <Polyline key={`g${i}`} positions={l.pts}
            pathOptions={{ color: statusColor(l.status), weight: 12, opacity: 0.28, lineCap: 'round' }} />
        ))}
        {/* bright cores */}
        {lines.map((l, i) => (
          <Polyline key={`c${i}`} positions={l.pts}
            pathOptions={{ color: statusColor(l.status), weight: 5.5, opacity: 0.95, lineCap: 'round' }} />
        ))}
        {/* animated direction-of-travel flow */}
        <Polyline positions={route}
          pathOptions={{ color: '#ffffff', weight: 2, opacity: 0.55, className: 'flow-line' }} />
        <Marker position={route[0]} icon={makeEndpoint('#16a34a')}>
          <Popup><b>{forecast.origin}</b><br />Origin — journey starts here</Popup>
        </Marker>
        <Marker position={route[route.length - 1]} icon={makeEndpoint('#38f28a')}>
          <Popup><b>{forecast.destination}</b><br />Destination</Popup>
        </Marker>
        {forecast.poor_zones?.map((z, i) => {
          const s = segs[z.start_segment];
          if (!s) return null;
          return (
            <Marker key={`pz${i}`} position={[s.latitude, s.longitude]} icon={makePoorZone()}>
              <Popup>
                <b>Poor connectivity zone</b><br />
                {z.start_time}–{z.end_time} (~{z.duration_min} min)<br />
                Cause: {z.cause}<br />
                Confidence (prototype): {Math.round(z.confidence * 100)}%
              </Popup>
            </Marker>
          );
        })}
        {userSeg && (
          <Marker position={[userSeg.latitude, userSeg.longitude]} icon={makeUserDot()} zIndexOffset={1000}>
            <Popup><b>You are here</b><br />{userSeg.place} · {userSeg.time}<br />{userSeg.status.toUpperCase()} ({userSeg.quality_score})</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* glass legend */}
      <div className="absolute bottom-4 left-4 z-[500] rounded-2xl px-3.5 py-2.5 text-[11px] space-y-1.5 border border-white/15 bg-[#0a2540]/85 backdrop-blur text-slate-100 shadow-xl"
        role="img" aria-label="Map legend: green good, amber unstable, red poor">
        {[['good', '🟢'], ['unstable', '🟡'], ['poor', '🔴']].map(([s, e]) => (
          <div key={s} className="flex items-center gap-2">
            <span aria-hidden>{e}</span><span className="font-semibold w-14">{STATUS_LABEL[s]}</span>
            <span className="inline-block w-8 h-1.5 rounded-full" style={{ background: statusColor(s), boxShadow: `0 0 8px ${statusColor(s)}` }} aria-hidden />
          </div>
        ))}
      </div>

      {/* journey badge */}
      <div className="absolute top-4 left-4 z-[500] rounded-2xl px-3.5 py-2 border border-white/15 bg-[#0a2540]/85 backdrop-blur text-slate-100 shadow-xl text-xs">
        <span className="font-bold">{forecast.origin} → {forecast.destination}</span>
        <span className="text-slate-300"> · {forecast.total_label} · {forecast.total_km} km</span>
      </div>
    </div>
  );
}
