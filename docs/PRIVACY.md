# Privacy and permissions

This document describes what the **current code** does. It is not legal advice and it is not the public privacy policy (a draft policy is in `docs/play/PRIVACY_POLICY_DRAFT.md`; it is **not published** anywhere yet).

## Summary

- Messages and links you check are analysed **on your phone**. They are not sent to any server.
- ScamLens has **no Internet permission** and makes **no network requests**.
- No account, no advertising, no analytics, no crash-reporting SDK, no tracking.
- A summary of your checks is saved **on the phone only** (you can turn this off, delete single entries, or delete everything).

## Data the app stores (on the device only)

| Data | Purpose | Where | Removed by |
|---|---|---|---|
| Language choice, "intro finished", history on/off, "save original text" on/off, best practice score | app preferences | app-private AsyncStorage (`scamlens.settings.v1`) | uninstalling the app (language/prefs); "Reset my progress" for the practice score |
| History entries: time, whether message/link, risk level, names of the warning signs found and small values used in their explanation (e.g. a look-alike domain name) | lets you re-open earlier results | app-private AsyncStorage (`scamlens.history.v1`) | "Delete this entry", "Delete all history", uninstalling |
| Original text of a check | only if you turn on **"Also save the original text"** (off by default) | same history entry | same as above |

- The compact history entry deliberately **omits** the quoted evidence and the websites seen, and removes any `user:password@` part from link parameters. This is checked by an automated test (`src/state/history.test.tsx`).
- "Delete all history" removes the stored key (verified by test). A failed deletion is reported to the user.
- Storage is not encrypted. It is private to the app on Android, but a rooted device or a person with access to an unlocked phone could read it. For that reason original text is not saved by default.
- Android Auto Backup is **disabled** (`android:allowBackup="false"`), so history is not copied to a Google account backup.

## What is never collected or sent

Message text, links, history, language, practice results and device identifiers are not transmitted. There is no developer server. The app does not log the text you check (and its error screen does not log error details).

## Permissions

Declared in `app.json` (`blockedPermissions`) and verified in the built APK (see `docs/play/PREFLIGHT_REPORT.md`):

| Permission | Status |
|---|---|
| INTERNET | **removed** (not needed; analysis is local) |
| READ/WRITE_EXTERNAL_STORAGE | removed |
| SYSTEM_ALERT_WINDOW | removed |
| VIBRATE | removed |
| SMS, contacts, call log, notifications, accessibility, device admin, location, microphone, camera | never requested; no code uses them |

Clipboard: read **only** when you tap **Paste** (Android does not need a permission for this). **Copy summary** and **Share summary** send only the level and the names of the warning signs, never your original message.

## Network behaviour

- Core analysis needs no network.
- The app never opens, fetches or previews a link you check. (There is no code path that does.)
- The share sheet hands the summary text to another app you choose; what that app does with it is outside ScamLens.

## Third-party code

Open-source libraries only (React Native, Expo modules, AsyncStorage, vector icons). None of them is configured to collect analytics. The Expo Updates native metadata in the generated manifest is disabled (`expo.modules.updates.ENABLED=false`) and the app contains no over-the-air update client. Verify any dependency you add; see `docs/play/THIRD_PARTY_LICENSES.md`.

## Future remote threat intelligence (not implemented)

A later version might look links up in a threat database. **It is not in this release** and the Internet permission is removed. If added, it must be opt-in, off by default, must send only what is strictly needed (for example a hash of the domain rather than the full message), must be described in the privacy policy and Data Safety form **before** release, and the claim "no network access" must be removed from the app and the listing.

## Honest limits

"Analysis runs locally" is a strong privacy property, but it is not a guarantee of perfect privacy or security: the phone itself, other apps with access to the share target, or a screenshot can still expose content.
