# Google Play Data safety — DRAFT answers

> **Not complete and not submitted.** This is a draft derived from what the code and the built APK actually do (see `docs/PRIVACY.md`). The owner must enter the answers in Play Console themselves (the form is a legal declaration) and must re-check them against the exact release build and any dependency added later. Google's definitions apply: "collect" means data **transmitted off the device**; data processed and kept only on the device is not "collected".

## Basis for the answers

| Question | Evidence in this repo |
|---|---|
| Does the app transmit user data off the device? | No. `INTERNET` permission is removed in the manifest; no networking code is used; no analytics, ads, crash-reporting or auth SDK is installed (`package.json`, `docs/play/THIRD_PARTY_LICENSES.md`). |
| Does it share data with third parties? | No. |
| Is data processed only on device? | Yes: message/link analysis, history, preferences. |
| Cloud backup? | Disabled (`android:allowBackup="false"`). |
| Accounts? | None. |

## Suggested answers (to be confirmed by the owner)

**Data collection and security**
- "Does your app collect or share any of the required user data types?" → **No**.
- Because no data is collected, the per-type sections (personal info, financial info, messages, app activity, device IDs, etc.) stay empty.
- "Is all of the user data collected by your app encrypted in transit?" → not applicable (nothing is transmitted). Play Console will not ask this if "No data collected" is selected.
- "Do you provide a way for users to request that their data be deleted?" → not applicable (no data on our servers). In-app, users can delete history and uninstall to remove all local data.

**Other declarations**
- Ads: **No ads**.
- Target audience: adults (18+) — see `CONTENT_RATING_AND_AUDIENCE.md`.
- Financial features: none (the app handles no payments, does not hold money or give financial services). It is an educational/awareness tool about scams.
- Government apps / health / news: no.

## Re-check before every release

1. Run `gplay preflight --file <aab> --output json` and read the `privacy` and `permissions` findings (ad/analytics SDK inventory).
2. Diff `package.json` dependencies since the last release. A new dependency can add permissions or data collection.
3. If you ever add network access, analytics, crash reporting, sign-in or ads, **this draft is wrong** and must be rewritten before you publish.
4. Read the final merged `AndroidManifest.xml` of the release build.

## Things this draft does not decide

- Whether Play considers the optional on-device history "collected" (the current reading of Google's definition says no, because it never leaves the device). If in doubt, say so in the privacy policy (it does) and consult Google's Data safety help text.
- Any legal obligation under India's DPDP Act or other law. Not legal advice.
