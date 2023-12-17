const STORAGE_KEY = "darkModeSettings";
const OPTIONS = {
  DARK: applyDarkModeStyles,
  SEPIA: applySepiaModeStyles,
  GRAY_SCALE: applyGrayScaleModeStyles,
  DISABLED: applyDisabledModeStyles,
};
const darkModeStylesId = "dark-mode-styles";

const css = `
  body.dark-mode {
    filter: invert(0.9) hue-rotate(180deg);
    background-color: #000;
  }

  /* Avoid filter effect for images */
  body.dark-mode img,
  body.dark-mode video,
  body.dark-mode picture,
  body.dark-mode svg,
  body.dark-mode canvas {
    filter: invert(1) hue-rotate(-180deg);
  }

  body.dark-mode *::selection {
    background: #220;
    color: #eee;
  }

  body.gray-scale-mode {
    filter: grayscale(1);
  }

  body.gray-scale-mode *::selection {
    background: #8e8e0f;
    color: #000;
  }

  body.sepia-mode {
    filter: sepia(1);
  }

  body.sephia *::selection {
    background: #8e8e0f;
    color: #000;
  }
`;

/**
 * Remove the custom CSS
 */
function removeCustomCSS() {
  const existingStyle = document.getElementById("dark-mode-styles");

  if (existingStyle) {
    existingStyle.remove();
  }
}

/**
 * Include the custom CSS
 */
function includeCustomCSS() {
  const existingStyle = document.getElementById(darkModeStylesId);

  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = darkModeStylesId;
    style.innerHTML = css;
    document.head.appendChild(style);
  }
}

function addClassNameToBody(className) {
  const classesToRemove = ["dark-mode", "gray-scale-mode", "sepia-mode"];
  classesToRemove.forEach((c) => document.body.classList.remove(c));

  if (className) {
    document.body.classList.add(className);
  }
}

function applyDisabledModeStyles() {
  removeCustomCSS();
  addClassNameToBody("");
}

function applyGrayScaleModeStyles() {
  includeCustomCSS();
  addClassNameToBody("gray-scale-mode");
}

function applyDarkModeStyles() {
  includeCustomCSS();
  addClassNameToBody("dark-mode");
}

function applySepiaModeStyles() {
  includeCustomCSS();
  addClassNameToBody("sepia-mode");
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

    if (savedSettings && savedSettings in OPTIONS) {
      const applyStyles = OPTIONS[savedSettings];

      if (typeof applyStyles === "function") {
        applyStyles();
      }
    }
  });
}

// Apply preferences when the script loads
applySavedPreferences();
