import browser from 'webextension-polyfill'

export async function getDomCapture(tabId) {
  const enableDomCapture = await isDomCaptureEnabled()
  if (!enableDomCapture) return false

  return parseOutExternalFrames(await runDomScript(tabId, 'domCapture'))
}

export async function getDomSnapshot(tabId) {
  return (await runDomScript(tabId, 'domSnapshot'))[0]
}

export async function isDomCaptureEnabled() {
  const { enableDomCapture } = await browser.storage.local.get([
    'enableDomCapture',
  ])

  return enableDomCapture
}

let scriptCount = 0

async function runDomScript(tabId, scriptType) {
  scriptCount++
  const id = scriptCount
  browser.tabs.executeScript(tabId, {
    code: `window.execDomScript(${id}, '${scriptType}').then(result => { window.__eyes__${id} = result; }).catch()`,
  })

  return new Promise((res, rej) => {
    let startTime = new Date()
    const domCapRetry = setInterval(() => {
      let elapsed = new Date() - startTime
      if (elapsed >= 300000) {
        clearInterval(domCapRetry)
        rej('Unable to capture DOM within the timeout specified')
      }
      browser.tabs
        .executeScript(tabId, {
          code: `window.__eyes__${id};`,
        })
        .then(result => {
          // eslint-disable-next-line
          console.log(
            `[${elapsed}ms]: ${
              result && result[0] ? result : 'No DOM Capture result yet'
            }`
          )
          if (result && result[0]) {
            browser.tabs.executeScript(tabId, {
              code: `delete window.__eyes__${id};`,
            })
            clearInterval(domCapRetry)
            res(result)
          }
        })
    }, 100)
  })
}

export function parseOutExternalFrames(input = []) {
  if (input && input[0]) {
    const cap = input[0]
    const firstLineEnd = cap.indexOf('\n')
    const meta = JSON.parse(cap.substr(0, firstLineEnd))
    const sepLength = (meta.separator + '\n').length
    const rest = cap.substr(cap.indexOf(meta.separator + '\n') + sepLength)
    const sepLocation = rest.indexOf(meta.separator + '\n')
    const frames = rest
      .substr(0, sepLocation)
      .split('\n')
      .filter(f => !!f)
    const snapshot = rest.substr(sepLocation + sepLength)
    let result = snapshot

    frames.forEach(frame => {
      result = result.replace(
        `${meta.iframeStartToken}${frame}${meta.iframeEndToken}`,
        ''
      )
    })

    return result
  }
}
