const CONSTANT = 'CONSTANT'
const DELAY_TIME = 4000

const getJavascriptCodeToExecute = code =>
  `
    var el = document.createElement('script')
    el.type = 'text/javascript'
    el.innerHTML = \`${code}\`
    document.head.appendChild(el)
  `

const doAsyncTask = delay => new Promise(resolve => setTimeout(() => resolve([]), delay))

const getInstrumentFetchCode = () =>
  `
    const previousFetch = window.fetch
    window.fetch = (...args) => {
      console.log('I need a ${CONSTANT} in this monkey patched code.')
      return (${doAsyncTask.toString()})(${DELAY_TIME}).then(asyncTaskResult => {
        const newFetchArgs = [...args, ...asyncTaskResult]
        return previousFetch(...newFetchArgs).then(response => {
          console.log('This is the delayed response:', response)
          return response
        })
      })
    }
  `

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type } = request

  switch (type) {
    case 'SLOW_DOWN_REQUESTS':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        let currentTabId
        try {
          const [currentTab] = tabs
          currentTabId = currentTab.id
        } catch (e) {}
        chrome.tabs.executeScript(currentTabId, {
          code: getJavascriptCodeToExecute(getInstrumentFetchCode()),
          runAt: 'document_start',
        })
        chrome.tabs.executeScript(currentTabId, {
          file: '/user-events.js',
          allFrames: true,
        })
      })

      break
  }
})
