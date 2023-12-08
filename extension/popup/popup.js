const STORAGE_KEY = "darkModeSettings";
const VERSION = "v1.0.0";
const OPTIONS = {
  1: "DARK",
  2: "SEPIA",
  3: "GRAY_SCALE",
  0: "DISABLED",
};

function showVersion() {
  document.querySelector("#versionNumber").textContent = VERSION;
}

/**
 * Add event listener to the slider input and
 * send message to the content script
 */
document.querySelectorAll('input[name="displayMode"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    const modeValue = this.value;
    let option = OPTIONS[modeValue] || "0";

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const hostname = new URL(tabs[0].url).hostname;

      try {
        chrome.tabs.sendMessage(tabs[0].id, { option, hostname });
      } catch (error) {
        console.error("There was an error sending the message!");
      }
    });
  });
});

function applySavedPreferences(hostname) {
  chrome.storage.sync.get([STORAGE_KEY], function (result) {
    let settings = result.darkModeSettings || {};
    let savedMode = settings[hostname];

    // Set the radio button based on saved settings
    if (settings[hostname]) {
      let defaltValue = "0";

      for (const [key, value] of Object.entries(OPTIONS)) {
        if (value === savedMode) {
          defaltValue = key;
          break;
        }
      }

      document.querySelector(
        `input[name="displayMode"][value="${defaltValue}"]`
      ).checked = true;
    }
  });
}

/**
 * Apply saved preferences to the current page
 */
document.addEventListener("DOMContentLoaded", function () {
  showVersion();

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let hostname = new URL(tabs[0].url).hostname;

    applySavedPreferences(hostname);
  });
});
