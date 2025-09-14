export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "your-org/your-repo"
    const GITHUB_REF = process.env.GITHUB_REF || 'main';
    const WORKFLOW_FILE = process.env.QUICK_WORKFLOW_FILE || 'quick.yml';

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ ok: false, error: 'Server not configured. Missing GITHUB_TOKEN or GITHUB_REPO env.' });
    }

    const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        ref: GITHUB_REF,
        inputs: { url }
      })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(500).json({ ok: false, error: `GitHub dispatch failed: ${resp.status}`, details: text });
    }

    return res.json({ ok: true, message: 'Workflow dispatched. Check GitHub Actions for progress.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
