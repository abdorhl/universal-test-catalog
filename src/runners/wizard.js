import prompts from 'prompts';
import chalk from 'chalk';
import { runWeb } from './web.js';
import { runPerf } from './perf.js';
import { runApi } from './api.js';
import { runMobileScaffold } from './mobile.js';

export async function runWizard() {
  console.log(chalk.cyan('UTC Wizard'));

  const base = await prompts([
    {
      type: 'text',
      name: 'url',
      message: 'Target URL (for web/perf):',
      validate: (v) => (v && /^https?:\/\//.test(v) ? true : 'Enter a valid http(s) URL'),
    },
    {
      type: 'multiselect',
      name: 'steps',
      message: 'Select which tests to run:',
      choices: [
        { title: 'Web (Playwright)', value: 'web', selected: true },
        { title: 'Performance (Lighthouse)', value: 'perf', selected: true },
        { title: 'API (Newman - Postman collection required)', value: 'api' },
        { title: 'Mobile scaffold (Appium instructions)', value: 'mobile' },
      ],
      instructions: false,
      hint: 'Use space to select, enter to confirm',
    },
  ]);

  if (!base || !base.url || !base.steps?.length) {
    console.log(chalk.yellow('Wizard cancelled.'));
    return;
  }

  let webOpts = {};
  if (base.steps.includes('web')) {
    const ans = await prompts([
      {
        type: 'toggle',
        name: 'a11y',
        message: 'Enable accessibility checks?',
        initial: true,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: (prev) => (prev ? 'toggle' : null),
        name: 'a11yStrict',
        message: 'Fail on accessibility violations?',
        initial: false,
        active: 'strict',
        inactive: 'warn-only',
      },
      {
        type: 'toggle',
        name: 'lenient',
        message: 'Use lenient timeouts (good for slow sites)?',
        initial: true,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: 'text',
        name: 'grep',
        message: 'Only run tests matching (optional grep pattern):',
      },
    ]);
    webOpts = ans;
  }

  let apiOpts = {};
  if (base.steps.includes('api')) {
    const ans = await prompts([
      {
        type: 'text',
        name: 'collection',
        message: 'Path to Postman collection JSON:',
        validate: (v) => (v ? true : 'Provide a path to collection'),
      },
      {
        type: 'text',
        name: 'env',
        message: 'Path to Postman environment JSON (optional):',
      },
    ]);
    apiOpts = ans;
  }

  // Execute selected steps in sequence
  if (base.steps.includes('web')) {
    try {
      console.log(chalk.cyan('\n[1/??] Web tests...'));
      await runWeb({ url: base.url, ...webOpts });
    } catch (err) {
      console.error(chalk.red('Web tests failed:'), err?.stderr || err?.message || err);
    }
  }

  if (base.steps.includes('perf')) {
    try {
      console.log(chalk.cyan('\n[2/??] Performance audit (mobile)...'));
      await runPerf({ url: base.url, desktop: false });
    } catch (err) {
      console.error(chalk.red('Performance audit failed:'), err?.stderr || err?.message || err);
    }
  }

  if (base.steps.includes('api')) {
    try {
      console.log(chalk.cyan('\n[3/??] API tests...'));
      await runApi(apiOpts);
    } catch (err) {
      console.error(chalk.red('API tests failed:'), err?.stderr || err?.message || err);
    }
  }

  if (base.steps.includes('mobile')) {
    await runMobileScaffold();
  }

  console.log(chalk.green('\nWizard finished.'));
}
