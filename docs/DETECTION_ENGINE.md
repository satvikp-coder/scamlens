# Detection engine

ScamLens uses a **transparent, rule-based** engine. There is no machine-learning model, no cloud service and no network access. The same input always gives the same result, and every result can be traced to specific rules and to specific words or link parts in the input.

It is a **heuristic helper**. It looks for known warning signs. It can miss scams and it can raise alarms for honest messages. See [Known limitations](#known-limitations).

Code: `src/engine/`. Everything is a pure function (text in, structured result out).

## Pipeline

```
input text
  │  normalize.ts      lower-case, NFKC, Indic digits -> 0-9, remove zero-width chars
  │                    (keeps a map back to the ORIGINAL text for evidence)
  ├─ message-detect.ts runs the data-driven rules in message-rules.ts
  ├─ url-parse.ts      finds links, parses them by hand (no network, no URL class)
  ├─ url-rules.ts      structural checks on each link
  ▼
findings (stable ids + evidence + small params)
  │  assess.ts         dedupe by category -> internal score -> level -> actions -> limitations
  ▼
AnalysisResult         (language-free; the UI translates it: src/presentation/describe.ts)
```

`analyzeMessage(text)` and `analyzeUrl(text)` in `src/engine/index.ts` are the only entry points.

## Result model (`types.ts`)

| Field | Meaning |
|---|---|
| `level` | `low` ("Low apparent risk"), `caution`, `high`, `unable` ("Unable to assess reliably") |
| `findings[]` | `id` (stable, e.g. `credentials.otp`), `category`, `severity` (`weak`/`moderate`/`strong`), `decisive`, `evidence[]`, `params` |
| `evidence[]` | `start`/`end` offsets into the **original** input plus the quoted text (max 3 per finding, 140 chars each) |
| `notes[]` | neutral observations (e.g. "domain matches the listed domain for SBI") |
| `actions[]` | ids of recommended safe actions |
| `limitations[]` | ids of caveats to show |
| `score` | internal ordering value. **Never shown.** Not a probability. |
| `hosts[]` | website names seen (never opened) |

The engine produces **no display text**. The UI looks up `finding.<id>.title` / `.why`, `action.<id>` and `limit.<id>` in `src/i18n/{en,hi,gu}.ts`. A test checks that every finding id has text, and that Hindi and Gujarati have every key with the same placeholders.

## Rules

### Message rules (`message-rules.ts`)

Each rule is a data entry: `id`, `category`, `severity`, `decisive`, `patterns[]` (English, Hinglish, Hindi and Gujarati patterns together), and optional `context`, `strongWhen`, `negatable`, `exceptionNear`, `notBefore`, `notAfter`.

| Id | Category | Severity | Decisive | What it looks for |
|---|---|---|---|---|
| `credentials.otp` | credentials | strong | yes | asks you to share/send/tell an OTP |
| `credentials.pin_password` | credentials | strong | yes | asks for UPI/ATM PIN, MPIN, password |
| `credentials.card` | credentials | strong | yes | asks for card number, CVV, expiry |
| `payment.fee` | payment | moderate (strong with parcel/courier/customs words) | no | pay a "fee/charge/fine" with an amount |
| `payment.upi_trick` | payment | strong | yes | scan a QR / enter UPI PIN to *receive* money |
| `urgency.pressure` | urgency | weak | no | "urgent", "within 24 hours", "last warning" |
| `urgency.threat` | urgency | moderate (strong for "digital arrest", drugs, etc.) | no | account will be blocked, arrest, legal action |
| `reward.prize` | reward | strong | no | lottery, "you have won", claim your prize |
| `job.upfront_fee` | job | strong | no | registration/joining/training fee **in a job message** |
| `job.easy_income` | job | moderate | no | "earn Rs X per day from home", task scams |
| `impersonation.authority` | impersonation | weak | no | names a bank/agency **and** asks you to click/call/verify |
| `remote.app` | remote-access | strong | yes | install AnyDesk/TeamViewer, share screen |
| `offplatform.contact` | off-platform | weak | no | continue on WhatsApp/Telegram |

#### Avoiding false alarms

- **Negation.** "Never share your OTP", "ओटीपी किसी को साझा न करें", "શેર ન કરો", "share mat karo" are advice, not requests. Negation is checked before, inside and after a match. "नहीं तो" ("or else") is treated as a threat, not a negation.
- **Delivery-partner exception.** "Share OTP 5432 with the delivery partner" is normal for delivery apps and is not flagged.
- **Context rules.** A registration fee is only a job-scam sign in a job message. A bank name only counts as impersonation if the message also tells you to act.
- **"No fee".** "No registration fee" / "we never charge any fee" does not trigger the job-fee rule.
- **Mentioning money, a bank, a courier or a job is not a finding by itself.**
- Spelling mistakes, grammar and the language used are never treated as evidence.

### Link rules (`url-rules.ts`)

All checks are on the **text** of the link. Links are never opened or fetched.

| Id | Severity | Decisive | Meaning |
|---|---|---|---|
| `url.brand_in_subdomain` | strong | yes | a listed official domain appears in the sub-domain part (`sbi.co.in.evil.xyz`) |
| `url.lookalike_brand` | strong | yes | a brand word appears in a domain that is not the brand's |
| `url.typosquat` | strong | yes if confusable-letter match (`paytrn`, `amaz0n`); otherwise no (edit distance 1) | spelled almost like a brand |
| `url.userinfo` | strong if it looks like a domain (decisive), else moderate | | `https://bank.com@evil.xyz` |
| `url.mixed_script` / `url.idn_lookalike` | strong | yes | Latin mixed with Cyrillic/Greek, or all look-alike letters |
| `url.apk` | strong | yes | link downloads an `.apk` |
| `url.unsafe_scheme` | strong (decisive) for `javascript:`, `data:` etc.; moderate for others | | |
| `url.punycode` | moderate | no | international characters in the domain (decoded form shown) |
| `url.ip_host` | moderate | no | number address instead of a name |
| `url.shortener` | moderate | no | destination hidden |
| `url.sensitive_param` | moderate | no | `otp=`, `pin=`, `password=` in the query |
| `url.domain_in_subdomain`, `url.gov_lookalike` | moderate | no | |
| `url.not_https` | weak (moderate on a login-like path) | no | plain http |
| `url.risky_tld`, `url.many_subdomains`, `url.many_hyphens`, `url.very_long`, `url.many_params`, `url.nonstandard_port`, `url.brand_in_path` | weak | no | weak structural hints |

Important design points:

- **A brand name in the path or as part of an unrelated domain is never proof of affiliation.** `https://example.com/blog/how-to-use-paytm-safely` gets only a weak `url.brand_in_path` note. An official domain (`www.sbi.co.in`) is matched on the **registrable domain** (the last two labels, or three for `co.in`, `gov.in`, etc.), not on a substring.
- **HTTPS is never treated as proof of safety.** Unknown, well-formed HTTPS links return "Low apparent risk" with the limitation "finding no warning signs does not mean it is safe".
- **The brand and domain lists are partial** (`domain-data.ts`) and hand-written. A domain not on a list means "unknown", not "safe" and not "unsafe". The public-suffix list is a small built-in set (Indian suffixes and a few others), not the full Public Suffix List.
- Malformed links (spaces, empty labels, bad port, no host) return `unable` with the reason.

## Aggregation (`assess.ts`)

1. **Dedupe by category.** Within a category only the strongest finding counts, so the same underlying warning cannot be counted twice. (Findings with the same id from different links are merged into one with more evidence.)
2. Points per category: weak 1, moderate 2, strong 4.
3. Combination bonus **+2** when pressure (`urgency`) comes together with a request for action (`credentials`, `payment`, `link`, `remote-access`), and **+2** when impersonation comes with such a request. Pressure alone is common in honest messages.
4. Level:
   - any **decisive** finding → `high`
   - score ≥ 6 → `high`
   - score ≥ 3 → `caution`
   - for a bare link: any non-weak finding → at least `caution`
   - otherwise `low`
5. `unable`: empty input, a message that is too short or has too few words and no link, or a malformed link.

**The weights are hand-chosen, not fitted to data.** The score is used only to order cases and choose the level. It is never shown, and a higher score does not mean a higher probability of fraud.

## Recommended actions

Derived from level and categories (`actionsFor`): do not click, do not share OTP/PIN, do not pay, do not install apps, verify through an official channel, report (call 1930 / cybercrime.gov.in), and what to do if you already acted. For "low", only "stay careful" (and "verify" if there are links).

## Adding a rule

1. Add an entry to `MESSAGE_RULES` (or a check in `url-rules.ts` plus its id in `URL_FINDING_IDS`).
2. Add `finding.<id>.title` and `finding.<id>.why` to `en.ts`, `hi.ts`, `gu.ts`.
3. Add benign **and** suspicious examples to `src/engine/__fixtures__/dataset.ts`.
4. Run `npm test` (the whole regression dataset runs) and `npm run evaluate`.

## Known limitations

- Fixed rules cannot understand meaning. A scammer who rewords a message can avoid them. Genuinely new scam types are not detected until a rule is added.
- Honest messages that look like scams (for example a real bank reminder to pay a fee) can be flagged as "caution".
- The one known miss in the held-out set: "your electricity will be disconnected tonight, call now to update your bill" is rated low. See [EVALUATION.md](EVALUATION.md).
- English has far more test examples than Hindi, Gujarati or mixed text. Equal accuracy across languages is **not** claimed. The Hindi and Gujarati patterns and text have not been reviewed by native speakers.
- Links are examined as text only. New, hacked or malicious sites with ordinary-looking names cannot be recognised; a shortened link's destination cannot be seen.
- No phone-number, UPI-ID, image or QR-code analysis. Voice calls are out of scope.
- Brand and TLD lists need regular review (they will go out of date).
