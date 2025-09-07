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
