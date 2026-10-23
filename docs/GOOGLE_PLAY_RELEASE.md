# Google Play release guide

> **Status: nothing has been uploaded or published.** This repo contains a locally built, debug-signed test APK and draft store materials only. Do not describe ScamLens as "available on Google Play" until Play Console shows it live.

## 0. Decisions only the owner can make

| Decision | Current state |
|---|---|
| **Application ID** | **`in.satvikpatel.scamlens`** (decided by the owner on 2026-10-24; set in `app.json`, pinned by a test). It cannot be changed after the first upload to Play. Availability can only be confirmed in Play Console. |
| Developer account | Needs a Google Play Console account (one-time fee, identity verification). Personal vs organisation changes the testing rules below. |
| Licence for the source code | Not chosen (see README). |
| Real support email / privacy-policy URL | Not available; `src/config.ts` is `null`. Never ship invented ones. |

## 1. Current Google requirements (checked 2026-10-23, re-check before release)

- **Target API:** new apps and updates must target **Android 16 (API 36)** or higher; deadline 31 Aug 2026 (extension to 1 Nov 2026 could be requested). Source: Play Console Help, "Target API level requirements" (support.google.com/googleplay/android-developer/answer/11926878). ScamLens builds with React Native's defaults: `targetSdk 36`, `compileSdk 37`, `minSdk 24`. Confirm in the built artifact with `gplay preflight` (scanner `policy`; see `PREFLIGHT_REPORT.md`).
- **Closed-testing rule for new personal accounts:** personal developer accounts created after 13 Nov 2023 must run a closed test with **at least 12 testers opted in continuously for 14 days** before applying for production access. Source: Play Console Help (support.google.com/googleplay/android-developer/answer/14151465), as quoted by the `mobile-app-skill` documentation. Organisation accounts are treated differently; check your account type.
- **First upload and legal declarations are manual** in Play Console (app creation, Play App Signing enrolment, declarations). No tool here can do them for you.
- Fees: one-time registration fee for the developer account (the skill documentation states $25).

## 2. Build a signed Android App Bundle (AAB)

Signing keys must **never** be in this repo or in chat.

