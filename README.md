# Universal Test Catalog (UTC)

A single CLI to run cross-cutting tests you can apply to any website (and scaffold for mobile):

- Web smoke + accessibility (Playwright + axe)
- Performance audits (Lighthouse)
- API tests (Newman/Postman)
- Mobile testing scaffold (Appium)

## Prerequisites

- Node.js >= 18
- On first install, Playwright will prompt to download browsers. You can also run:
  - `npx playwright install`

## Install

In the project directory:

```
npm install
```

Optionally link the CLI globally for `utc` command:

```
npm link
```

Alternatively, run with `npx` from this folder using the local bin:

```
node ./src/index.js --help
```

## Usage

All commands below are Windows PowerShell friendly.

Run from the project directory `universal-test-catalog/`, or reference the full path like `node .\universal-test-catalog\src\index.js ...` if running from a parent folder.

### Web tests (Playwright)

```
node ./src/index.js web --url https://example.com
# or if linked globally
utc web --url https://example.com
```

- Adds basic smoke tests and optional accessibility scan.
- Flags:
  - `--no-a11y` disables accessibility checks entirely.
  - `--a11y-strict` makes accessibility violations fail the run (default: warn-only).
  - `--lenient` increases timeouts for slow sites (navigation 60s, action 45s).
  - `--grep "<pattern>"` runs only tests matching a Playwright grep pattern.

Examples:

```
# Run lenient web smoke on a target
node ./src/index.js web --url https://www.maktaba.org/ --lenient

# Run only the homepage test (and disable a11y)
node ./src/index.js web --url https://www.maktaba.org/ --no-a11y --grep "homepage has title"

# Run a11y in strict mode to fail on violations
node ./src/index.js web --url https://www.maktaba.org/ --a11y-strict
```

### Performance (Lighthouse)

```
node ./src/index.js perf --url https://example.com
node ./src/index.js perf --url https://example.com --desktop
```

- HTML report is saved to `reports/`.

### API tests (Newman)

```
node ./src/index.js api --collection path/to/collection.json
node ./src/index.js api --collection path/to/collection.json --env path/to/env.json
```

- Fails the run if any request/test fails.

### Mobile scaffold (Appium)

```
node ./src/index.js mobile
```

- Prints next steps to enable Appium tests.

## Project Structure

```
/ (project root)
  package.json
  playwright.config.cjs
  src/
    index.js
    runners/
      web.js
      perf.js
      api.js
      mobile.js
  tests/
    web/
      smoke.spec.js
  reports/ (generated)
```

## Extending

- Add more Playwright tests under `tests/web/`.
- Introduce custom Lighthouse configs if needed.
- Add API collections and environment files in a `collections/` folder.
- For mobile, we can integrate WebdriverIO or Appium JS client runners next.

## Deploying the UI to Vercel for Real-World Penetration Testing (Orchestration)

This repo now includes a Vercel-ready UI and API layer that safely orchestrates security scans in the cloud by dispatching GitHub Actions workflows and proxying published artifacts. Heavy tools (Playwright, Lighthouse, ZAP, SSL Labs curl, etc.) do not run on Vercel—only on GitHub Actions runners—so you stay within Vercel limits and security posture.

### What you get

- Static UI served by Vercel from `src/server/public/` via `vercel.json`.
- Serverless API routes under `api/` that trigger GitHub Actions workflows using the GitHub REST API.
- A report proxy endpoint `GET /api/report-proxy?path=<path>` used via rewrites so the UI can fetch `\`/reports/*\`` and `\`/playwright-report/*\`` directly.
- Sample workflows under `.github/workflows/` that run your existing CLI and publish artifacts to GitHub Pages for the proxy to fetch.

### Prerequisites

1) A GitHub repository containing this code and GitHub Pages enabled.
   - Settings → Pages → Build and deployment: GitHub Actions.
2) A Personal Access Token (classic or fine-grained) or GitHub App token with `repo` and `workflow` scope to dispatch workflows.
3) Node 18+ on Vercel (default).

### Configure Vercel

Add the following Environment Variables in Vercel Project Settings → Environment Variables:

- `GITHUB_TOKEN`: Token with permission to dispatch workflows in your repo.
- `GITHUB_REPO`: "owner/repo" of your GitHub repository, e.g. `yourname/universal-test-catalog`.
- `GITHUB_REF`: Branch to run workflows on, e.g. `main` (optional; default `main`).
- `SECURITY_WORKFLOW_FILE`: `security.yml` (optional; default `security.yml`).
- `WEB_WORKFLOW_FILE`: `web.yml` (optional).
- `PERF_WORKFLOW_FILE`: `perf.yml` (optional).
- `QUICK_WORKFLOW_FILE`: `quick.yml` (optional).
- `STORAGE_BASE_URL`: Public base URL where reports are published. For GitHub Pages this is usually `https://<owner>.github.io/<repo>`.
- `STORAGE_PREFIX`: Optional prefix under the base URL; leave empty for this setup.
- `REPORT_PROXY_CACHE_CONTROL`: e.g. `public, max-age=60` (optional).

Deploy to Vercel (link the project or `vercel --prod`). The provided `vercel.json` contains rewrites:

- `/` → `src/server/public/index.html`
- `/security` → `src/server/public/security.html`
- `/assets/*` → static assets
- `/reports/*` → `/api/report-proxy?path=$1` (proxied to GitHub Pages)
- `/playwright-report/*` → `/api/report-proxy?path=playwright-report/$1`

### Configure GitHub Actions

This repo includes sample workflows:

- `.github/workflows/security.yml`
- `.github/workflows/web.yml`
- `.github/workflows/perf.yml`
- `.github/workflows/quick.yml`

Each workflow:

- Installs dependencies (`npm ci`).
- Runs the corresponding CLI command under `src/index.js`.
- Copies generated artifacts into a `public/` folder and deploys to GitHub Pages.

You can tailor what is copied into `public/` depending on which artifacts you want exposed. The UI expects:

- Security artifacts in `reports/` (e.g., `security-summary.json`, `security-headers.json`, `ssl-labs.json`, `traffic.har`, `zap-baseline-report.html`).
- Playwright HTML report in `playwright-report/`.

Once a workflow run completes and Pages has deployed, your Vercel UI will fetch those files via the proxy.

### Running a Scan from the UI

1) Open your Vercel URL and enter a target URL.
2) Click one of:
   - Run Web
   - Run Performance
   - Quick (Web + Perf)
   - Run Security
3) The UI calls the corresponding `/api/run/*` route, which dispatches the GitHub Action.
4) When the workflow finishes, open the relevant links in the UI:
   - `Reports` → Lighthouse HTML and JSON
   - `Open Playwright HTML Report`
   - `Security Reports` page loads from `/reports/*` via the proxy.

### Notes on Real-World Penetration Testing

- Only run scans on targets you own or have explicit written permission to test.
- ZAP baseline mode is included as an optional flag; full active scans should be run with caution and limits.
- Rate-limit your workflows or schedule windows to avoid overloading targets.
- Keep tokens and secrets in Vercel and GitHub Encrypted Secrets; never commit secrets to source.
