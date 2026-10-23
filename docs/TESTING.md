# Testing

## Commands

```bash
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # expo lint (ESLint, expo config + React hooks/compiler rules)
npm test             # Jest (jest-expo): all suites below
npm run evaluate     # runs the labelled dataset and rewrites docs/EVALUATION.md
```

## What the automated suite covers (last run: 6 suites, 139 tests, all passing)

| Suite | Tests | What it checks |
|---|---|---|
| `src/engine/engine.test.ts` | 99 | normalization (case, NFKC, Indic digits, zero-width) and offset mapping; URL extraction and parsing (IDs, IPs, ports, malformed input, 100 000-character URL); punycode; edit distance / confusable folding; aggregation (a category counts once; pressure + action bonus); engine behaviour (never throws on odd input, truncation, evidence points at exact original text, de-duplication, no probability wording, official-domain note without calling it safe, performance of a 5 000-character message); **every dev + regression dataset example** (58) with required / forbidden finding ids |
| `src/engine/evaluate.test.ts` | 2 | the same dataset including the held-out set; prints/writes the evaluation report |
| `src/i18n/i18n.test.ts` | 16 | Hindi and Gujarati have every English key, no empty strings, identical `{placeholders}` and bullet-line counts, correct scripts; every finding id has title + explanation; every lesson/practice item has text; **input → engine → localized text** for English, Hindi and Gujarati without leftover placeholders; private text never appears in the share summary |
| `src/state/history.test.tsx` | 11 | history saves a compact summary without the user's text; strips a link's `user:password@`; saves original text only when enabled; nothing saved when history is off; delete one; **clear really removes the stored key**; settings + history survive a restart (unmount/mount); failed save and failed delete are reported; corrupt stored data is ignored; entry cap |
| `src/components/result-flow.test.tsx` | 5 | renders the real result screen from engine output: level, summary, evidence quote, explanation, action, limits and disclaimer; "no findings" is never called safe; vague input → "Unable to assess"; language change (en → hi → gu) updates the screen immediately; "Check another" callback |
| `src/release-config.test.ts` | 6 | no invented contact details; INTERNET/storage/overlay/vibrate permissions are blocked; backup disabled; Android-only; no analytics/ads/networking libraries in `package.json`; no keystore/env/service-account files in the project root |

Bugs these tests caught during development are listed in `docs/CHANGELOG.md`.

### Regression rule

Every change to the detection engine must keep `npm test` green. The dataset in `src/engine/__fixtures__/dataset.ts` is a regression suite; **do not delete or weaken an example to make it pass**. If a rule change is justified, change the expectation with a comment explaining why.

## Evaluation methodology

See `docs/EVALUATION.md` (generated). In short:

- 70 fictional, hand-written examples: 20 dev, 38 regression, 12 held-out; benign and suspicious; English, Hindi, Gujarati, Hinglish and mixed.
- Labels: suspicious → expect *caution* or *high*; benign → *low*; vague/malformed → *unable* (some examples pin an exact level).
- The held-out examples were written **before** the rules were first run and were **not** used for tuning. One held-out scam (electricity-disconnection call scam) is rated *low* by the engine; it is left as a known miss.
- Precision/recall over everything is reported but is **inflated** (dev/regression were used to write the rules). No figure from this set may be quoted as the accuracy of the app.

### Limits of the evaluation

Synthetic and small; written by the rule authors; no native-speaker or fraud-investigator review; no adversarial rewording; far fewer Hindi/Gujarati/mixed examples than English.

## Not covered by automated tests (and how to check)

- **Real device or emulator behaviour** (rendering of Devanagari/Gujarati fonts, text scaling, TalkBack, back button, keyboard behaviour, slow devices): not run. No device, emulator image or `sdkmanager` was available in the development environment. See the manual checklist.
- Jest uses a mocked AsyncStorage and a mocked icon font; real Android storage is exercised only on a device.
- No end-to-end (Detox/Maestro) tests have been written.

## Manual device checklist (to complete on a real Android phone)

Install `build-output/app-release.apk` (or the AAB through internal testing) and verify each item. Tick only what you have seen.

**First run**
- [ ] App starts, splash then onboarding. Language step shows English / हिन्दी / ગુજરાતી and the UI changes immediately when you pick one.
- [ ] Skip works; the intro can be completed; after restart the intro does not reappear.

**Fonts and scripts** (do this in each language)
- [ ] Devanagari and Gujarati text render correctly (no boxes, conjunct letters intact, no clipped lines) on Home, Learn, a lesson, Result, Settings.
- [ ] Mixed text (Hindi message with English words) displays correctly in the evidence quote.

**Check flow**
- [ ] Empty input shows the validation message. Very long text (>5 000 characters) is limited with a visible counter.
- [ ] Paste button reads the clipboard only when tapped. Clear empties the box.
- [ ] Message from the README examples gives the expected level; a normal chat message gives "Low apparent risk" with the "not a guarantee" wording.
- [ ] Link tab: valid, look-alike, malformed (`http://exa mple.com`), shortener, IP, `javascript:`; the link is **never** opened.
- [ ] Copy summary and Share summary do not contain the original message.
- [ ] "Check another" returns to an empty input; Android **Back** from the result keeps the text.

**History and privacy**
- [ ] A check appears in History; opening it works after closing and reopening the app.
- [ ] Turn "Also save original text" on: the exact quotes appear when reopening.
- [ ] Delete one entry; Delete all history; reopen app: still empty.
- [ ] Turn history off: new checks are not saved.
- [ ] Airplane mode: everything still works. In Settings → Apps → ScamLens → Permissions: no permissions listed.

**Accessibility**
- [ ] Font size set to the largest and display size to the largest: nothing is cut off and buttons remain tappable.
- [ ] TalkBack reads risk level (word, not only colour), buttons and form fields sensibly; evidence quotes are readable.
- [ ] Dark mode (system setting) is readable on all screens; the risk badge is distinguishable without colour.

**Robustness**
- [ ] Rotate / split-screen / background and return: no crash, no loss of unsaved input beyond Android's normal behaviour.
- [ ] A low-end device feels responsive (analysis of a long message is near-instant).
