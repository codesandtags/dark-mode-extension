import { localiseDocument, t } from "@/lib/i18n";
import {
  APPEARANCE_CONTROLS,
  APPEARANCE_KEY,
  DEFAULT_APPEARANCE,
  MODES,
  NATIVE_DARK,
  isDefaultAppearance,
  isKnownMode,
  isNativeDarkState,
  normaliseAppearance,
  siteKey,
  tabStateKey,
  type Appearance,
  type Mode,
  type NativeDarkState,
} from "@/lib/settings";

/**
 * The popup owns persistence.
 *
 * It writes browser.storage.local directly and lets the content script's
 * storage.onChanged listener repaint every affected tab. There is deliberately
 * no tabs.sendMessage anywhere: the pre-2.0 build relied on it and swallowed its
 * failures, because sendMessage reports a missing receiver through
 * runtime.lastError rather than by throwing, so the surrounding try/catch never
 * fired. On any page without a content script the user saw the radio move and
 * the choice quietly vanish.
 */

/** Schemes no extension is allowed to inject into. */
const BLOCKED_PROTOCOLS = [
  "chrome:",
  "chrome-extension:",
  "chrome-untrusted:",
  "devtools:",
  "edge:",
  "about:",
  "moz-extension:",
  "view-source:",
];

/** Browsers block content scripts on their own store regardless of permissions. */
const BLOCKED_HOSTNAMES = [
  "chromewebstore.google.com",
  "addons.mozilla.org",
  "microsoftedge.microsoft.com",
];

/**
 * Dragging a slider fires `input` continuously. Storage writes are cheap but not
 * free, and every write wakes a listener in every open tab, so coalesce them.
 */
const WRITE_DEBOUNCE_MS = 120;

let activeHostname: string | null = null;
let currentMode: Mode = MODES.DISABLED;
let nativeDark: NativeDarkState = NATIVE_DARK.UNKNOWN;
let appearance: Appearance = { ...DEFAULT_APPEARANCE };
let writeTimer: number | undefined;

const modeInputs = () =>
  document.querySelectorAll<HTMLInputElement>('input[name="displayMode"]');

const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

/* --------------------------------------------------------------------------
 * Rendering
 * ----------------------------------------------------------------------- */

/**
 * Slider rows are generated from APPEARANCE_CONTROLS rather than written out in
 * the HTML, so ranges and labels have exactly one definition.
 */
function buildSliders() {
  const container = el("sliders");

  for (const control of APPEARANCE_CONTROLS) {
    const row = document.createElement("div");
    row.className = "slider";

    const head = document.createElement("div");
    head.className = "slider__head";

    const label = document.createElement("label");
    label.className = "slider__label";
    label.htmlFor = `slider-${control.key}`;
    label.textContent = t(control.labelKey);
    label.title = t(control.hintKey);

    const value = document.createElement("output");
    value.className = "slider__value";
    value.id = `value-${control.key}`;
    value.htmlFor = `slider-${control.key}`;

    const input = document.createElement("input");
    input.className = "slider__input";
    input.type = "range";
    input.id = `slider-${control.key}`;
    input.min = String(control.min);
    input.max = String(control.max);
    input.step = String(control.step);

    input.addEventListener("input", () => {
      appearance = { ...appearance, [control.key]: Number(input.value) };
      renderAppearance();
      queueAppearanceWrite();
    });

    head.append(label, value);
    row.append(head, input);
    container.append(row);
  }
}

function renderAppearance() {
  for (const control of APPEARANCE_CONTROLS) {
    const input = el<HTMLInputElement>(`slider-${control.key}`);
    const output = el<HTMLOutputElement>(`value-${control.key}`);
    const current = appearance[control.key];

    input.value = String(current);
    output.textContent = `${current}%`;
  }

  el("resetAppearance").hidden = isDefaultAppearance(appearance);
}

function selectMode(mode: Mode) {
  const radio = document.querySelector<HTMLInputElement>(
    `input[name="displayMode"][value="${mode}"]`
  );

  if (radio) {
    radio.checked = true;
  }

  currentMode = mode;
  renderAppearanceVisibility();
  renderNativeDark();
}

/**
 * Appearance only means anything once a mode is on — the filters it feeds are
 * declared inside the per-mode rules in theme.css, so with the site off the
 * sliders move and nothing happens. Showing them anyway reads as broken.
 *
 * The settings themselves stay global; this only hides the controls.
 */
function renderAppearanceVisibility() {
  el("appearanceSection").hidden =
    currentMode === MODES.DISABLED || activeHostname === null;
}

/**
 * Surfaces whether the site looks after dark mode itself.
 *
 * The pill is informational. The warning below it only appears when the user has
 * actually turned inversion on over a page that is already dark, because that
 * combination does not just fail to help — it takes a working dark page and
 * makes it light.
 */
