# Preflight report

Generated on 2026-10-23 for ScamLens 0.1.0 from the artifacts actually built on the development machine. Nothing here means Google has reviewed or approved the app: a clean preflight checks the build file, not behaviour or policy judgement.

## 1. Test APK (`build-output/app-release.apk`)

Built with JDK 17 via `scripts/build-android.ps1` (`assembleRelease`, ABIs arm64-v8a + x86_64). **Debug-signed: for testing only, not for Google Play.**

| Fact | Value | Tool |
|---|---|---|
| Package | `com.scamlens.app` (**old provisional ID; superseded, see section 5**) | `aapt2 dump badging` |
| versionCode / versionName | 1 / 0.1.0 | aapt2 |
| minSdk / targetSdk / compileSdk | 24 / **36** / 37 | aapt2 + RN defaults (Play's current floor is 36, see `docs/GOOGLE_PLAY_RELEASE.md`) |
| Size | 47 MB (two ABIs; an AAB delivers per-device splits) | file size |
| Native code | arm64-v8a, x86_64 | aapt2 |
| Signature | APK Signature Scheme v2 verified (debug key) | `apksigner verify` |

### Permissions in the final merged manifest

| Permission | Notes |
|---|---|
| `com.scamlens.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | App-private signature-level permission added automatically by AndroidX; not a user-visible permission and grants no access to user data |

**No** INTERNET, storage, overlay, vibrate, SMS, contacts, call log, location, camera, microphone, notification-listener or accessibility permissions. (`INTERNET` is explicitly removed with `tools:node="remove"`.)

### Other manifest facts (from `aapt2 dump xmltree`)

- `android:allowBackup="false"`.
- No `debuggable`, `testOnly`, `usesCleartextTraffic` or `networkSecurityConfig`.
- Exported components: the launcher activity (required) and the AndroidX `ProfileInstallReceiver` (guarded by a system permission). The three content providers (Expo file-system, Expo clipboard, AndroidX startup) are **not** exported.
- Expo Updates metadata exists in the manifest but is `ENABLED=false`, and the `expo-updates` package is not a dependency.

### `gplay preflight` (v1.0.2, offline)

Command: `gplay preflight --file build-output/app-release.apk --listings-dir store/listings --output json --pretty`

All nine scanners ran (`manifest`, `permissions`, `native_libs`, `metadata`, `secrets`, `billing`, `privacy`, `policy`, `size`).

| Severity | Finding | Meaning / action |
|---|---|---|
| **error** | `screenshot_count`: no phone screenshots found for en-US | **Expected, open.** Play needs ≥ 2 phone screenshots. None exist because no device/emulator was available. Capture them from the real app (manual step). |
| info | `upload_format`: scanned artifact is an APK | New apps must be uploaded as an AAB, not an APK. See §2. |

No findings from the manifest, permissions, native-libs (including 16 KB page alignment), secrets, billing, privacy (ads/analytics SDK inventory), policy (target SDK) or size scanners.

Limits: preflight cannot prove compliance for obfuscated builds, did not check the Hindi and Gujarati listing images (only en-US has a `images/` folder), and does not judge the app's behaviour.

## 2. Android App Bundle (`build-output/app-release.aab`)

Built with `scripts/build-android.ps1 -Task bundleRelease -Architectures "armeabi-v7a,arm64-v8a,x86,x86_64"` (JDK 17, Android Gradle Plugin 9.2.1; 26 min 45 s). 54 MB. **Signed with the Android Debug certificate** (`CN=Android Debug`, checked with `keytool -printcert -jarfile`), so **Google Play will reject it. It is a build-pipeline check, not an upload candidate.** A signed AAB needs your upload keystore (see `docs/GOOGLE_PLAY_RELEASE.md` section 2).

`gplay preflight --file build-output/app-release.aab --listings-dir store/listings --output json --pretty`: all nine scanners ran.

| Severity | Finding | Assessment |
|---|---|---|
| **error** | `screenshot_count`: no phone screenshots found for en-US | Same as the APK. Expected and still open (needs a device). |
| warning | `misplaced_files`: `BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties` | **Benign.** Every AAB built by Android Gradle Plugin contains this file; it holds only `appMetadataVersion=1.1` and `androidGradlePluginVersion=9.2.1`. Inspected directly. Cannot and need not be excluded. |

Direct inspection of the bundle (1 308 entries): no keystore, `.env`, `local.properties` or `.git` entries. `BUNDLE-METADATA` contains native debug symbols and the R8 mapping file (used by Play for crash reports, not delivered to users). Native libraries are `libappmodules`, `libreactnative`, `libjsi`, `libfbjni`, `libc++_shared`, `libexpo-modules-v2`, and the codegen libraries of react-native-screens and react-native-safe-area-context for all four ABIs; **none** for reanimated, worklets or gesture-handler (the Autolinking exclusion works).

No findings from the manifest, permissions, native-libs (including 16 KB alignment), billing, privacy, policy or size scanners.

## 3. Other tools run

| Tool | Result |
|---|---|
| `npx expo-doctor` | 20 of 20 checks passed |
| `play-policy-insights` (Google, via mobile-app-skill) | Compliant, no risks; see `POLICY_INSIGHTS_REPORT.md` (advisory) |
| `apksigner verify` (APK) | v2 signature valid (debug key) |

## 4. Still open before any upload

1. Phone screenshots (preflight error).
2. A real upload keystore and a signed AAB.
3. Final application ID decision.
4. Everything in `docs/GOOGLE_PLAY_RELEASE.md` section 6.

## 5. Final release build (2026-10-24, application ID `in.satvikpatel.scamlens`)

The ID was changed from the provisional `com.scamlens.app` to **`in.satvikpatel.scamlens`**. Sections 1-4 above describe the earlier, debug-signed builds under the old ID. Both artifacts were rebuilt from scratch with `scripts/build-android.ps1 -Task both` (JDK 17, 22 min 47 s, four ABIs) and **signed with the upload key**.

| Fact | APK (`app-release.apk`, 80 MB) | AAB (`app-release.aab`, 54 MB) | Tool |
|---|---|---|---|
| Package | `in.satvikpatel.scamlens` | `in.satvikpatel.scamlens` (base manifest; 0 occurrences of the old ID) | aapt2, direct inspection |
| versionCode / versionName | 1 / 0.1.0 | 1 / 0.1.0 | aapt2 |
| targetSdk | 36 | 36 | aapt2 |
| Native code | arm64-v8a, armeabi-v7a, x86, x86_64 | same | aapt2 |
| Signer | `CN=ScamLens Upload Key, O=ScamLens, C=IN` | same | apksigner, keytool |
| Certificate SHA-256 | `0F:73:41:C3:27:F5:18:77:97:15:82:36:0D:B9:10:BD:0A:94:BC:C3:2E:B4:50:80:3E:F9:EC:6D:43:6E:AB:62` | same | keytool |
| Signature algorithm | SHA256withRSA | SHA256withRSA | keytool |
| Debug-signed? | **No** | **No** | |

Permissions are unchanged: the only entry is the app-private `in.satvikpatel.scamlens.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; no INTERNET.

`gplay preflight` (all 9 scanners): AAB has 1 error (`screenshot_count`: store-listing screenshots missing; not a blocker for uploading the bundle) and the benign `app-metadata.properties` warning explained in section 2. APK: info only (`upload_format`).

Tests, type-check and lint were re-run after the change: 173 of 173 tests pass.

The **AAB is the file to upload** to Play Console ("Upload app bundles" / "Drop app bundles here to upload"). The APK is for testing on phones; Play does not accept APKs for new apps.
