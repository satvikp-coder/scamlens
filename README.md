# ScamLens

**ScamLens helps people in India understand suspicious messages and links.** Paste a message or a link and ScamLens shows the warning signs it found, the exact words or link parts that triggered each one, why they matter, and safe next steps. English, Hindi and Gujarati.

- **Explainable**: fixed, published rules, not a hidden AI. Every warning points at evidence.
- **Private**: analysis runs on the phone. No Internet permission, no account, no analytics.
- **Honest**: results are "Low apparent risk / Caution advised / High risk / Unable to assess reliably". It never says something is safe, and it never shows a fake percentage.

> ScamLens is a heuristic helper. It can miss scams and can raise false alarms. It is not a substitute for checking with the real sender, your bank, or a professional. See [docs/DETECTION_ENGINE.md](docs/DETECTION_ENGINE.md#known-limitations).

Status: **live on Google Play**: https://play.google.com/store/apps/details?id=in.satvikpatel.scamlens . Source is public for review; no licence has been chosen yet, so all rights are reserved.

## Features

- Check a **message** or a **link** (the link is analysed as text and never opened)
- Evidence quotes, plain-language reasons, recommended actions, stated limitations
- Copy / share a summary (never includes your original message)
- **Learn** section: 10 lessons on common Indian scams + a "Scam or not?" practice quiz (made-up examples)
- Optional **history** on the phone (summary only by default; delete one or all)
- Languages: English, हिन्दी, ગુજરાતી (switch any time)
- Light and dark themes (follow the system), screen-reader labels, large touch targets

## Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| Node.js | 24.x (LTS 20+ should work) | |
| npm | 11.x | the project uses npm only |
| **JDK** | **17** | **Use JDK 17 for Android builds.** Newer JDKs (24/25) are not supported by the Android Gradle Plugin / React Native toolchain. |
| Android SDK | platforms 36/37, build-tools 36 | via Android Studio |

### Select JDK 17 (important)

Do not rely on the system `java` if it is newer than 21. Point `JAVA_HOME` at a JDK 17 for the build session only.

PowerShell:

```powershell
$env:JAVA_HOME = "C:\Users\you\tools\jdk-17.0.20.1+1"     # your JDK 17 folder
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version    # must say 17
```

(You can download a portable Temurin 17 zip from https://adoptium.net/ and unzip it anywhere; no admin rights are needed.)

## Install and run

```bash
npm install
npm start            # Expo dev server (use a development build or the Android emulator)
```

## Checks

```bash
npm run typecheck    # TypeScript (strict)
npm run lint         # ESLint (expo lint)
npm test             # all tests (engine, i18n, state, result screen, release config)
npm run evaluate     # re-runs the labelled dataset and rewrites docs/EVALUATION.md
```

See [docs/TESTING.md](docs/TESTING.md).

## Build an Android test APK

**Windows: build from a short folder.** Native C++ code generated for React Native libraries produces file paths longer than Windows' 260-character limit when the project sits in a deep folder (for example `C:\Users\you\Desktop\Android app\scamlens`). The build then fails with `ninja: error: mkdir(...): No such file or directory`. A `subst` drive letter does **not** help (Node resolves it back to the real path). Use the helper script, which copies the source to `C:\s`, builds there, and copies the result back to `build-output\`:

```powershell
$env:JAVA_HOME = "C:\Users\you\tools\jdk-17.0.20.1+1"     # JDK 17!
.\scripts\build-android.ps1                        # test APK   -> build-output\app-release.apk
.\scripts\build-android.ps1 -Task bundleRelease    # Play bundle -> build-output\app-release.aab
```

(Alternatives: enable Windows long paths as administrator, or keep the project in a very short folder such as `C:\s`.) Do not hand-write `android/local.properties`; `ANDROID_HOME` is enough. On macOS/Linux the usual `npx expo prebuild --platform android` then `cd android && ./gradlew assembleRelease` works.

The unused native libraries **react-native-reanimated, react-native-worklets and react-native-gesture-handler** (pulled in transitively by Expo Router) are excluded from the Android build (`expo.autolinking.exclude` in `package.json`). The app's JavaScript bundle was checked and contains none of their code. If you ever add a library or screen that needs them, remove them from that list.

The release build is signed with the **debug key** unless you configure an upload key, so it is for testing only, **not** for Google Play. For a Play upload see [docs/GOOGLE_PLAY_RELEASE.md](docs/GOOGLE_PLAY_RELEASE.md). Never commit a keystore or its passwords.

Install on a phone with USB debugging:

```bash
adb install -r build-output/app-release.apk
```

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short: `src/engine` (detection), `src/i18n` (en/hi/gu), `src/app` (screens), `src/state` (settings, history), `docs/` (documentation), `store/` (Google Play listing drafts and graphics), `scripts/` (build and evaluation helpers), `plugins/` (Expo config plugin for signing and short build paths).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Detection engine](docs/DETECTION_ENGINE.md) · [Evaluation report](docs/EVALUATION.md)
- [Privacy and permissions](docs/PRIVACY.md)
- [Testing](docs/TESTING.md)
- [Google Play release](docs/GOOGLE_PLAY_RELEASE.md) · [Final audit](docs/FINAL_AUDIT.md)
- [Changelog](docs/CHANGELOG.md)

## Licence and attribution

The licence for ScamLens itself has **not been chosen yet** (decision for the owner). Third-party libraries keep their own licences; see `docs/play/THIRD_PARTY_LICENSES.md` (the Expo project-template notice, covering a few config files that came from the template, is kept in `docs/play/EXPO_TEMPLATE_LICENSE.txt`). The development workflow used the open-source [`mobile-app-skill`](https://github.com/deonmenezes/mobile-app-skill) pack by Deon Menezes (MIT) as a guide; it is not bundled in this app.
