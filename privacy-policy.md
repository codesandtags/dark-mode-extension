## Privacy Policy

Dark Mode Enabler is a browser extension that enables dark mode on any website. This page is used to inform visitors regarding our policies with the collection, use, and disclosure of Personal Information if anyone decided to use our extension.

This extension does not collect, transmit, or sell any personal information. It contains no analytics, no telemetry, and no remote code. It makes no network requests of any kind. Everything it stores stays on your own device.

## What is stored

The only data the extension stores is the display mode you have chosen for a given website, saved as a hostname and a mode name — for example, `example.com` and `DARK`.

This is written to your browser's local extension storage (`chrome.storage.local`). It is not synced to any server of ours, and it is never shared with third parties. Removing the extension deletes it.

## Permissions Explained

### storage

The `storage` permission lets the extension remember the display mode you picked for each website, so your choice survives closing the tab or restarting the browser. It is used for nothing else.

### host permissions (`<all_urls>`)

The extension declares access to all websites, and Chrome will show this as *"Read and change all your data on all websites."*

This broad access is required because the extension cannot know in advance which sites you will want to theme — the styling has to be available on any page you visit, and it has to be in place before the page paints in order to avoid a white flash.

In practice the extension uses this access to do exactly two things:

1. Inject a fixed stylesheet (`theme.css`) that is inert until a mode is enabled for that site.
2. Set a single attribute on the page's `<html>` element to activate that stylesheet.

It does not read page content, form input, cookies, or browsing history, and it does not send anything anywhere. The extension is open source — the code that runs on your pages is [`extension/entrypoints/content/index.ts`](https://github.com/codesandtags/dark-mode-extension/blob/main/extension/entrypoints/content/index.ts) and [`extension/entrypoints/content/theme.css`](https://github.com/codesandtags/dark-mode-extension/blob/main/extension/entrypoints/content/theme.css), and you are welcome to verify this yourself.

## Changes to this policy

Prior versions of this policy stated that the extension used the `activeTab` permission and therefore lacked blanket access to all sites. That was inaccurate: the extension has always declared host permissions for all URLs in order to inject its stylesheet. The redundant `activeTab` permission was removed in version 2.0.0 and this policy has been corrected to describe the extension's actual access.

## Contact

Questions about this policy can be sent to codesandtags@gmail.com or raised on the [GitHub issue tracker](https://github.com/codesandtags/dark-mode-extension/issues).
