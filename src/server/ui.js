import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Static assets
app.use('/assets', express.static(path.join(__dirname, 'public')));
// Expose Playwright HTML report if exists
app.use('/playwright-report', express.static(path.join(rootDir, 'playwright-report')));
// Expose Lighthouse reports
app.use('/reports', express.static(path.join(rootDir, 'reports')));

// Home page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Run Web tests
app.post('/api/run/web', async (req, res) => {
  const { url, lenient = true, a11y = true, a11yStrict = false, grep } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });
  try {
    const args = ['node', path.join(rootDir, 'src', 'index.js'), 'web', '--url', url];
    if (lenient) args.push('--lenient');
    if (a11y === false) args.push('--no-a11y');
    if (a11yStrict) args.push('--a11y-strict');
    if (grep) args.push('--grep', grep);
    const { stdout } = await execa(args[0], args.slice(1), { cwd: rootDir });
    res.json({ ok: true, output: stdout });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err), output: err?.stdout || '' });
  }
});

// Run Performance (Lighthouse)
app.post('/api/run/perf', async (req, res) => {
  const { url, desktop = false } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });
  try {
    const args = ['node', path.join(rootDir, 'src', 'index.js'), 'perf', '--url', url];
    if (desktop) args.push('--desktop');
    const { stdout } = await execa(args[0], args.slice(1), { cwd: rootDir });
    res.json({ ok: true, output: stdout });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err), output: err?.stdout || '' });
  }
});

// Quick: web + perf
app.post('/api/run/quick', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });
  try {
    const args = ['node', path.join(rootDir, 'src', 'index.js'), 'quick', '--url', url];
    const { stdout } = await execa(args[0], args.slice(1), { cwd: rootDir });
    res.json({ ok: true, output: stdout });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err), output: err?.stdout || '' });
  }
});

// Run Security Suite
app.post('/api/run/security', async (req, res) => {
  const { url, zap = false, tls = true, headers = true, har = true } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });
  try {
    const args = ['node', path.join(rootDir, 'src', 'index.js'), 'security', '--url', url];
    if (!tls) args.push('--no-tls');
    if (!headers) args.push('--no-headers');
    if (!har) args.push('--no-har');
    if (zap) args.push('--zap');
    const { stdout } = await execa(args[0], args.slice(1), { cwd: rootDir });
    res.json({ ok: true, output: stdout });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err), output: err?.stdout || '' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(chalk.green(`UTC Web UI running at http://localhost:${PORT}`));
});
