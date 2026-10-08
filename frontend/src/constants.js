/* Single source of truth for connectivity semantics + canonical demo-route geometry.
   Backend remains the source of truth for predictions; this module mirrors the
   backend's haversine-accumulated math so the offline fallback behaves identically. */

export const THRESHOLDS = { POOR_MAX: 30, UNSTABLE_MAX: 55, FAIR_MAX: 75 };

export function toStatus(score) {
  if (score <= THRESHOLDS.POOR_MAX) return 'poor';
  if (score <= THRESHOLDS.UNSTABLE_MAX) return 'unstable';
  if (score <= THRESHOLDS.FAIR_MAX) return 'fair';
  return 'good';
}

export function statusColor(s) {
  if (s === 'good') return '#16a34a';
  if (s === 'fair') return '#0284c7';
  if (s === 'unstable') return '#d97706';
  return '#dc2626';
}

export function statusBg(s) {
  if (s === 'good') return 'bg-green-50 border-green-200 text-green-800';
  if (s === 'fair') return 'bg-sky-50 border-sky-200 text-sky-800';
  if (s === 'unstable') return 'bg-amber-50 border-amber-200 text-amber-800';
  return 'bg-red-50 border-red-200 text-red-800';
}

export const STATUS_LABEL = { good: 'Good', fair: 'Fair', unstable: 'Unstable', poor: 'Poor' };

export const SPEEDS = { train: 85, car: 65, bus: 55 };

export const WAYPOINTS = [
  ['Bengaluru', 12.9716, 77.5946], ['Hosur', 12.7402, 77.8253],
  ['Krishnagiri', 12.5186, 78.2137], ['Dharmapuri', 12.1211, 78.1582],
  ['Salem', 11.6643, 78.1460], ['Attur', 11.60, 78.60],
  ['Vellore', 12.9165, 79.1325], ['Chennai', 13.0827, 80.2707]
];

/** Demo scenario context (fixed conditions) — the ML model still predicts the score. */
export function zoneProfile(t) {
  if (t < 0.16) return [0.35, 28, 90, 0.12, 1.0];
  if (t < 0.30) return [0.7, 45, 78, 0.25, 0.97];
  if (t < 0.42) return [1.5, 68, 58, 0.45, 0.90];
  if (t < 0.58) return [2.6, 88, 38, 0.70, 0.82];
  if (t < 0.68) return [1.7, 72, 52, 0.55, 0.88];
  if (t < 0.82) return [0.9, 50, 72, 0.30, 0.95];
  return [0.4, 30, 88, 0.15, 1.0];
}

export function haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371.0;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Canonical route points + haversine-accumulated km (mirrors backend interpolate_route). */
export function canonicalRoutePoints(n = 60) {
  const legs = [];
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    legs.push(haversineKm(WAYPOINTS[i][1], WAYPOINTS[i][2], WAYPOINTS[i + 1][1], WAYPOINTS[i + 1][2]));
  }
  const target_total = legs.reduce((a, b) => a + b, 0);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const target = (target_total * k) / (n - 1);
    let acc = 0;
    for (let i = 0; i < legs.length; i++) {
      const L = legs[i];
      if (acc + L >= target || i === legs.length - 1) {
        const f = L === 0 ? 0 : Math.max(0, Math.min(1, (target - acc) / L));
        pts.push([
          WAYPOINTS[i][1] + f * (WAYPOINTS[i + 1][1] - WAYPOINTS[i][1]),
          WAYPOINTS[i][2] + f * (WAYPOINTS[i + 1][2] - WAYPOINTS[i][2]),
          f < 0.5 ? WAYPOINTS[i][0] : WAYPOINTS[i + 1][0]
        ]);
        break;
      }
      acc += L;
    }
  }
  const cumulative = [0];
  for (let k = 1; k < n; k++) {
    cumulative.push(cumulative[k - 1] + haversineKm(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]));
  }
  return { pts, cumulative, total: cumulative[n - 1] };
}

export const round1 = (v) => Math.round(v * 10) / 10;

export function formatHm(totalMin) {
  return `${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, '0')}m`;
}
