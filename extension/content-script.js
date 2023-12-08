const STORAGE_KEY = "darkModeSettings";
const OPTIONS = {
  DARK: "invert(1) hue-rotate(180deg)",
  SEPIA: "sepia(1)",
  GRAY_SCALE: "grayscale(1)",
  DISABLED: "none",
};

/**
 * Add event listener to the chrome runtime message
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { option, hostname } = request;

  if (option in OPTIONS) {
    document.body.style.filter = OPTIONS[option];
    document.body.style.backgroundColor = option === "DARK" ? "#000" : "";

    if (hostname) {
      saveSettings(hostname, option);
    }
  }

  sendResponse({ message: "success" });
});

/**
 * Save settings to chrome.storage
 * @param {string} hostname
 * @param {string} option
 */
function saveSettings(hostname, option) {
  chrome.storage.sync.get([STORAGE_KEY], function (result) {
    const settings = result?.darkModeSettings || {};
    settings[hostname] = option;

    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, function () {
      console.info(`[${STORAGE_KEY}]: Settings saved`);
    });
  });
}

/**
 * Apply saved preferences to the current page
 *
 */
function applySavedPreferences() {
  let hostname = window.location.hostname;

  chrome.storage.sync.get([STORAGE_KEY], function (result) {
    let settings = result.darkModeSettings || {};
    const savedSettings = settings[hostname];

    if (savedSettings) {
      document.body.style.filter = OPTIONS[savedSettings];
    }
  });
}

// Apply preferences when the script loads
applySavedPreferences();
