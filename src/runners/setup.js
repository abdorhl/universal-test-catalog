import { execa } from 'execa';
import chalk from 'chalk';

export async function runSetup({ browsers = true } = {}) {
  console.log(chalk.cyan('UTC setup starting...'));
  if (browsers) {
    console.log(chalk.cyan('Installing Playwright browsers (chromium, firefox, webkit)...'));
    // Do not pass fancy characters; plain command for Windows PowerShell compatibility
    await execa('npx', ['playwright', 'install'], { stdio: 'inherit' });
  }
  console.log(chalk.green('Setup complete.'));
}

// Allow direct run via `node src/runners/setup.js`
if (process.argv[1] && process.argv[1].endsWith('setup.js')) {
  runSetup().catch((err) => {
    console.error(chalk.red('Setup failed:'), err?.stderr || err?.message || err);
    process.exit(1);
  });
}