function renderNativeDark() {
  const pill = el("nativeDarkPill");
  const notice = el("nativeDarkNotice");

  pill.hidden = true;
  pill.classList.remove("pill--muted");
  notice.hidden = true;

  if (nativeDark === NATIVE_DARK.ACTIVE) {
    pill.textContent = t("pillAlreadyDark");
    pill.title = t("pillAlreadyDarkTitle");
    pill.hidden = false;

    if (currentMode === MODES.DARK) {
      notice.textContent = t("noticeAlreadyDark");
      notice.hidden = false;
    }

    return;
  }

  if (nativeDark === NATIVE_DARK.AVAILABLE) {
    pill.textContent = t("pillHasDarkTheme");
    pill.title = t("pillHasDarkThemeTitle");
    pill.classList.add("pill--muted");
    pill.hidden = false;
  }
}

/**
 * The verdict is written per tab by the service worker. It may legitimately be
 * missing — the popup can open before the content script has reported, or on a
 * page where no content script runs at all.
 */
async function loadNativeDark(tabId: number | undefined) {
  if (tabId === undefined) {
    return;
  }

  try {
    const key = tabStateKey(tabId);
    const stored = await browser.storage.session.get(key);

    if (isNativeDarkState(stored[key])) {
      nativeDark = stored[key];
    }
  } catch (error) {
    console.error("[dark-mode-enabler] could not read tab state:", error);
  }
}

function showNotice(message: string) {
  const notice = el("notice");
  notice.textContent = message;
  notice.hidden = false;
}

/**
 * Only the mode tiles are disabled on an un-themeable page. Appearance is a
 * global setting, so there is no reason to lock it just because this particular
 * tab happens to be chrome://extensions.
 */
function setModeControlsEnabled(enabled: boolean) {
  modeInputs().forEach((radio) => {
    radio.disabled = !enabled;
  });
}

/* --------------------------------------------------------------------------
 * Persistence
 * ----------------------------------------------------------------------- */

function queueAppearanceWrite() {
  window.clearTimeout(writeTimer);

  writeTimer = window.setTimeout(async () => {
    try {
      await browser.storage.local.set({ [APPEARANCE_KEY]: appearance });
    } catch (error) {
      console.error("[dark-mode-enabler] could not save appearance:", error);
      showNotice(t("noticeSaveFailed"));
    }
  }, WRITE_DEBOUNCE_MS);
}

async function saveMode(mode: Mode) {
  if (!activeHostname) {
    return;
  }

  try {
    await browser.storage.local.set({ [siteKey(activeHostname)]: mode });
  } catch (error) {
    console.error("[dark-mode-enabler] could not save setting:", error);
    showNotice(t("noticeSaveFailed"));
  }
}

/**
 * Returns the hostname the popup should act on, or null when the page cannot be
 * themed. A page we cannot inject into is worth saying out loud — silently doing
 * nothing is what made this feel broken before.
 */
function resolveThemeableHostname(tab: { url?: string } | undefined) {
  if (!tab?.url) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(tab.url);
  } catch {
    return null;
  }

  if (BLOCKED_PROTOCOLS.includes(url.protocol)) {
    return null;
  }

  if (BLOCKED_HOSTNAMES.includes(url.hostname)) {
    return null;
  }

  // file:// pages have no hostname to key settings on.
  return url.hostname || null;
}

async function loadSavedMode(hostname: string): Promise<Mode> {
  const key = siteKey(hostname);
  const stored = await browser.storage.local.get(key);
  const saved = stored[key];

  return isKnownMode(saved) ? saved : MODES.DISABLED;
}

/* --------------------------------------------------------------------------
 * Wiring
 * ----------------------------------------------------------------------- */

modeInputs().forEach((radio) => {
  radio.addEventListener("change", () => {
    if (isKnownMode(radio.value)) {
      currentMode = radio.value;
      renderAppearanceVisibility();
      renderNativeDark();
      void saveMode(radio.value);
    }
  });
});

el("resetAppearance").addEventListener("click", () => {
  appearance = { ...DEFAULT_APPEARANCE };
  renderAppearance();
  queueAppearanceWrite();
});

async function initialise() {
  localiseDocument();
  buildSliders();
  el("versionNumber").textContent = `v${browser.runtime.getManifest().version}`;

  try {
    const stored = await browser.storage.local.get(APPEARANCE_KEY);
    appearance = normaliseAppearance(stored[APPEARANCE_KEY]);
  } catch (error) {
    console.error("[dark-mode-enabler] could not read appearance:", error);
  }

  renderAppearance();

  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    activeHostname = resolveThemeableHostname(tab);

    if (!activeHostname) {
      setModeControlsEnabled(false);
      renderAppearanceVisibility();
      showNotice(t("noticeUnsupported"));
      return;
    }

    el("siteName").textContent = activeHostname;
    await loadNativeDark(tab?.id);
    selectMode(await loadSavedMode(activeHostname));
  } catch (error) {
    console.error("[dark-mode-enabler] could not read the active tab:", error);
    setModeControlsEnabled(false);
    showNotice(t("noticeTabError"));
  }
}

void initialise();
