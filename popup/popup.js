const LOCAL_STORAGE_KEY = "dark-mode-enabler";
const OPTIONS = {
  DARK: "1",
  SEPIA: "2",
  GRAY_SCALE: "3",
  DISABLED: "0",
};

/**
 * Return current settings from local storage
 * @returns {object} settings
 */
function getSettings() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
}

/**
 * Save settings to local storage
 * @param {string} hostname
 * @param {string} option
 */
function saveSettings(hostname, option) {
  const settings = getSettings();
  settings[hostname] = option;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Add event listener to the slider input and
 * send message to the content script
 */
document.querySelectorAll('input[name="displayMode"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    const modeValue = this.value;
    let option;

    switch (modeValue) {
      case "1": // Dark Mode
        option = "DARK";
        break;
      case "2": // Sepia Mode
        option = "SEPIA";
        break;
      case "3": // Gray Scale Mode
        option = "GRAY_SCALE";
        break;
      default: // Disabled
        option = "DISABLED";
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const hostname = new URL(tabs[0].url).hostname;

      saveSettings(hostname, option);
      chrome.tabs.sendMessage(tabs[0].id, { option, hostname });
    });
  });
});

/**
 * Apply saved preferences to the current page
 */
document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let hostname = new URL(tabs[0].url).hostname;
    let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};

    // Set the radio button based on saved settings
    if (settings[hostname]) {
      const defaltValue = OPTIONS[settings[hostname]] || "0";
      document.querySelector(
        `input[name="displayMode"][value="${defaltValue}"]`
      ).checked = true;
    }
  });
});
