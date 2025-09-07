import { execa } from 'execa';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

export async function runPerf({ url, desktop = false }) {
  console.log(chalk.cyan(`Running Lighthouse on ${url} (${desktop ? 'desktop' : 'mobile'}) ...`));
  const outDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `lighthouse-${desktop ? 'desktop' : 'mobile'}.html`);
  const flags = ['--output=html', `--output-path=${outPath}`, '--quiet'];
  if (desktop) flags.push('--preset=desktop');
  await execa('npx', ['lighthouse', url, ...flags], { stdio: 'inherit' });
  console.log(chalk.green(`Lighthouse report saved to ${outPath}`));
}
