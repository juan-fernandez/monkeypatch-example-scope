const CONSTANT_NAME = "CONSTANT_NAME";

const getJavascriptCodeToExecute = code => 
  `
    var el = document.createElement('script')
    el.type = 'text/javascript'
    el.innerHTML = \`${code}\`
    document.head.appendChild(el)
  `


const doAsyncTask = () => 
  new Promise(resolve => 
      setTimeout(resolve, 5000);
  );


const getInstrumentFetchCode = () => 
  `
    const previousFetch = window.fetch
    window.fetch = (...args) => {
      console.log("I need a ${CONSTANT_NAME}")
      return (${doAsyncTask.toString()})().then(() => {
        return previousFetch(...args).then(response => {
          console.log('This is the delayed response', response)
          return response
        })
      })
    }
  `


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type } = request;

  switch (type) {
    case "SLOW_DOWN_REQUESTS":
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        let currentTabId;
        try {
          const [currentTab] = tabs;
          currentTabId = currentTab.id;
        } catch (e) {}
        chrome.tabs.executeScript(currentTabId, {
          code: getJavascriptCodeToExecute(getInstrumentFetchCode()),
          runAt: "document_start"
        });
        chrome.tabs.executeScript(currentTabId, {
          file: "/user-events.js",
          allFrames: true
        });
      });

      break;
  }
});
