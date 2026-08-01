import { classifyImage } from "@/lib/classify-image";
import {
  APPEARANCE_KEY,
  DEFAULT_APPEARANCE,
  IMAGE_ATTRIBUTE,
  MODES,
  THEME_ATTRIBUTE,
  THEME_ATTRIBUTE_VALUES,
  isThemedMode,
  normaliseAppearance,
  siteKey,
  type Appearance,
  type Mode,
} from "@/lib/settings";

import "./theme.css";

/**
 * Applies the saved display mode to the page.
 *
 * The critical path is deliberately tiny: read one key, put one attribute on
 * <html>. All the styling lives in theme.css, which the browser has already
 * applied by the time this runs. Image classification happens afterwards, on an
 * idle callback, so it can never delay the theme landing.
 *
 * This script does not write settings — the popup owns persistence. Before 2.0.0
 * it saved from here, which meant that on any page where the content script had
 * not been injected the user's choice was silently discarded.
 */
export default defineContentScript({
  matches: ["<all_urls>"],

  /**
   * These four options are load-bearing; changing any of them regresses a bug
   * that 2.0.0 fixed.
   *
   * - `runAt: document_start` plus `cssInjectionMode: manifest` is what removes
   *   the white flash. WXT puts imported CSS into the manifest's
   *   content_scripts.css array, which the browser applies before the page
   *   renders. Switching to "manual" would inject it from JS after paint and
   *   bring the flash straight back.
   * - `allFrames` themes embedded documents, which otherwise render their
   *   images as negatives under the parent's filter.
   */
  runAt: "document_start",
  allFrames: true,
  matchAboutBlank: true,
  cssInjectionMode: "manifest",

  main() {
    const storageKey = siteKey(resolveHostname());

    let currentMode: Mode = MODES.DISABLED;
    let imageWatcher: ImageWatcher | null = null;

    /**
     * Keeps every open tab in sync, including this one. The popup writes to
     * storage and this listener does the rest, so there is no message passing to
     * fail on.
     */
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      const modeChange = changes[storageKey];

      if (modeChange) {
        setMode(modeChange.newValue);
      }

      const appearanceChange = changes[APPEARANCE_KEY];

      if (appearanceChange) {
        paintAppearance(normaliseAppearance(appearanceChange.newValue));
      }
    });

    void initialise();

    async function initialise() {
      try {
        const stored = await browser.storage.local.get([
          storageKey,
          APPEARANCE_KEY,
        ]);

        paintAppearance(normaliseAppearance(stored[APPEARANCE_KEY]));
        setMode(stored[storageKey]);
        guardAgainstClobbering();
      } catch (error) {
        console.error("[dark-mode-enabler] could not read settings:", error);
      }
    }

    function setMode(value: unknown) {
      currentMode = isThemedMode(value) ? value : MODES.DISABLED;
      paintMode(currentMode);

      /**
       * Only dark mode counter-inverts media, so it is the only mode that needs
       * images classified. Everything else pays nothing.
       */
      if (currentMode === MODES.DARK) {
        imageWatcher ??= createImageWatcher();
        imageWatcher.start();
      } else {
        imageWatcher?.stop();
      }
    }

    function paintMode(mode: Mode) {
      const root = document.documentElement;

      if (!root) {
        return;
      }

      if (isThemedMode(mode)) {
        root.setAttribute(THEME_ATTRIBUTE, THEME_ATTRIBUTE_VALUES[mode]);
      } else {
        root.removeAttribute(THEME_ATTRIBUTE);
      }
    }

    /**
     * theme.css reads these as unitless multipliers; they are stored as whole
     * percentages because that is what the sliders show.
     */
    function paintAppearance(appearance: Appearance) {
      const root = document.documentElement;

      if (!root) {
        return;
      }

      const style = root.style;

      style.setProperty("--dme-brightness", String(appearance.brightness / 100));
      style.setProperty("--dme-contrast", String(appearance.contrast / 100));
      style.setProperty("--dme-sepia", String(appearance.sepia / 100));
      style.setProperty("--dme-grayscale", String(appearance.grayscale / 100));
    }

    /**
     * Some single-page apps rewrite attributes on the root element wholesale
     * during navigation, which drops the theme mid-session. Watch for that and
     * put it back.
     *
     * Re-applying retriggers this observer, but the second pass sees a matching
     * attribute and stops, so there is no loop.
     */
    function guardAgainstClobbering() {
      const root = document.documentElement;

      if (!root) {
        return;
      }

      new MutationObserver(() => {
        if (!isThemedMode(currentMode)) {
          return;
        }

        if (
          root.getAttribute(THEME_ATTRIBUTE) !==
          THEME_ATTRIBUTE_VALUES[currentMode]
        ) {
          paintMode(currentMode);
        }
      }).observe(root, {
        attributes: true,
        attributeFilter: [THEME_ATTRIBUTE],
      });
    }
  },
});

