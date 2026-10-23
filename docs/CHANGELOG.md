# Changelog

All notable implementation milestones. Version numbers follow `app.json`.

## 0.1.0 (unreleased, not published)

### Foundation
- Project scaffolded with Expo SDK 58, React Native 0.88, TypeScript (strict), Expo Router. Template demo code and unused packages removed (web, animation, glass-effect, symbols, etc.).
- JDK 17 selected for Android builds (system JDK 24 and Android Studio's bundled JDK 25 are too new for the Android Gradle Plugin).

### Detection engine (`src/engine`)
- Input normalization with a position map back to the original text (case, NFKC, Hindi/Gujarati digits, zero-width characters).
- Data-driven message rules for 13 warning signs in English, Hinglish, Hindi and Gujarati, with negation handling ("never share your OTP"), a delivery-partner exception and context rules.
- Hand-written URL parser and 23 link checks (look-alike brands, brand in sub-domain, typosquatting, `user@host` tricks, punycode / mixed-script, IP hosts, shorteners, `.apk` links, weak structural hints).
- Evidence-based aggregation with per-category de-duplication, "decisive" findings, honest "unable to assess" result.
- Labelled fictional dataset (70 examples: dev / regression / held-out) and evaluation harness (`npm run evaluate` → `docs/EVALUATION.md`).

### App
- Localization (English, Hindi, Gujarati) with a typed key set; tests enforce identical keys, placeholders and bullet counts.
- Onboarding (language + 4 short slides, skippable), Home, Check (message / link), Result, Learn (10 lessons + practice quiz), History, Settings, Privacy, About.
- Local settings and history storage with failure reporting, compact history entries, optional original-text saving, delete one / delete all.
- Accessibility: icon + text for every risk level, 48 dp touch targets, labelled controls, live regions for errors/results.

### Privacy and release hygiene
- `INTERNET`, storage, overlay and vibrate permissions removed from the manifest; Android Auto Backup disabled.
- App icon, adaptive/monochrome icons, splash image and Play graphics generated.
- Play listing drafts (en/hi/gu), privacy-policy draft, Data safety draft, content-rating guidance, licence inventory.

### Bugs found and fixed during development
- History `add` used a stale list, so two quick saves could overwrite each other (found by a test; fixed with a ref).
- A link's `user:password@` part could have been copied into history parameters (fixed; covered by a test).
- Android Auto Backup was on by default and would have copied saved history to the user's Google account (disabled).
- Settings provider wrote a ref during render (lint error; fixed).
