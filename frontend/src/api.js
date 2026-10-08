// API layer. Base URL comes from VITE_API_BASE_URL (e.g. http://localhost:8000);
// empty default keeps same-origin + Vite dev proxy working with `npm run dev`.
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

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
  modelInfo: () => req('/api/model-info'),
  predict: (body) => req('/api/predict', { method: 'POST', body: JSON.stringify(body) }),
  routeForecast: (body) => req('/api/route-forecast', { method: 'POST', body: JSON.stringify(body) }),
  simulate: (body) => req('/api/simulate', { method: 'POST', body: JSON.stringify(body) }),
  stationary: (lat = 13.0337, lon = 77.5649, h = 18, hours = 24, step = 60) =>
    req(`/api/stationary-forecast?lat=${lat}&lon=${lon}&start_hour=${h}&hours=${hours}&step_min=${step}`),
  current: (lat = 13.0337, lon = 77.5649, h = 18) =>
    req(`/api/current-connectivity?lat=${lat}&lon=${lon}&hour=${h}`)
};

// Re-exported for backwards compatibility (single status implementation lives here).
export { statusColor, statusBg, STATUS_LABEL, toStatus, THRESHOLDS } from './constants.js';
