const assert = require('assert')
const spec = require('../../src/spec-driver')

describe('spec driver', async () => {
  let driver, destroyDriver
  const url = 'https://applitools.github.io/demo/TestPages/FramesTestPage/'

  describe('headless desktop', async () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
      driver = spec.transformDriver(driver)
      await driver.get(url)
    })

    after(async () => {
      await destroyDriver()
    })

    it('isDriver(driver)', isDriver({expected: true}))
    it('isDriver(wrong)', isDriver({input: {}, expected: false}))
    it(
      'isElement(element)',
      isElement({input: () => driver.findElement({css: 'div'}), expected: true}),
    )
    it(
      'isElement(element-finder)',
      isElement({input: () => driver.element({css: 'div'}), expected: true}),
    )
    it('isElement(wrong)', isElement({input: () => ({}), expected: false}))
    it('isSelector(string)', isSelector({input: 'div', expected: true}))
    it('isSelector(by)', isSelector({input: {xpath: '//div'}, expected: true}))
    it('isSelector(wrong)', isSelector({input: {}, expected: false}))
    it(
      'isEqualElements(element, element)',
      isEqualElements({
        input: () =>
          driver
            .findElement({css: 'div'})
            .then(element => ({element1: element, element2: element})),
        expected: true,
      }),
    )
    it(
      'isEqualElements(element1, element2)',
      isEqualElements({
        input: async () => ({
          element1: await driver.findElement({css: 'div'}),
          element2: await driver.findElement({css: 'h1'}),
        }),
        expected: false,
      }),
    )
    it('executeScript(strings, ...args)', executeScript())
    it('findElement(by-hash)', findElement({input: {css: '#overflowing-div'}}))
    it('findElements(by-hash)', findElements({input: {css: 'div'}}))
    it('findElement(non-existent)', findElement({input: 'non-existent', expected: null}))
    it('findElements(non-existent)', findElements({input: 'non-existent', expected: []}))
    it('mainContext()', mainContext())
    it('parentContext()', parentContext())
    it('childContext(element)', childContext())
    it('getSessionId()', getSessionId())
    it('getTitle()', getTitle())
    it('getUrl()', getUrl())
    it('visit()', visit())
    it('isMobile()', isMobile({expected: false}))
    it('getPlatformName()', getPlatformName({expected: 'linux'}))
  })

  describe('headless desktop (@angular)', async () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
      driver = spec.transformDriver(driver)
      await driver.get('https://applitools.github.io/demo/TestPages/AngularPage/')
      await driver.waitForAngular()
    })

    after(async () => {
      await destroyDriver()
    })

    it('findElement(by-ng)', findElement({input: () => driver.by.model('name')}))
    it('findElements(by-ng)', findElements({input: () => driver.by.model('name')}))
  })

  describe('onscreen desktop (@webdriver)', async () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome', headless: false})
    })

    after(async () => {
      await destroyDriver()
    })

    it('getWindowRect()', getWindowRect())
    it(
      'setWindowRect({x, y, width, height})',
      setWindowRect({
        input: {x: 0, y: 0, width: 510, height: 511},
        expected: {x: 0, y: 0, width: 510, height: 511},
      }),
    )
    it(
      'setWindowRect({x, y})',
      setWindowRect({
        input: {x: 11, y: 12},
        expected: {x: 11, y: 12, width: 510, height: 511},
      }),
    )
    it(
      'setWindowRect({width, height})',
      setWindowRect({
        input: {width: 551, height: 552},
        expected: {x: 11, y: 12, width: 551, height: 552},
      }),
    )
  })

  describe('legacy driver (@webdriver)', async () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'ie-11'})
    })

    after(async () => {
      await destroyDriver()
    })

    it('getWindowRect()', getWindowRect())
    it(
      'setWindowRect({x, y, width, height})',
      setWindowRect({
        input: {x: 0, y: 0, width: 510, height: 511},
        expected: {x: 0, y: 0, width: 510, height: 511},
      }),
    )
    it(
      'setWindowRect({x, y})',
      setWindowRect({
        input: {x: 11, y: 12},
        expected: {x: 11, y: 12, width: 510, height: 511},
      }),
    )
    it(
      'setWindowRect({width, height})',
      setWindowRect({
        input: {width: 551, height: 552},
        expected: {x: 11, y: 12, width: 551, height: 552},
      }),
    )
    it('getPlatformName()', getPlatformName({expected: 'WINDOWS'}))
  })

  describe('mobile driver (@mobile)', async () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome', device: 'Pixel 3a XL'})
    })

    after(async () => {
      await destroyDriver()
    })

    it('isMobile()', isMobile({expected: true}))
    it('getDeviceName()', getDeviceName({expected: 'Google Pixel 3a XL GoogleAPI Emulator'}))
    it('getPlatformName()', getPlatformName({expected: 'Android'}))
    it('isNative()', isNative({expected: false}))
    it('getOrientation()', getOrientation({expected: 'portrait'}))
    it('getPlatformVersion()', getPlatformVersion({expected: '10'}))
  })

  function isDriver({input, expected}) {
    return async () => {
      const isDriver = await spec.isDriver(input || driver)
      assert.strictEqual(isDriver, expected)
    }
  }
  function isElement({input, expected}) {
    return async () => {
      const element = await input()
      const isElement = await spec.isElement(element)
      assert.strictEqual(isElement, expected)
    }
  }
  function isSelector({input, expected}) {
    return async () => {
      const isSelector = await spec.isSelector(input)
      assert.strictEqual(isSelector, expected)
    }
  }
  function isEqualElements({input, expected}) {
    return async () => {
      const {element1, element2} = await input()
      const result = await spec.isEqualElements(driver, element1, element2)
      assert.deepStrictEqual(result, expected)
    }
  }
  function executeScript() {
    return async () => {
      const args = [0, 'string', {key: 'value'}, [0, 1, 2, 3]]
      const expected = await driver.executeScript('return arguments', ...args)
      const result = await spec.executeScript(driver, 'return arguments', ...args)
      assert.deepStrictEqual(result, expected)
    }
  }
  function mainContext() {
    return async () => {
      try {
        const mainDocument = await driver.findElement({css: 'html'})
        await driver.switchTo().frame(await driver.findElement({css: '[name="frame1"]'}))
        await driver.switchTo().frame(await driver.findElement({css: '[name="frame1-1"]'}))
        const frameDocument = await driver.findElement({css: 'html'})
        assert.ok(!(await spec.isEqualElements(driver, mainDocument, frameDocument)))
        await spec.mainContext(driver)
        const resultDocument = await driver.findElement({css: 'html'})
        assert.ok(await spec.isEqualElements(driver, resultDocument, mainDocument))
      } finally {
        await driver
          .switchTo()
          .defaultContent()
          .catch(() => null)
      }
    }
  }
  function parentContext() {
    return async () => {
      try {
        await driver.switchTo().frame(await driver.findElement({css: '[name="frame1"]'}))
        const parentDocument = await driver.findElement({css: 'html'})
        await driver.switchTo().frame(await driver.findElement({css: '[name="frame1-1"]'}))
        const frameDocument = await driver.findElement({css: 'html'})
        assert.ok(!(await spec.isEqualElements(driver, parentDocument, frameDocument)))
        await spec.parentContext(driver)
        const resultDocument = await driver.findElement({css: 'html'})
        assert.ok(await spec.isEqualElements(driver, resultDocument, parentDocument))
      } finally {
        await driver
          .switchTo()
          .frame(null)
          .catch(() => null)
      }
    }
  }
  function childContext() {
    return async () => {
      try {
        const element = await driver.findElement({css: '[name="frame1"]'})
        await driver.switchTo().frame(element)
        const expectedDocument = await driver.findElement({css: 'html'})
        await driver.switchTo().frame(null)
        await spec.childContext(driver, element)
        const resultDocument = await driver.findElement({css: 'html'})
        assert.ok(await spec.isEqualElements(driver, resultDocument, expectedDocument))
      } finally {
        await driver
          .switchTo()
          .frame(null)
          .catch(() => null)
      }
    }
  }
  function findElement({input, expected} = {}) {
    return async () => {
      input = typeof input === 'function' ? input() : input
      const result = expected !== undefined ? expected : await driver.findElement(input)
      const element = await spec.findElement(driver, input)
      if (element !== result) {
        assert.ok(await spec.isEqualElements(driver, element, result))
      }
    }
  }
  function findElements({input, expected} = {}) {
    return async () => {
      input = typeof input === 'function' ? input() : input
      const result = expected !== undefined ? expected : await driver.findElements(input)
      const elements = await spec.findElements(driver, input)
      assert.strictEqual(elements.length, result.length)
      for (const [index, element] of elements.entries()) {
        assert.ok(await spec.isEqualElements(driver, element, result[index]))
      }
    }
  }
  function getWindowRect() {
    return async () => {
      const {x, y} = await driver
        .manage()
        .window()
        .getPosition()
      const {width, height} = await driver
        .manage()
        .window()
        .getSize()
      const rect = {x, y, width, height}
      const result = await spec.getWindowRect(driver)
      assert.deepStrictEqual(result, rect)
    }
  }
  function setWindowRect({input, expected} = {}) {
    return async () => {
      await spec.setWindowRect(driver, input)
      const {x, y} = await driver
        .manage()
        .window()
        .getPosition()
      const {width, height} = await driver
        .manage()
        .window()
        .getSize()
      const rect = {x, y, width, height}
      assert.deepStrictEqual(rect, expected)
    }
  }
  function getOrientation({expected} = {}) {
    return async () => {
      const result = await spec.getOrientation(driver)
      assert.strictEqual(result, expected)
    }
  }
  function getSessionId() {
    return async () => {
      const session = await driver.getSession()
      const expected = await session.getId()
      const {sessionId} = await spec.getDriverInfo(driver)
      assert.deepStrictEqual(sessionId, expected)
    }
  }
  function getTitle() {
    return async () => {
      const expected = await driver.getTitle()
      const result = await spec.getTitle(driver)
      assert.deepStrictEqual(result, expected)
    }
  }
  function getUrl() {
    return async () => {
      const result = await spec.getUrl(driver)
      assert.deepStrictEqual(result, url)
    }
  }
  function visit() {
    return async () => {
      const blank = 'about:blank'
      await spec.visit(driver, blank)
      const actual = await driver.getCurrentUrl()
      assert.deepStrictEqual(actual, blank)
      await driver.get(url)
    }
  }
  function isMobile({expected} = {}) {
    return async () => {
      const {isMobile} = await spec.getDriverInfo(driver)
      assert.deepStrictEqual(isMobile, expected)
    }
  }
  function isNative({expected} = {}) {
    return async () => {
      const {isNative} = await spec.getDriverInfo(driver)
      assert.strictEqual(isNative, expected)
    }
  }
  function getDeviceName({expected} = {}) {
    return async () => {
      const {deviceName} = await spec.getDriverInfo(driver)
      assert.strictEqual(deviceName, expected)
    }
  }
  function getPlatformName({expected} = {}) {
    return async () => {
      const {platformName} = await spec.getDriverInfo(driver)
      assert.strictEqual(platformName, expected)
    }
  }
  function getPlatformVersion({expected} = {}) {
    return async () => {
      const {platformVersion} = await spec.getDriverInfo(driver)
      assert.strictEqual(platformVersion, expected)
    }
  }
})
