export default function Footer() {
  let buildId = '';
  try {
    // eslint-disable-next-line no-undef
    buildId = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__.slice(11, 19) : '';
  } catch { /* ignore */ }
  return (
    <footer className="max-w-7xl mx-auto px-4 pb-8 text-[11px] text-slate-400 text-center">
      ConnectIQ prototype · prediction based on simulated/historical network measurements — not real operator data · Bengaluru → Chennai demo route
      {buildId ? ` · frontend build ${buildId} UTC` : ''}
    </footer>
  );
}
