const LOCAL_STORAGE_KEY = "dark-mode-enabler";
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
 * Apply saved preferences to the current page
 *
 */
function applySavedPreferences() {
  let hostname = window.location.hostname;
  let settings = getSettings();

  if (settings[hostname]) {
    document.body.style.filter = OPTIONS[settings[hostname]];
  }
}

// Apply preferences when the script loads
applySavedPreferences();
