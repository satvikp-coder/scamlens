# Preflight report

Generated on 2026-10-23 for ScamLens 0.1.0 from the artifacts actually built on the development machine. Nothing here means Google has reviewed or approved the app: a clean preflight checks the build file, not behaviour or policy judgement.

## 1. Test APK (`build-output/app-release.apk`)

Built with JDK 17 via `scripts/build-android.ps1` (`assembleRelease`, ABIs arm64-v8a + x86_64). **Debug-signed: for testing only, not for Google Play.**

| Fact | Value | Tool |
|---|---|---|
| Package | `com.scamlens.app` (**provisional**) | `aapt2 dump badging` |
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
