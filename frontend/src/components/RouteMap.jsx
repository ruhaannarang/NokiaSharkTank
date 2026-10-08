import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { statusColor, STATUS_LABEL } from '../constants.js';

function FitBounds({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(route, { padding: [40, 40] });
    }
  }, [route, map]);
  return null;
}

function makeDot(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function makeUserDot() {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#0a2540;border:3px solid #38f28a;box-shadow:0 0 0 6px rgba(56,242,138,.25), 0 2px 10px rgba(0,0,0,.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

export default function RouteMap({ forecast, simIndex }) {
  if (!forecast) {
    return (
      <div className="h-[420px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500">
        Run a forecast to see your connectivity route
      </div>
    );
  }
  const route = forecast.route;
  const segs = forecast.segments;
  const center = route[Math.floor(route.length / 2)];

  // Build colored sub-polylines: group consecutive same-status segments
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
    <MapContainer center={center} zoom={7} className="h-[420px] w-full shadow-card" scrollWheelZoom>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      <FitBounds route={route} />
      {lines.map((l, i) => (
        <Polyline key={i} positions={l.pts} pathOptions={{ color: statusColor(l.status), weight: 6, opacity: 0.9, lineCap: 'round' }} />
      ))}
      {/* faint base route */}
      <Polyline positions={route} pathOptions={{ color: '#0a2540', weight: 9, opacity: 0.12 }} />
      <Marker position={route[0]} icon={makeDot('#16a34a')}>
        <Popup><b>{forecast.origin}</b><br />Origin — journey starts here</Popup>
      </Marker>
      <Marker position={route[route.length - 1]} icon={makeDot('#0a2540')}>
        <Popup><b>{forecast.destination}</b><br />Destination</Popup>
      </Marker>
      {/* poor zone markers */}
      {forecast.poor_zones?.map((z, i) => {
        const s = segs[z.start_segment];
        if (!s) return null;
        return (
          <Marker key={'pz' + i} position={[s.latitude, s.longitude]} icon={makeDot('#dc2626')}>
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
      {/* legend: text + color so status is never color-only */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-card text-[11px] space-y-1" role="img" aria-label="Map legend: green good, amber unstable, red poor">
        {[['good', '🟢'], ['unstable', '🟡'], ['poor', '🔴']].map(([s, e]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span aria-hidden>{e}</span><span className="font-semibold">{STATUS_LABEL[s]}</span>
            <span className="inline-block w-6 h-1.5 rounded-full" style={{ background: statusColor(s) }} aria-hidden />
          </div>
        ))}
      </div>
    </MapContainer>
  );
}
