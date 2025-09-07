#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { runWeb } from './runners/web.js';
import { runPerf } from './runners/perf.js';
import { runApi } from './runners/api.js';
import { runMobileScaffold } from './runners/mobile.js';
import { runSetup } from './runners/setup.js';
import { runWizard } from './runners/wizard.js';
import { runSecurity } from './runners/security.js';

const program = new Command();
program
  .name('utc')
  .description('Universal Test Catalog CLI')
  .version('0.1.0');

program
  .command('web')
  .description('Run web tests (smoke + accessibility) against a URL')
  .requiredOption('-u, --url <url>', 'Target website URL, e.g., https://example.com')
  .option('--no-a11y', 'Disable accessibility checks with axe (default: enabled)')
  .option('--a11y-strict', 'Fail the run on accessibility violations (default: warn-only)')
  .option('--lenient', 'Increase timeouts for slow sites')
  .option('--grep <pattern>', 'Only run tests matching a Playwright grep pattern')
  .action(async (opts) => {
    try {
      await runWeb(opts);
    } catch (err) {
      console.error(chalk.red('Web tests failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('perf')
  .description('Run Lighthouse performance audit')
  .requiredOption('-u, --url <url>', 'Target website URL, e.g., https://example.com')
  .option('-d, --desktop', 'Run desktop mode (default mobile)', false)
  .action(async (opts) => {
    try {
      await runPerf(opts);
    } catch (err) {
      console.error(chalk.red('Performance audit failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('api')
  .description('Run API tests via Newman on a Postman collection')
  .requiredOption('-c, --collection <path>', 'Path to Postman collection JSON file')
  .option('-e, --env <path>', 'Path to Postman environment JSON file')
  .action(async (opts) => {
    try {
      await runApi(opts);
    } catch (err) {
      console.error(chalk.red('API tests failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('mobile')
  .description('Show Appium mobile testing scaffold and next steps')
  .action(async () => {
    try {
      await runMobileScaffold();
    } catch (err) {
      console.error(chalk.red('Mobile scaffold error:'), err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('setup')
  .description('Install Playwright browsers and perform initial setup')
  .action(async () => {
    try {
      await runSetup();
    } catch (err) {
      console.error(chalk.red('Setup failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('quick')
  .description('Run a quick suite: web (lenient) then performance audit')
  .requiredOption('-u, --url <url>', 'Target website URL, e.g., https://example.com')
  .option('--no-a11y', 'Disable accessibility checks (default enabled, warn-only)')
  .option('--a11y-strict', 'Fail on accessibility violations')
  .action(async (opts) => {
    try {
      console.log(chalk.cyan('Quick run: Web (lenient)'));
      await runWeb({ url: opts.url, a11y: opts.a11y, a11yStrict: opts.a11yStrict, lenient: true });
    } catch (err) {
      console.error(chalk.red('Quick run web step failed:'), err?.stderr || err?.message || err);
      // continue to perf even if web failed? choose to continue
    }
    try {
      console.log(chalk.cyan('Quick run: Performance (mobile preset)'));
      await runPerf({ url: opts.url, desktop: false });
    } catch (err) {
      console.error(chalk.red('Quick run performance step failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('wizard')
  .description('Interactive wizard to run tests')
  .action(async () => {
    try {
      await runWizard();
    } catch (err) {
      console.error(chalk.red('Wizard failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program
  .command('security')
  .description('Run network security suite (headers, TLS, HAR; optional ZAP)')
  .requiredOption('-u, --url <url>', 'Target website URL, e.g., https://example.com')
  .option('--no-headers', 'Skip HTTP security headers audit')
  .option('--no-tls', 'Skip SSL Labs TLS scan')
  .option('--no-har', 'Skip capturing HAR network traffic')
  .option('--zap', 'Run OWASP ZAP Baseline scan (requires Docker)')
  .action(async (opts) => {
    try {
      await runSecurity({ url: opts.url, headers: opts.headers, tls: opts.tls, har: opts.har, zap: opts.zap });
    } catch (err) {
      console.error(chalk.red('Security suite failed:'), err?.stderr || err?.message || err);
      process.exitCode = 1;
    }
  });

program.parseAsync();
