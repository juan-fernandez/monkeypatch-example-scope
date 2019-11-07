const button = document.getElementById("slowDownRequest");

button.onclick = () => {
  chrome.runtime.sendMessage({ type: "SLOW_DOWN_REQUESTS" });
};
