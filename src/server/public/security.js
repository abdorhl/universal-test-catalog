async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function setText(id, val) {
  const el = document.getElementById(id);
  el.textContent = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
}

async function load() {
  const summaryPath = '/reports/security-summary.json';
  const headersPath = '/reports/security-headers.json';
  const tlsPath = '/reports/ssl-labs.json';
  const harPath = '/reports/traffic.har';
  const zapPath = '/reports/zap-baseline-report.html';

  const summary = await fetchJSON(summaryPath).catch(() => null);
  if (!summary) {
    setText('summary', 'No security scan has been run yet. Use Run Security first.');
    return;
  }

  const url = summary.url || '';
  document.getElementById('summary').innerHTML = `
    <div class="link">Target: <strong>${url}</strong></div>
    <div class="link">Run at: ${new Date(summary.timestamp).toLocaleString()}</div>
  `;

  const headers = await fetchJSON(headersPath).catch(() => null);
  if (headers) setText('headers', headers);

  const tls = await fetchJSON(tlsPath).catch(() => null);
  if (tls) setText('tls', tls);

  const harLink = document.getElementById('harLink');
  harLink.href = harPath;

  const zapLink = document.getElementById('zapLink');
  zapLink.href = zapPath;
}

load().catch(e => {
  setText('summary', `Failed to load reports: ${e.message}`);
});
