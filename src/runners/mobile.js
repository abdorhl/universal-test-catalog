import chalk from 'chalk';

export async function runMobileScaffold() {
  console.log(chalk.yellow('Mobile testing scaffold with Appium'));
  console.log('\nPrerequisites:');
  console.log('- Install Appium: npm i -g appium');
  console.log('- Install driver(s): appium driver install uiautomator2 (Android), xcuitest (iOS)');
  console.log('- Android SDK / Xcode set up, devices/emulators available');
  console.log('\nRecommended project additions:');
  console.log('- Create tests/mobile/sample.test.js using WebdriverIO or Appium client');
  console.log('- Provide app under test (.apk/.aab or .ipa) or use a browser session');
  console.log('\nSample JavaScript test (WebdriverIO-style):');
  console.log(`
const wdio = require('webdriverio');
(async () => {
  const caps = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:platformVersion': '13',
    'appium:appPackage': '<your.app.package>',
    'appium:appActivity': '<your.app.activity>',
    'appium:noReset': true
  };
  const driver = await wdio.remote({ protocol: 'http', hostname: 'localhost', port: 4723, path: '/', capabilities: caps });
  // TODO: Add interactions/assertions here
  await driver.deleteSession();
})();
  `.trim());
  console.log('\nNext steps:');
  console.log('- Add your app capabilities and first test.');
  console.log('- We can integrate WDIO runner and reports in the next iteration.');
}