1. **Done on the development machine (2026-10-24):** an upload keystore was created at `C:\Users\satvi\secure\scamlens-upload.keystore` (alias `scamlens-upload`, PKCS12, RSA 2048, valid 25 years) and its four settings were written to `%USERPROFILE%\.gradle\gradle.properties`. **You must back up the keystore file AND the passwords in that gradle.properties file** (password manager plus an offline copy). If you lose them you must ask Google to reset the upload key. Certificate SHA-256: `0F:73:41:C3:27:F5:18:77:97:15:82:36:0D:B9:10:BD:0A:94:BC:C3:2E:B4:50:80:3E:F9:EC:6D:43:6E:AB:62`. To create a different key instead (keep it and its passwords in a password manager, and make an offline backup):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore scamlens-upload.keystore \
     -alias scamlens-upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   Store it **outside** the project folder (for example `C:\secure\`).
2. Add four lines to your **user-level** Gradle file (`%USERPROFILE%\.gradle\gradle.properties`), not to the repo:
   ```
   SCAMLENS_UPLOAD_STORE_FILE=C:/secure/scamlens-upload.keystore
   SCAMLENS_UPLOAD_STORE_PASSWORD=...
   SCAMLENS_UPLOAD_KEY_ALIAS=scamlens-upload
   SCAMLENS_UPLOAD_KEY_PASSWORD=...
   ```
   The config plugin `plugins/with-release-signing.js` reads these and signs the release build with that key. If they are absent the build falls back to the debug key (fine for testing, **never** upload it).
3. Use JDK 17 (see README), then on Windows:
   ```powershell
   .\scripts\build-android.ps1 -Task both -Architectures "armeabi-v7a,arm64-v8a,x86,x86_64"
   # build-output\app-release.aab = the file to upload;  build-output\app-release.apk = for testing on phones
   ```
   The script **refuses to build** if the upload key is not configured (unless you pass `-AllowDebugSigning` for a test-only build). On macOS/Linux: `npx expo prebuild --platform android --clean && cd android && ./gradlew bundleRelease`.
4. Bump `android.versionCode` in `app.json` for every upload (must increase each time) and update `version` for user-visible versions.
5. Play App Signing: on first upload choose Google-managed app signing (recommended). Your keystore is then the **upload** key; Google holds the app-signing key.

## 3. Pre-submission checks

```bash
gplay preflight --file app-release.aab --listings-dir store/listings --fail-on error
```
(or `--file app-release.apk` for the test APK). `gplay` is installed at `%USERPROFILE%\tools\gplay\gplay.exe` on the development machine (checksum-verified). Preflight is offline and needs no credentials. A clean preflight does **not** mean Google will approve the app: it checks the artifact, not behaviour or policy judgement.

Also, before upload:
- [ ] `npm run typecheck && npm run lint && npm test`
- [ ] Merged manifest reviewed: no unexpected permissions (see `docs/PRIVACY.md`)
- [ ] Debug signing key **not** used
- [ ] Data safety draft re-read against the final build (`play/DATA_SAFETY_DRAFT.md`)
- [ ] Privacy policy hosted at a public URL and opened from outside your network
- [ ] Screenshots captured from the **real app** on a real device/emulator (none are included yet)

## 4. Store listing materials in this repo

| Item | File | Status |
|---|---|---|
| Title / short / full description (en, hi, gu) | `store/listings/<locale>/` | drafted, within Play's length limits; Hindi/Gujarati text **needs native-speaker review** |
| App icon 512×512 | `store/graphics/play-icon-512.png` | generated |
| Feature graphic 1024×500 | `store/graphics/feature-graphic-1024x500.png` | generated |
| Phone screenshots (min 2, max 8) | — | **not produced** (need a device/emulator; none available in the development environment) |
| Privacy policy | `docs/play/PRIVACY_POLICY_DRAFT.md` | draft, **not published** |
| Data safety answers | `docs/play/DATA_SAFETY_DRAFT.md` | draft, owner must enter |
| Content rating / audience guidance | `docs/play/CONTENT_RATING_AND_AUDIENCE.md` | guidance |
| Permissions audit | `docs/PRIVACY.md`, `docs/play/PREFLIGHT_REPORT.md` | done for the test APK |
| Third-party licences | `docs/play/THIRD_PARTY_LICENSES.md` | generated |
| Release notes | `docs/play/RELEASE_NOTES.md` | drafted |

## 5. Testing tracks

**Internal testing** (up to 100 testers, no review delay for most changes):
- [ ] Create the app in Play Console (manual), enrol in Play App Signing.
- [ ] Upload the signed AAB to Internal testing, add tester emails, install via the opt-in link.
- [ ] Run the manual checklist in `TESTING.md` §"Manual device checklist" on a real phone in all three languages.
- [ ] Review the **pre-launch report** Play generates (crashes, accessibility, security).

**Closed testing** (required first for new personal accounts):
- [ ] Recruit ≥ 12 real testers (friends, family, community) and keep them opted in for **14 continuous days**.
- [ ] Collect their feedback, fix, upload a new `versionCode` if needed.
- [ ] Apply for production access in Play Console when eligible.

**Production**
- [ ] Complete all "App content" declarations (privacy policy, ads, app access, content rating, target audience, data safety, financial features, government app).
- [ ] Complete the store listing (graphics, screenshots, descriptions).
- [ ] Use a **staged rollout** (for example 10 %) and watch Android vitals and reviews.
- [ ] Keep a changelog and update the privacy documents whenever behaviour changes.

## 6. Manual steps you must do yourself

1. Create/verify the Play Console developer account and pay the fee.
2. Decide the final application ID and set it in `app.json` **before** building the first upload.
3. Create the upload keystore; back it up securely.
4. Create the app in Play Console; enrol in Play App Signing.
5. Host the privacy policy; fill the Data safety form, content rating questionnaire, target audience and other declarations (these are legal declarations in your name).
6. Capture screenshots from the app and add them to the listing.
7. Have a native Hindi and Gujarati speaker review the translations and the Hindi/Gujarati detection patterns.
8. Upload to Internal testing; recruit testers for closed testing.
9. Approve and trigger the production release yourself.

Nothing in this repository uploads, publishes, signs for you, accepts declarations or spends money.
