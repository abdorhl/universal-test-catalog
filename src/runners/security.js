import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { execa } from 'execa';

// Use global fetch (Node 18+)

function ensureReportsDir() {
  const outDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  return outDir;
}

export async function auditHeaders(targetUrl) {
  console.log(chalk.cyan('Security: Auditing HTTP response headers...'));
  const resp = await fetch(targetUrl, { redirect: 'follow' });
  const headers = Object.fromEntries([...resp.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]));

  const checks = [
    { key: 'content-security-policy', required: true, desc: 'CSP helps mitigate XSS' },
    { key: 'strict-transport-security', required: targetUrl.startsWith('https://'), desc: 'HSTS enforces HTTPS' },
    { key: 'x-content-type-options', required: true, expected: 'nosniff', desc: 'Prevents MIME sniffing' },
    { key: 'x-frame-options', required: true, desc: 'Clickjacking protection' },
    { key: 'referrer-policy', required: true, desc: 'Controls referrer leakage' },
    { key: 'permissions-policy', required: true, desc: 'Restrict powerful features' },
  ];

  const findings = [];
  for (const c of checks) {
    const present = headers[c.key] !== undefined;
    const value = headers[c.key];
    if (!present && c.required) {
      findings.push({ type: 'missing', key: c.key, severity: 'medium', desc: c.desc });
    } else if (present && c.expected && (value || '').toLowerCase() !== c.expected) {
      findings.push({ type: 'value', key: c.key, severity: 'low', desc: `Expected '${c.expected}', got '${value}'` });
    }
  }

  const outDir = ensureReportsDir();
  const outPath = path.join(outDir, 'security-headers.json');
  fs.writeFileSync(outPath, JSON.stringify({ url: targetUrl, headers, findings }, null, 2));
  console.log(chalk.green(`Header audit saved to ${outPath}`));
  return { headers, findings, outPath };
}

export async function checkTLS(hostname) {
  console.log(chalk.cyan('Security: Checking TLS grade via SSL Labs...'));
  const analyzeUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(hostname)}&publish=off&fromCache=on&all=done`;
  let data;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(analyzeUrl);
    data = await res.json();
    if (data.status === 'READY' || data.status === 'ERROR') break;
    await new Promise(r => setTimeout(r, 8000));
  }
  const outDir = ensureReportsDir();
  const outPath = path.join(outDir, 'ssl-labs.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(chalk.green(`SSL Labs result saved to ${outPath}`));
  return { data, outPath };
}

export async function zapBaseline(targetUrl) {
  console.log(chalk.cyan('Security: Running OWASP ZAP Baseline (Docker)...'));
  const outDir = ensureReportsDir();
  const outPath = path.join(outDir, 'zap-baseline-report.html');
  try {
    await execa('docker', [
      'run', '--rm',
      '-v', `${outDir}:/zap/wrk:Z`,
      'owasp/zap2docker-stable',
      'zap-baseline.py', '-t', targetUrl, '-r', 'zap-baseline-report.html', '-I'
    ], { stdio: 'inherit' });
    console.log(chalk.green(`ZAP Baseline report saved to ${outPath}`));
    return { outPath };
  } catch (err) {
    console.warn(chalk.yellow('ZAP Baseline skipped or failed. Ensure Docker is installed and running.'));
    return { error: err?.message || String(err) };
  }
}

export async function captureHar(targetUrl) {
  console.log(chalk.cyan('Security: Capturing HAR (network traffic)...'));
  const { chromium } = await import('playwright');
  const outDir = ensureReportsDir();
  const harPath = path.join(outDir, 'traffic.har');
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordHar: { path: harPath, omitContent: false } });
  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await context.close();
  await browser.close();
  console.log(chalk.green(`HAR saved to ${harPath}`));
  return { harPath };
}

export async function runSecurity({ url, tls = true, headers = true, zap = false, har = true }) {
  if (!url) throw new Error('Missing --url');
  console.log(chalk.magenta(`\n== Network Security Suite for ${url} ==`));

  const results = {};
  if (headers) results.headers = await auditHeaders(url);
  if (tls) {
    const hostname = new URL(url).hostname;
    results.tls = await checkTLS(hostname);
  }
  if (har) results.har = await captureHar(url);
  if (zap) results.zap = await zapBaseline(url);

  const summaryPath = path.join(ensureReportsDir(), 'security-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({ url, results, timestamp: new Date().toISOString() }, null, 2));
  console.log(chalk.green(`Security summary written to ${summaryPath}`));
  return results;
}
