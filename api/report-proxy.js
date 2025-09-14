export default async function handler(req, res) {
  try {
    const { path } = req.query || {};
    if (!path) return res.status(400).json({ ok: false, error: 'Missing path' });

    const BASE = process.env.STORAGE_BASE_URL; // e.g. https://<owner>.github.io/<repo>
    const PREFIX = process.env.STORAGE_PREFIX || ''; // e.g. '' or 'artifacts'
    if (!BASE) return res.status(500).json({ ok: false, error: 'Server not configured. Missing STORAGE_BASE_URL env.' });

    const target = `${BASE.replace(/\/$/, '')}/${PREFIX ? PREFIX.replace(/\/$/, '') + '/' : ''}${path}`;
    const upstream = await fetch(target);

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status).send(text || `Upstream fetch failed: ${upstream.status}`);
    }

    // Pass-through headers
    const contentType = upstream.headers.get('content-type') || guessContentType(path);
    if (contentType) res.setHeader('Content-Type', contentType);
    const cache = process.env.REPORT_PROXY_CACHE_CONTROL || 'public, max-age=60';
    res.setHeader('Cache-Control', cache);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

function guessContentType(p) {
  const lower = String(p).toLowerCase();
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html; charset=utf-8';
  if (lower.endsWith('.har')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.txt') || lower.endsWith('.log')) return 'text/plain; charset=utf-8';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}
