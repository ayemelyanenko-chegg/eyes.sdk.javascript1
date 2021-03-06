'use strict'

const {Builder} = require('selenium-webdriver')
const {Eyes, Target, ConsoleLogHandler, StitchMode} = require('../index') // should be replaced to '@applitools/eyes-selenium'

;(async () => {
  // Open a Chrome browser.
  const driver = new Builder()
    .usingServer('https://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities({
      browserName: 'Safari',
      browserVersion: '12',

      'bstack:options': {
        deviceName: 'iPhone XS',
        osVersion: '12',
        realMobile: 'true',

        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      },
    })
    .build()

  // Initialize the eyes SDK and set your private API key.
  const eyes = new Eyes()
  // eyes.setApiKey('Your API Key');
  eyes.setLogHandler(new ConsoleLogHandler(false))
  // eyes.setProxy('http://localhost:8888');

  eyes.setSaveNewTests(false) // Because we want Applitools to never save new tests automatically
  eyes.setForceFullPageScreenshot(true)
  eyes.setStitchMode(StitchMode.CSS)
  eyes.setHideScrollbars(true)

  try {
    // Start the test and set the browser's viewport size to 800x600.
    await eyes.open(driver, 'Eyes Examples', 'SauceLabs Example', {width: 800, height: 600})

    // Navigate the browser to the "hello world!" web-site.
    await driver.get('https://google.com/ncr')

    // Visual checkpoint #1.
    await eyes.check('Main Page', Target.window())

    // End the test.
    await eyes.close()
  } finally {
    // Close the browser.
    await driver.quit()

    // If the test was aborted before eyes.close was called ends the test as aborted.
    await eyes.abort()
  }
})()
