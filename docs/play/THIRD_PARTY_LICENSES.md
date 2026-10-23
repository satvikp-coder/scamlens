# Third-party licence inventory

Generated from the installed packages (`package-lock.json` production tree). Re-generate before each release. This is an inventory, **not legal advice**: check each licence's attribution requirements before publishing. The bundled Android native/Gradle dependencies (React Native, Hermes, AndroidX, Kotlin, etc.) come with React Native and Expo and are covered by their own licences (mostly MIT and Apache-2.0).

## Direct dependencies

| Package | Version | Licence | Kind |
|---|---|---|---|
| @expo/vector-icons | 15.1.1 | MIT | direct |
| @react-native-async-storage/async-storage | 2.2.0 | MIT | direct |
| expo | 58.0.17 | MIT | direct |
| expo-clipboard | 58.0.4 | MIT | direct |
| expo-constants | 58.0.13 | MIT | direct |
| expo-font | 58.0.9 | MIT | direct |
| expo-linking | 58.0.14 | MIT | direct |
| expo-router | 58.0.25 | MIT | direct |
| expo-splash-screen | 58.0.11 | MIT | direct |
| expo-status-bar | 58.0.4 | MIT | direct |
| expo-system-ui | 58.0.6 | MIT | direct |
| react | 19.3.0 | MIT | direct |
| react-native | 0.88.0 | MIT | direct |
| react-native-safe-area-context | 5.10.1 | MIT | direct |
| react-native-screens | 4.30.0 | MIT | direct |

## All production packages in the lockfile (543) by licence

| Licence | Count |
|---|---|
| MIT | 460 |
| ISC | 33 |
| NOT FOUND | 20 |
| BSD-3-Clause | 6 |
| BlueOak-1.0.0 | 6 |
| Apache-2.0 | 5 |
| (MIT OR CC0-1.0) | 2 |
| Unlicense | 2 |
| MPL-2.0 | 2 |
| BSD-2-Clause | 2 |
| Python-2.0 | 1 |
| CC-BY-4.0 | 1 |
| (MIT OR Apache-2.0) | 1 |
| 0BSD | 1 |
| (BSD-3-Clause OR GPL-2.0) | 1 |

Notes: the lockfile lists build-time tooling (Babel, Metro, etc.) that is **not** shipped in the app; only JavaScript that is actually imported is bundled. "NOT FOUND" means an optional platform-specific package listed in the lockfile but not installed on this Windows machine (for example macOS/Linux binaries). The MPL-2.0, CC-BY-4.0 and Python-2.0 entries are build-time packages; confirm they are not bundled before publishing, and add required notices if they are.

## Development aid (not shipped)

The [mobile-app-skill](https://github.com/deonmenezes/mobile-app-skill) pack (MIT, Deon Menezes; bundles skills from Expo, Callstack, Google and others under their own licences) was used as a development guide. It is not part of the app. The `gplay` CLI (tamtom/play-console-cli) is used for offline preflight scans only.
