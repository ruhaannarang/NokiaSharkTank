const BASE = '';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) throw new Error(`API ${res.status} ${path}`);
  return res.json();
}

export const api = {
  health: () => req('/health'),
  predict: (body) => req('/api/predict', { method: 'POST', body: JSON.stringify(body) }),
  routeForecast: (body) => req('/api/route-forecast', { method: 'POST', body: JSON.stringify(body) }),
  simulate: (body) => req('/api/simulate', { method: 'POST', body: JSON.stringify(body) }),
  stationary: (lat = 13.0337, lon = 77.5649, h = 18) =>
    req(`/api/stationary-forecast?lat=${lat}&lon=${lon}&start_hour=${h}`),
  current: (lat = 13.0337, lon = 77.5649, h = 18) =>
    req(`/api/current-connectivity?lat=${lat}&lon=${lon}&hour=${h}`)
};

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
