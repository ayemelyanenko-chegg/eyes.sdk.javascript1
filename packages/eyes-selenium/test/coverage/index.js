require('chromedriver')
const {Builder, By} = require('selenium-webdriver')
const {Options: ChromeOptions} = require('selenium-webdriver/chrome')
const {
  Eyes,
  BatchInfo,
  RectangleSize,
  Target,
  StitchMode,
  VisualGridRunner,
} = require('../../index')
const {makeRunTests} = require('@applitools/sdk-test-kit')

const sdkName = 'eyes-selenium'
const batch = new BatchInfo(`JS Coverage Tests - ${sdkName}`)

async function initialize({displayName, executionMode}) {
  let eyes
  let driver

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new ChromeOptions().headless())
    .build()
  if (executionMode.isVisualGrid) {
    eyes = new Eyes(new VisualGridRunner())
  } else if (executionMode.isCssStitching) {
    eyes = new Eyes()
    eyes.setStitchMode(StitchMode.CSS)
  } else if (executionMode.isScrollStitching) {
    eyes = new Eyes()
    eyes.setStitchMode(StitchMode.SCROLL)
  }
  eyes.setBatch(batch)

  async function visit(url) {
    await driver.get(url)
  }

  async function open(options) {
    driver = await eyes.open(
      driver,
      sdkName,
      displayName,
      RectangleSize.parse(options.viewportSize),
    )
  }

  async function check(options = {}) {
    if (options.isClassicApi) {
      options.locator
        ? await eyes.checkElementBy(By.css(options.locator))
        : await eyes.checkWindow()
    } else {
      options.locator
        ? await eyes.check(undefined, Target.region(By.css(options.locator)).fully())
        : await eyes.check(undefined, Target.window().fully())
    }
  }

  async function close(options) {
    await eyes.close(options)
  }

  async function cleanup() {
    await driver.close()
    await eyes.abortIfNotClosed()
  }

  return {visit, open, check, close, cleanup}
}

const supportedTests = [
  {name: 'checkRegionClassic', executionMode: {isVisualGrid: true}},
  {name: 'checkRegionClassic', executionMode: {isCssStitching: true}},
  {name: 'checkRegionClassic', executionMode: {isScrollStitching: true}},
  {name: 'checkRegionFluent', executionMode: {isVisualGrid: true}},
  {name: 'checkRegionFluent', executionMode: {isCssStitching: true}},
  {name: 'checkRegionFluent', executionMode: {isScrollStitching: true}},
  {name: 'checkWindowClassic', executionMode: {isVisualGrid: true}},
  {name: 'checkWindowClassic', executionMode: {isCssStitching: true}},
  {name: 'checkWindowClassic', executionMode: {isScrollStitching: true}},
  {name: 'checkWindowFluent', executionMode: {isVisualGrid: true}},
  {name: 'checkWindowFluent', executionMode: {isCssStitching: true}},
  {name: 'checkWindowFluent', executionMode: {isScrollStitching: true}},
]

makeRunTests(sdkName, initialize).runTests(supportedTests)
