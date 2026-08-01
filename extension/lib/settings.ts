/**
 * Display modes, appearance settings and the storage layout, shared by every
 * entrypoint.
 *
 * Storage design: one chrome.storage.local key per hostname, prefixed with
 * `site:`. Until 2.0.0 every site lived inside a single chrome.storage.sync key,
 * which QUOTA_BYTES_PER_ITEM caps at 8 KB — roughly 290 hostnames, after which
 * writes failed silently. `local` has no per-item cap and is fast enough to read
 * before first paint, which `sync` was not.
 *
 * Appearance is stored once, globally, under its own key. That is deliberate:
 * per-site appearance is what makes Midnight Lizard overwhelming to configure,
 * and Dark Reader's model — global look, per-site on/off — is the one users
 * actually understand.
 *
 * These strings are persisted to user storage. Renaming one is a breaking change
 * that needs a migration in entrypoints/background.ts.
 */

export const MODES = {
  DISABLED: "DISABLED",
  DARK: "DARK",
  SEPIA: "SEPIA",
  GRAY_SCALE: "GRAY_SCALE",
} as const;

export type Mode = (typeof MODES)[keyof typeof MODES];

/**
 * Mode -> value of the attribute set on <html>.
 *
 * DISABLED is deliberately absent: it is expressed by removing the attribute
 * entirely, so a disabled page matches no rule in theme.css at all.
 */
export const THEME_ATTRIBUTE_VALUES = {
  DARK: "dark",
  SEPIA: "sepia",
  GRAY_SCALE: "grayscale",
} as const;

export type ThemedMode = keyof typeof THEME_ATTRIBUTE_VALUES;

export const THEME_ATTRIBUTE = "data-dme-mode";

/** Set on individual images by the classifier — see lib/classify-image.ts. */
export const IMAGE_ATTRIBUTE = "data-dme-img";

export const SITE_KEY_PREFIX = "site:";
export const APPEARANCE_KEY = "appearance";

/** v1.1 kept every site in this single chrome.storage.sync key. */
export const LEGACY_SYNC_KEY = "darkModeSettings";
export const MIGRATION_FLAG = "legacyMigrationCompleted";

/**
 * Whether the page can look after itself.
 *
 * - `active`    the page is *currently* rendering dark. Inverting it makes it
 *               light, which is the single worst thing this extension can do.
 * - `available` the page is light right now, but ships a dark theme of its own
 *               that the user could switch to instead.
 * - `none`      no sign of native support; this is where the extension earns
 *               its keep.
 * - `unknown`   detection has not reported yet, or cannot run on this page.
 */
export const NATIVE_DARK = {
  ACTIVE: "active",
  AVAILABLE: "available",
  NONE: "none",
  UNKNOWN: "unknown",
} as const;

export type NativeDarkState = (typeof NATIVE_DARK)[keyof typeof NATIVE_DARK];

export const NATIVE_DARK_MESSAGE = "dme:native-dark-report";

export type NativeDarkReport = {
  type: typeof NATIVE_DARK_MESSAGE;
  state: NativeDarkState;
};

/**
 * Detection results are per-tab and worthless after a restart, so they live in
 * storage.session rather than local. Content scripts do not have access to
 * session storage by default, which is fine — only the service worker writes it
 * and only the popup reads it.
 */
export function tabStateKey(tabId: number): string {
  return `tab:${tabId}`;
}

export function isNativeDarkState(value: unknown): value is NativeDarkState {
  return (
    typeof value === "string" &&
    (Object.values(NATIVE_DARK) as string[]).includes(value)
  );
}

/**
 * Appearance is stored as whole percentages because that is what the sliders and
 * their labels use. theme.css wants unitless multipliers, so the content script
 * divides by 100 on the way out.
 */
export type Appearance = {
  brightness: number;
  contrast: number;
  sepia: number;
};

export type AppearanceKey = keyof Appearance;

/**
 * Every control only ever *reduces*, and the ranges say so.
 *
 * This is not arbitrary. CSS `brightness()` is a multiplier applied after the
 * inversion, and on an inverted page the two surfaces that dominate what you see
 * are pinned at the ends of the range: a white page background becomes 0, and
 * black body text becomes 255. Multiplying 0 by anything is still 0, and 255
 * clamps — so values above 100% are a dead zone. Measured on a white page:
 *
 *   brightness 100% -> background 0, text 255
 *   brightness 125% -> background 0, text 255   (no visible change)
 *   brightness  70% -> background 0, text 179   (text dimmed)
 *   contrast    80% -> background 25, text 230  (black lifted, text softened)
 *
 * Contrast is the more useful of the two on a dark page because it pivots around
 * mid-grey, so lowering it lifts the background off pure black *and* takes the
 * glare off white text at the same time.
 *
 * Allowing 150% shipped briefly and read as broken, because half of each slider
 * did nothing. Reducing glare is the whole job; the ranges now match it.
 */
export const APPEARANCE_CONTROLS: ReadonlyArray<{
  key: AppearanceKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}> = [
  {
    key: "brightness",
    label: "Brightness",
    hint: "Dims the page",
    min: 50,
    max: 100,
    step: 5,
  },
  {
    key: "contrast",
    label: "Contrast",
    hint: "Softens pure black and white",
    min: 60,
    max: 100,
    step: 5,
  },
  {
    key: "sepia",
    label: "Warmth",
    hint: "Cuts blue light",
    min: 0,
    max: 100,
    step: 5,
  },
];

/**
 * There is deliberately no grayscale *amount*. Grayscale is already one of the
 * display modes, and offering the same effect twice is both redundant and a live
 * source of confusion — it is easy to grab the wrong slider and then wonder why
 * "grayscale" turned the page yellow.
 */
export const DEFAULT_APPEARANCE: Appearance = {
  brightness: 100,
  contrast: 100,
  sepia: 0,
};

export function siteKey(hostname: string): string {
  return `${SITE_KEY_PREFIX}${hostname}`;
}

export function isKnownMode(value: unknown): value is Mode {
  return typeof value === "string" && value in MODES;
}

export function isThemedMode(value: unknown): value is ThemedMode {
  return typeof value === "string" && value in THEME_ATTRIBUTE_VALUES;
}

/**
 * Storage is user-writable and survives downgrades, so never trust its shape.
 * Anything missing or out of range falls back to the default for that control.
 */
export function normaliseAppearance(value: unknown): Appearance {
  const source = (value ?? {}) as Partial<Record<AppearanceKey, unknown>>;
  const result = { ...DEFAULT_APPEARANCE };

  for (const control of APPEARANCE_CONTROLS) {
    const raw = source[control.key];

    if (typeof raw === "number" && Number.isFinite(raw)) {
      result[control.key] = Math.min(control.max, Math.max(control.min, raw));
    }
  }

  return result;
}

export function isDefaultAppearance(appearance: Appearance): boolean {
  return APPEARANCE_CONTROLS.every(
    (control) => appearance[control.key] === DEFAULT_APPEARANCE[control.key]
  );
}
