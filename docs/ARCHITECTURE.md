# Architecture

ScamLens is an Android-first React Native app built with Expo (SDK 58) and TypeScript (strict). All analysis runs on the phone. There is no backend, account system, analytics or external AI service.

## Layers

```
src/
├─ engine/        Pure TypeScript, no React. Detection logic. (see DETECTION_ENGINE.md)
│   └─ __fixtures__/dataset.ts   labelled fictional examples
├─ presentation/  describe.ts: structured findings -> translated sentences
├─ i18n/          en.ts (source of truth), hi.ts, gu.ts, index.ts (translate, interpolate)
├─ content/       lesson / practice ids and icons (text lives in i18n)
├─ state/         React context: settings, history, current check
├─ storage/       AsyncStorage wrapper that reports failures
├─ theme/         colour palettes (light/dark), spacing, typography
├─ components/    reusable UI: Button, Card, LevelBadge, FindingCard, ResultView, ...
├─ app/           Expo Router screens (file-based routes)
└─ config.ts      support email / privacy-policy URL (null until real)
```

**Rule of thumb:** the engine never knows about language or React; the UI never contains detection logic. A finding is stable data (`credentials.otp`) and the selected language decides the wording.

## Navigation (Expo Router)

```
app/_layout.tsx          providers + Stack; onboarding gate (Stack.Protected)
├─ onboarding.tsx        language + 4 short slides (skippable)
├─ (tabs)/               Home · Learn · History · Settings
├─ analyze.tsx           Message / Link input
├─ result.tsx            result for the current check, or ?id= for a saved one
├─ lesson/[id].tsx       one lesson
├─ practice.tsx          "Scam or not?" quiz
├─ privacy.tsx, about.tsx
```

Android Back works through the navigator. "Check another" clears the in-memory check and returns to an empty input; pressing Back instead keeps the text so it can be edited.

## State and storage

| Store | Key | Contents |
|---|---|---|
| Settings | `scamlens.settings.v1` | language, onboarded, historyEnabled, saveText, practice best score |
| History | `scamlens.history.v1` | up to 100 entries: id, time, kind, level, **compact** result (no evidence quotes, no websites, no `user:pass@` part), and `text` only if the user turned on "save original text" |

- Storage is `@react-native-async-storage/async-storage` (unencrypted app-private storage). Auto Backup is **disabled** (`allowBackup=false`) so history is not copied to Google Drive.
- Reads and writes report failures to the UI (history error banner, settings warning). Corrupt data is ignored instead of crashing.
- The result being viewed lives in memory (`current-check`). If the user saved the original text, opening a history entry re-runs the engine so exact quotes can be shown; otherwise the compact summary is shown.
- Language changes update the UI immediately (the `t()` function comes from context).

## Privacy-relevant design choices

- No network permission (`INTERNET` is removed in the manifest). The app never opens, fetches or previews links.
- Clipboard is read only when the user taps **Paste**.
- Copy/Share send a short summary (level + names of warning signs), never the original message.
- No logging of user content; the error boundary does not log error details.

## Dependencies (kept minimal)

`expo`, `expo-router`, `react-native`, `react-native-screens`, `react-native-safe-area-context`, `expo-constants`, `expo-linking`, `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-clipboard`, `@react-native-async-storage/async-storage`, `@expo/vector-icons`. Dev: `jest`, `jest-expo`, `@testing-library/react-native`, `typescript`, `eslint`. Note: `expo-router` itself depends on `react-native-drawer-layout`, which brings in `react-native-reanimated`, `react-native-gesture-handler` and `react-native-worklets`; these are installed transitively and compiled into the app but ScamLens does not use drawers or animations directly. See [PRIVACY.md](PRIVACY.md) and `docs/play/THIRD_PARTY_LICENSES.md`.

## Future iOS

The code is cross-platform React Native, but the project is configured Android-only (`platforms: ["android"]`). iOS would need an Apple account, signing and a review of the share/clipboard behaviour. It is deliberately not part of the first release.
