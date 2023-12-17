const STORAGE_KEY = "darkModeSettings";
const OPTIONS = {
  DARK: applyDarkModeStyles,
  SEPIA: applySepiaModeStyles,
  GRAY_SCALE: applyGrayScaleModeStyles,
  DISABLED: applyDisabledModeStyles,
};

function applyDisabledModeStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    body {
      filter: none;
      background-color: inherit;
    }

    *::selection {
      background: #ee0;
      color: #222;
    }
  `;
  document.head.appendChild(style);
}

function applyGrayScaleModeStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    body {
      filter: grayscale(1);
    }

    *::selection {
      background: #8e8e0f;
      color: #000;
    }
  `;
  document.head.appendChild(style);
}

function applySepiaModeStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    body {
      filter: sepia(1);
    }

    *::selection {
      background: #8e8e0f;
      color: #000;
    }
  `;
  document.head.appendChild(style);
}

function applyDarkModeStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    body {
      filter: invert(1) hue-rotate(180deg);
      background-color: #000;
    }

    *::selection {
      background: #8e8e0f;
      color: #000;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Add event listener to the chrome runtime message
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { option, hostname } = request;

  if (option in OPTIONS) {
    const applyStyles = OPTIONS[option];

    if (typeof applyStyles === "function") {
      applyStyles();
    }

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
