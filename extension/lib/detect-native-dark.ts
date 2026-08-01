import { NATIVE_DARK, type NativeDarkState } from "./settings";

/**
 * Works out whether a page already handles dark mode itself.
 *
 * This exists because inverting an already-dark page turns it *light* — a worse
 * outcome than doing nothing at all. Most of the sites people care about most
 * (X, Reddit, LinkedIn, Facebook, Instagram, Google Drive) ship native dark
 * themes, so this is the difference between the extension being helpful and
 * actively harmful on the top of everyone's browsing list.
 *
 * Two independent questions get answered:
 *
 *   1. Is the page dark *right now*? Sampled from the effective background
 *      colour. This is the one that matters, because it is what inversion would
 *      ruin.
 *   2. Does the site ship a dark theme it is simply not using? Read from the
 *      `color-scheme` property and any `prefers-color-scheme: dark` rules. Worth
 *      telling the user about, since switching the site's own toggle will always
 *      beat a colour filter.
 *
 * Note that our own filter does not interfere: `filter` is a paint-time effect,
 * so getComputedStyle still reports the site's real colours even while a mode is
 * active.
 */

/**
 * Relative luminance below which a background counts as a dark theme.
 *
 * Measured against the real thing rather than picked by eye. Shipping dark
 * themes all sit far below this:
 *
 *   #000000  black             0.000
 *   #121212  Material dark     0.006
 *   #15202b  X dim             0.014
 *   #202124  Google dark       0.015
 *   #666666  dark grey         0.133
 *   ---------------------------------  0.15
 *   #808080  mid grey          0.216
 *   #f5f5f5  off-white         0.913
 *   #ffffff  white             1.000
 *
 * There is a wide empty gap between real dark themes and merely mid-toned
 * pages, and the threshold sits in it. A more permissive 0.35 was tried first
 * and swallowed plain mid-grey, which is not a dark theme — inverting one barely
 * changes it, so claiming "already dark" there would be simply wrong.
 */
const DARK_LUMINANCE_THRESHOLD = 0.15;

/** Alpha below this means the colour is see-through and tells us nothing. */
const MIN_OPAQUE_ALPHA = 0.5;

/** Caps for the stylesheet scan; some sites ship tens of thousands of rules. */
const MAX_STYLESHEETS = 60;
const MAX_RULES_SCANNED = 3000;

type Rgba = { r: number; g: number; b: number; a: number };

export function detectNativeDark(): NativeDarkState {
  if (isRenderingDark()) {
    return NATIVE_DARK.ACTIVE;
  }

  return declaresDarkScheme() ? NATIVE_DARK.AVAILABLE : NATIVE_DARK.NONE;
}

/* --------------------------------------------------------------------------
 * Is the page dark right now?
 * ----------------------------------------------------------------------- */

function isRenderingDark(): boolean {
  const background = effectiveBackgroundColor();

  // Nothing opaque declared anywhere: the canvas falls back to white.
  if (!background) {
    return false;
  }

  return relativeLuminance(background) < DARK_LUMINANCE_THRESHOLD;
}

/**
 * The colour the user actually sees behind the content. <body> wins when it
 * paints, otherwise the background propagates up from <html>.
 */
function effectiveBackgroundColor(): Rgba | null {
  for (const element of [document.body, document.documentElement]) {
    if (!element) {
      continue;
    }

    const parsed = parseColor(getComputedStyle(element).backgroundColor);

    if (parsed && parsed.a >= MIN_OPAQUE_ALPHA) {
      return parsed;
    }
  }

  return null;
}

/**
 * getComputedStyle normalises to `rgb()` / `rgba()` in every engine we target.
 * Anything else — `color(srgb …)` for wide-gamut values, say — is treated as
 * unknown rather than guessed at.
 */
function parseColor(value: string): Rgba | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)$/i
  );

  if (!match) {
    return null;
  }

  const [, r, g, b, a] = match;
  const alpha = a === undefined ? 1 : parseAlpha(a);

  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: alpha,
  };
}

function parseAlpha(raw: string): number {
  return raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw);
}

/** Rec. 709 relative luminance with the sRGB transfer function undone. */
function relativeLuminance({ r, g, b }: Rgba): number {
  const linear = [r, g, b].map((channel) => {
    const normalised = channel / 255;

    return normalised <= 0.04045
      ? normalised / 12.92
      : ((normalised + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/* --------------------------------------------------------------------------
 * Does the site ship a dark theme at all?
 * ----------------------------------------------------------------------- */

function declaresDarkScheme(): boolean {
  const root = document.documentElement;

  if (root) {
    const scheme = getComputedStyle(root).colorScheme;

    // `color-scheme: light dark` is a site telling the browser it handles both.
    if (scheme && scheme.toLowerCase().split(/\s+/).includes("dark")) {
      return true;
    }
  }

  return hasPrefersDarkRule();
}

/**
 * Looks for `@media (prefers-color-scheme: dark)` anywhere in the page's own
 * stylesheets.
 *
 * Only top-level rules are examined. Recursing through nested at-rules would
 * find a few more cases at a cost this has no business paying — it runs on every
 * page load, and the common case is a framework stylesheet with thousands of
 * rules where the dark block sits at the top level anyway.
 */
function hasPrefersDarkRule(): boolean {
  const sheets = Array.from(document.styleSheets).slice(0, MAX_STYLESHEETS);
  let scanned = 0;

  for (const sheet of sheets) {
    let rules: CSSRuleList;

    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet; the browser refuses to expose its rules.
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (++scanned > MAX_RULES_SCANNED) {
        return false;
      }

      if (
        rule instanceof CSSMediaRule &&
        /prefers-color-scheme\s*:\s*dark/i.test(rule.conditionText)
      ) {
        return true;
      }
    }
  }

  return false;
}
