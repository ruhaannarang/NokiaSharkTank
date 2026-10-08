/* Offline fallback forecast.
   Used ONLY when the prediction backend is unreachable. Uses the same canonical
   route geometry (haversine-accumulated km), status thresholds and distance math
   as the backend, with the heuristic scoring formula standing in for the ML model.
   Shape matches POST /api/route-forecast (plus fallback: true). */
import {
  canonicalRoutePoints, zoneProfile, toStatus, round1, formatHm, SPEEDS
} from './constants.js';

function heuristicScore(tower, load, hist, weather, event) {
  const towerComp = 100 * Math.exp(-tower / 1.2);
  return Math.max(4, Math.min(98,
    0.30 * hist + 0.28 * (100 - load) + 0.22 * towerComp + 0.10 * weather * 100 - event * 8));
}

export function fallbackForecast(departure = '18:00', mode = 'train') {
  const N = 60;
  const speed = SPEEDS[mode] || SPEEDS.train;
  const { pts, cumulative, total } = canonicalRoutePoints(N);
  const totalKm = round1(total);
  const totalMin = Math.round((total / speed) * 60);
  const [dh, dm] = (departure || '18:00').split(':').map(Number);
  const perMin = totalMin / N;

  const segments = pts.map(([lat, lon, place], i) => {
    const t = i / (N - 1);
    const [tower, load, hist, event, weather] = zoneProfile(t);
    const d = new Date();
    d.setHours(dh || 18, dm || 0, 0, 0);
    d.setMinutes(d.getMinutes() + perMin * i);
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const score = round1(heuristicScore(tower, load, hist, weather, event));
    const fromStart = round1(cumulative[i]);
    return {
      segment: i, latitude: +lat.toFixed(5), longitude: +lon.toFixed(5), place, time,
      distance_from_start_km: fromStart,
      distance_to_destination_km: round1(total - cumulative[i]),
      speed, tower_distance: tower, network_load: load, historical_quality: hist,
      weather_factor: weather, event_density: event, quality_score: score,
      status: toStatus(score), confidence: 0.85,
      signal_strength: round1(-50 - (100 - score) * 0.62),
      latency: round1(14 + (100 - score) * 1.75),
      throughput: round1(Math.max(0.4, (score / 100) ** 2 * 85))
    };
  });

  const mins = (st) => Math.round(segments.filter((s) => s.status === st).length * perMin);
  const good = Math.round(segments.filter((s) => s.status === 'good' || s.status === 'fair').length * perMin);
  const zones = [];
  let i = 0;
  while (i < N) {
    if (segments[i].status === 'poor') {
      let j = i;
      while (j + 1 < N && segments[j + 1].status === 'poor') j++;
      zones.push({
        start_segment: i, end_segment: j,
        start_time: segments[i].time, end_time: segments[j].time,
        duration_min: Math.max(2, Math.round((j - i + 1) * perMin)),
        distance_from_start_km: segments[i].distance_from_start_km,
        distance_to_destination_km: segments[i].distance_to_destination_km,
        cause: 'High network load + weak tower coverage', confidence: 0.89
      });
      i = j + 1;
    } else i++;
  }

  const warnings = zones.length
    ? zones.map((z) => `Poor connectivity predicted near ${segments[z.start_segment].place} (${z.start_time}–${z.end_time}, ~${z.duration_min} min).`)
    : ['Your predicted route remains stable — no poor connectivity zone detected.'];

  return {
    origin: 'Bengaluru', destination: 'Chennai', departure_time: departure,
    transport_mode: SPEEDS[mode] ? mode : 'train',
    total_km: totalKm, total_min: totalMin, total_label: formatHm(totalMin),
    good_min: good, unstable_min: mins('unstable'), poor_min: mins('poor'), fair_min: mins('fair'),
    summary: { good_min: good, unstable_min: mins('unstable'), poor_min: mins('poor'), fair_min: mins('fair') },
    route: segments.map((s) => [s.latitude, s.longitude]), segments,
    poor_zones: zones, warnings,
    recommendations: [{ icon: 'download', title: 'Download important files now',
      body: 'Poor connectivity expected. Save offline copies before entering this zone.', action: 'Prepare Offline' }],
    fallback: true,
    fallback_note: 'Prediction backend unavailable. Showing deterministic demonstration forecast.'
  };
}
