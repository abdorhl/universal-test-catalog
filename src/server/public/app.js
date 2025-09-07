const $ = (sel) => document.querySelector(sel);
const output = $('#output');

function log(text) {
  const time = new Date().toLocaleTimeString();
  output.textContent += `\n[${time}] ${text}`;
  output.scrollTop = output.scrollHeight;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function runWeb() {
  const url = $('#url').value.trim();
  const lenient = $('#lenient').checked;
  const a11y = $('#a11y').checked;
  const a11yStrict = $('#a11yStrict').checked;
  const grep = $('#grep').value.trim() || undefined;
  if (!url) return log('Please enter a valid URL.');
  log(`Running Web on ${url} ...`);
  try {
    const res = await post('/api/run/web', { url, lenient, a11y, a11yStrict, grep });
    log('Web completed. Open Playwright report to view details.');
    if (res.output) log(res.output);
  } catch (e) {
    log(`Web failed: ${e.message}`);
  }
}

async function runPerf() {
  const url = $('#url').value.trim();
  if (!url) return log('Please enter a valid URL.');
  log(`Running Lighthouse on ${url} (mobile)...`);
  try {
    const res = await post('/api/run/perf', { url });
    log('Perf completed. Check the Reports link to open the HTML report.');
    if (res.output) log(res.output);
  } catch (e) {
    log(`Perf failed: ${e.message}`);
  }
}

async function runQuick() {
  const url = $('#url').value.trim();
  if (!url) return log('Please enter a valid URL.');
  log(`Quick run (Web + Perf) on ${url} ...`);
  try {
    const res = await post('/api/run/quick', { url });
    log('Quick completed. Open the reports to view results.');
    if (res.output) log(res.output);
  } catch (e) {
    log(`Quick failed: ${e.message}`);
  }
}

async function runSecurity() {
  const url = $('#url').value.trim();
  if (!url) return log('Please enter a valid URL.');
  log(`Running Security suite on ${url} ...`);
  try {
    const res = await post('/api/run/security', { url });
    log('Security completed. Open Security Reports to view results.');
    if (res.output) log(res.output);
  } catch (e) {
    log(`Security failed: ${e.message}`);
  }
}

$('#runWeb').addEventListener('click', runWeb);
$('#runPerf').addEventListener('click', runPerf);
$('#runQuick').addEventListener('click', runQuick);
$('#runSecurity').addEventListener('click', runSecurity);
