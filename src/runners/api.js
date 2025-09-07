import newman from 'newman';
import chalk from 'chalk';

export async function runApi({ collection, env }) {
  console.log(chalk.cyan(`Running Newman on collection: ${collection}${env ? ` with env: ${env}` : ''}`));
  await new Promise((resolve, reject) => {
    newman.run(
      {
        collection,
        environment: env,
        reporters: 'cli',
      },
      function (err, summary) {
        if (err) return reject(err);
        const failed = summary.run.failures?.length || 0;
        if (failed > 0) {
          return reject(new Error(`${failed} API test(s) failed.`));
        }
        resolve();
      }
    );
  });
  console.log(chalk.green('API tests passed.'));
}
