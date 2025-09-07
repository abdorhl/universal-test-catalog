import { execa } from 'execa';
import chalk from 'chalk';

export async function runWeb({ url, a11y = true, a11yStrict = false, lenient = false, grep }) {
  console.log(chalk.cyan(`Running web tests on ${url} ...`));
  const env = {
    ...process.env,
    TARGET_URL: url,
    A11Y_ENABLED: a11y ? '1' : '0',
    A11Y_STRICT: a11yStrict ? '1' : '0',
    LENIENT: lenient ? '1' : '0',
  };
  const args = ['playwright', 'test', '--reporter=list'];
  if (grep) {
    args.push('-g', grep);
  }
  // Delegate to Playwright test runner so users can extend tests normally
  await execa('npx', args, { stdio: 'inherit', env });
}
