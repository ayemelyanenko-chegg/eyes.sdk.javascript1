'use strict'

const {
  getProcessPageAndSerializePoll,
  getProcessPageAndSerializePollForIE,
} = require('@applitools/dom-snapshot')
const GeneralUtils = require('./GeneralUtils')
const deserializeDomSnapshotResult = require('./deserializeDomSnapshotResult')

const PULL_TIMEOUT = 200 // ms
const CAPTURE_DOM_TIMEOUT_MS = 5 * 60 * 1000 // 5 min

let scriptBody

async function getScript({disableBrowserFetching}) {
  if (!scriptBody) {
    scriptBody = await getProcessPageAndSerializePoll()
  }
  return `${scriptBody} return __processPageAndSerializePoll(document, {dontFetchResources: ${disableBrowserFetching}});`
}

async function getScriptForIE({disableBrowserFetching}) {
  if (!scriptBody) {
    scriptBody = await getProcessPageAndSerializePollForIE()
  }
  return `${scriptBody} return __processPageAndSerializePollForIE(document, {dontFetchResources: ${disableBrowserFetching}});`
}

function createSelectorMap(snapshot, path = []) {
  const type = 'xpath'
  const map = []

  if (snapshot.crossFramesXPaths.length > 0) {
    snapshot.crossFramesXPaths.forEach(selector =>
      map.push({
        path: path.concat({type, selector}),
        replace: function(innerSnapshot) {
          snapshot.frames.push(innerSnapshot)
        },
      }),
    )
  }

  if (snapshot.frames.length > 0) {
    snapshot.frames.forEach(frame => {
      const {selector} = frame
      selector && map.push(...createSelectorMap(frame, path.concat({type, selector})))
    })
  }

  delete snapshot.selector
  delete snapshot.crossFramesXPaths

  return map
}

async function takeDomSnapshot({driver, startTime = Date.now(), browser, disableBrowserFetching}) {
  const processPageAndPollScript =
    browser === 'IE'
      ? await getScriptForIE({disableBrowserFetching})
      : await getScript({disableBrowserFetching})

  async function getCrossOriginFrames(context, selectorMap) {
    for (const {path, replace} of selectorMap) {
      const references = path.reduce((parent, reference) => {
        return {reference, parent}
      }, null)

      const frameContext = await context.context(references)
      const contextSnapshot = await _takeDomSnapshot(frameContext)
      replace(contextSnapshot)
    }
  }

  async function _takeDomSnapshot(context) {
    const resultAsString = await context.execute(processPageAndPollScript)
    let scriptResponse
    try {
      scriptResponse = JSON.parse(resultAsString)
    } catch (ex) {
      const firstChars = resultAsString.substr(0, 100)
      const lastChars = resultAsString.substr(-100)
      throw new Error(
        `dom snapshot is not a valid JSON string. response length: ${resultAsString.length}, first 100 chars: "${firstChars}", last 100 chars: "${lastChars}". error: ${ex}`,
      )
    }

    if (scriptResponse.status === 'SUCCESS') {
      // create a map
      const selectorMap = createSelectorMap(scriptResponse.value)
      await getCrossOriginFrames(context, selectorMap)
      return scriptResponse.value
    } else if (scriptResponse.status === 'ERROR') {
      throw new Error(`Unable to process dom snapshot: ${scriptResponse.error}`)
    } else if (Date.now() - startTime >= CAPTURE_DOM_TIMEOUT_MS) {
      throw new Error('Timeout is reached.')
    }

    await GeneralUtils.sleep(PULL_TIMEOUT)
    return _takeDomSnapshot(context)
  }

  const snapshot = await _takeDomSnapshot(driver.currentContext)
  return deserializeDomSnapshotResult(snapshot)
}

module.exports = takeDomSnapshot
