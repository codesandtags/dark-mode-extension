import { t } from "@/lib/i18n";
import {
  LEGACY_SYNC_KEY,
  MIGRATION_FLAG,
  NATIVE_DARK,
  NATIVE_DARK_MESSAGE,
  isKnownMode,
  isNativeDarkState,
  siteKey,
  tabStateKey,
  type NativeDarkState,
} from "@/lib/settings";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    migrateLegacySettings()
      .then(({ migrated, skipped }) => {
        if (!skipped) {
          console.info(
            `[dark-mode-enabler] migrated ${migrated} site(s) to local storage`
          );
        }
      })
      .catch((error) => {
        console.error("[dark-mode-enabler] migration failed:", error);
      });
  });

  /**
   * The content script tells us whether the page handles dark mode itself. This
   * is the one place the extension uses messaging — the popup still talks to
   * content scripts only through storage, because that path has to survive pages
   * where no content script is running.
   */
  browser.runtime.onMessage.addListener((message, sender) => {
    if (
      typeof message !== "object" ||
      message === null ||
      (message as { type?: unknown }).type !== NATIVE_DARK_MESSAGE
    ) {
      return;
    }

    const { state } = message as { state?: unknown };
    const tabId = sender.tab?.id;

    if (tabId === undefined || !isNativeDarkState(state)) {
      return;
    }

    void recordNativeDark(tabId, state);
  });

  // A navigation invalidates the previous verdict; clear it so a stale badge
  // never outlives the page that produced it.
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
      void clearNativeDark(tabId);
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    void browser.storage.session.remove(tabStateKey(tabId)).catch(() => {});
  });
});

/* --------------------------------------------------------------------------
 * Native dark badge
 * ----------------------------------------------------------------------- */

/**
 * Only the "already dark" case gets a badge.
 *
 * That is the state where using this extension makes the page objectively
 * worse, so it is worth interrupting for. Badging "this site has a dark theme
 * you are not using" as well would put a marker on a large share of the web and
 * teach people to ignore it.
 */
async function recordNativeDark(tabId: number, state: NativeDarkState) {
  try {
    await browser.storage.session.set({ [tabStateKey(tabId)]: state });

    if (state === NATIVE_DARK.ACTIVE) {
      await browser.action.setBadgeText({ tabId, text: "✓" });
      await browser.action.setBadgeBackgroundColor({ tabId, color: "#2f9e6d" });
      await browser.action.setTitle({
        tabId,
        title: t("badgeTitleAlreadyDark"),
      });
    } else {
      await resetBadge(tabId);
    }
  } catch {
    // The tab can disappear between the report and this write.
  }
}

async function clearNativeDark(tabId: number) {
  try {
    await browser.storage.session.remove(tabStateKey(tabId));
    await resetBadge(tabId);
  } catch {
    // As above.
  }
}

async function resetBadge(tabId: number) {
  await browser.action.setBadgeText({ tabId, text: "" });
  await browser.action.setTitle({ tabId, title: "Dark Mode Enabler" });
}

/* --------------------------------------------------------------------------
 * Migration
 * ----------------------------------------------------------------------- */

/**
 * Moves v1.1 settings into their new home.
 *
 * v1.1 kept every site the user had ever configured inside one
 * chrome.storage.sync key. That key is capped by QUOTA_BYTES_PER_ITEM at 8 KB,
 * which works out to roughly 290 hostnames — past that every write failed, and
 * because the callback never checked runtime.lastError it still logged success.
 *
 * The legacy sync key is intentionally left in place. It costs a few hundred
 * bytes and means a user who rolls back to 1.1 does not lose their sites.
 */
async function migrateLegacySettings(): Promise<{
  migrated: number;
  skipped: boolean;
}> {
  const local = await browser.storage.local.get(MIGRATION_FLAG);

  if (local[MIGRATION_FLAG]) {
    return { migrated: 0, skipped: true };
  }

  const legacy = await browser.storage.sync.get(LEGACY_SYNC_KEY);
  const savedSites = (legacy[LEGACY_SYNC_KEY] ?? {}) as Record<string, unknown>;
  const migrated: Record<string, unknown> = {};
  let count = 0;

  for (const [hostname, mode] of Object.entries(savedSites)) {
    // v1.1 wrote an empty-string hostname for pages served from a null origin.
    if (hostname && isKnownMode(mode)) {
      migrated[siteKey(hostname)] = mode;
      count += 1;
    }
  }

  migrated[MIGRATION_FLAG] = true;
  await browser.storage.local.set(migrated);

  return { migrated: count, skipped: false };
}