type ImageWatcher = {
  start(): void;
  stop(): void;
};

/**
 * Tags images the classifier considers logos or icons so theme.css can skip the
 * counter-invert on them.
 *
 * Runs entirely off the critical path. Work is batched into idle callbacks and
 * capped, because a long feed can hold thousands of images and reading pixels
 * back is not free.
 */
function createImageWatcher(): ImageWatcher {
  const MAX_IMAGES_PER_PASS = 60;

  const pending = new Set<HTMLImageElement>();
  let observer: MutationObserver | null = null;
  let scheduled = false;
  let running = false;

  function enqueue(image: HTMLImageElement) {
    if (image.complete) {
      pending.add(image);
      schedule();
      return;
    }

    // Lazy-loaded images have no pixels to inspect yet.
    image.addEventListener(
      "load",
      () => {
        if (running) {
          pending.add(image);
          schedule();
        }
      },
      { once: true }
    );
  }

  function collectFrom(node: Node) {
    if (node instanceof HTMLImageElement) {
      enqueue(node);
      return;
    }

    if (node instanceof Element || node instanceof DocumentFragment) {
      node.querySelectorAll("img").forEach(enqueue);
    }
  }

  function schedule() {
    if (scheduled || pending.size === 0) {
      return;
    }

    scheduled = true;

    const run = () => {
      scheduled = false;
      flush();
    };

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 500 });
    } else {
      setTimeout(run, 0);
    }
  }

  function flush() {
    let processed = 0;

    for (const image of pending) {
      pending.delete(image);

      const kind = classifyImage(image);

      if (kind === "icon") {
        image.setAttribute(IMAGE_ATTRIBUTE, "icon");
      } else if (kind === "photo") {
        image.removeAttribute(IMAGE_ATTRIBUTE);
      }

      if (++processed >= MAX_IMAGES_PER_PASS) {
        break;
      }
    }

    // More arrived, or we hit the cap. Come back on the next idle slot.
    schedule();
  }

  return {
    start() {
      if (running) {
        return;
      }

      running = true;

      const scan = () => {
        collectFrom(document);

        observer ??= new MutationObserver((records) => {
          for (const record of records) {
            record.addedNodes.forEach(collectFrom);
          }
        });

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      };

      // At document_start there is no <body> yet and nothing to scan.
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scan, { once: true });
      } else {
        scan();
      }
    },

    stop() {
      running = false;
      observer?.disconnect();
      observer = null;
      pending.clear();

      document
        .querySelectorAll(`[${IMAGE_ATTRIBUTE}]`)
        .forEach((element) => element.removeAttribute(IMAGE_ATTRIBUTE));
    },
  };
}

/**
 * The settings key always comes from the top-level page, never from the frame's
 * own origin: an embedded player on a themed site should be themed with it, not
 * according to whatever the user once chose for the embed's host.
 *
 * ancestorOrigins is ordered nearest-ancestor-first, so the last entry is the
 * top document. It is empty in the top frame.
 */
function resolveHostname(): string {
  const ancestors = window.location.ancestorOrigins;
  const topOrigin = ancestors?.[ancestors.length - 1];

  if (topOrigin) {
    try {
      return new URL(topOrigin).hostname;
    } catch {
      // Opaque origin (sandboxed frame); fall back to this frame's hostname.
    }
  }

  return window.location.hostname;
}
