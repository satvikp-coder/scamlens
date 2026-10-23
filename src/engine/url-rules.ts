/**
 * Structural checks on one parsed URL.
 *
 * Everything here looks only at the text of the link. We cannot tell whether
 * a site is new, hacked or malicious, so these checks flag suspicious
 * STRUCTURE (for example a bank's name inside someone else's domain) and
 * never declare a site "safe".
 */

import {
  BRANDS,
  BRAND_LABELS,
  COMMON_WORDS,
  HOMOGLYPHS,
  RISKY_TLDS,
  SENSITIVE_PARAMS,
  SHORTENERS,
  type Brand,
} from './domain-data';
import type { Evidence, Finding, FindingId, Note, Severity } from './types';
import type { ParsedUrl } from './url-parse';

export interface UrlCheckResult {
  findings: Finding[];
  notes: Note[];
}

/** Edit distance counting a swap of two neighbouring letters as one edit. */
export function damerauLevenshtein(a: string, b: string): number {
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Fold look-alike characters together ("paytrn" -> "paytm", "g00gle" -> "google"). */
export function foldConfusables(s: string): string {
  return s
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/[0]/g, 'o')
    .replace(/[1il]/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's');
}

type Script = 'latin' | 'cyrillic' | 'greek' | 'devanagari' | 'gujarati' | 'other';

function scriptOf(ch: string): Script | null {
  const cp = ch.codePointAt(0) as number;
  if ((cp >= 0x30 && cp <= 0x39) || cp === 0x2d) return null; // digits, hyphen: neutral
  if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a) || (cp >= 0xc0 && cp <= 0x24f)) {
    return 'latin';
  }
  if (cp >= 0x400 && cp <= 0x52f) return 'cyrillic';
  if (cp >= 0x370 && cp <= 0x3ff) return 'greek';
  if (cp >= 0x900 && cp <= 0x97f) return 'devanagari';
  if (cp >= 0xa80 && cp <= 0xaff) return 'gujarati';
  return 'other';
}

function scriptsIn(label: string): Set<Script> {
  const set = new Set<Script>();
  for (const ch of label) {
    const sc = scriptOf(ch);
    if (sc) set.add(sc);
  }
  return set;
}

function brandOfOfficialDomain(registrable: string): Brand | undefined {
  return BRANDS.find((b) => b.officialDomains.includes(registrable));
}

function isGovernmentDomain(registrable: string): boolean {
  return registrable.endsWith('.gov.in') || registrable.endsWith('.nic.in');
}

export function checkUrl(url: ParsedUrl, base: number): UrlCheckResult {
  const findings: Finding[] = [];
  const notes: Note[] = [];

  const ev = (range: [number, number] | null): Evidence[] => {
    if (!range) return [];
    const [s, e] = range;
    return [{ start: base + s, end: base + e, text: url.raw.slice(s, e) }];
  };
  const add = (
    id: FindingId,
    severity: Severity,
    decisive: boolean,
    evidence: Evidence[],
    params?: Record<string, string>,
  ) => {
    findings.push({ id, category: 'link', severity, decisive, evidence, params });
  };

  const pathAndQuery = (url.path + '?' + url.query).toLowerCase();
  const official = url.hostKind === 'domain' ? brandOfOfficialDomain(url.registrable) : undefined;
  const government = url.hostKind === 'domain' && isGovernmentDomain(url.registrable);

  // --- Scheme -----------------------------------------------------------
  if (url.scheme === 'http') {
    const sensitive = /login|signin|verify|kyc|pay|otp|secure|bank|update|account/.test(pathAndQuery);
    add('url.not_https', sensitive ? 'moderate' : 'weak', false, ev(url.offsets.scheme));
  } else if (url.scheme && url.scheme !== 'https') {
    add('url.unsafe_scheme', 'moderate', false, ev(url.offsets.scheme), { scheme: url.scheme });
  }

  // --- Credentials inside the link (https://bank.com@evil.xyz) -----------
  if (url.userinfo !== null && url.userinfo.length > 0) {
    const looksLikeDomain = /[./]/.test(url.userinfo);
    add(
      'url.userinfo',
      looksLikeDomain ? 'strong' : 'moderate',
      looksLikeDomain,
      ev(url.offsets.userinfo),
      { userinfo: url.userinfo, host: url.host },
    );
  }

  // --- IP address instead of a name ---------------------------------------
  if (url.hostKind !== 'domain') {
    add('url.ip_host', 'moderate', false, ev(url.offsets.host), { host: url.host });
  }

  if (url.hostKind === 'domain') {
    if (official) {
      notes.push({ id: 'official_domain_match', params: { brand: official.name, domain: url.registrable } });
    }

    // --- Imitating a known brand -------------------------------------------
    if (!official && !government) {
      let brandFlagged: Brand | undefined;

      // (a) A real domain written in the sub-domain part:
      //     sbi.co.in.secure-login.xyz
      const subdomain = url.subdomain;
      if (subdomain.length > 0) {
        for (const b of BRANDS) {
          const hit = b.officialDomains.find((d) => subdomain === d || subdomain.endsWith('.' + d) || subdomain.includes(d + '.'));
          if (hit) {
            add('url.brand_in_subdomain', 'strong', true, ev(url.offsets.host), {
              brand: b.name,
              shown: hit,
              real: url.registrable,
            });
            brandFlagged = b;
            break;
          }
        }
        if (!brandFlagged && /(?:^|\.)[a-z0-9-]+\.(?:com|in|co\.in|org|net|gov\.in|nic\.in)(?:\.|$)/.test(subdomain)) {
          add('url.domain_in_subdomain', 'moderate', false, ev(url.offsets.host), {
            real: url.registrable,
          });
        }
      }

      // (b) A brand word inside a domain that is not the brand's own.
      if (!brandFlagged) {
        const words: string[] = [];
        for (const label of url.labels.slice(0, -1)) {
          for (const w of label.split('-')) if (w) words.push(w);
        }
        for (const b of BRANDS) {
          const matched = b.tokens.find((t) =>
            t.length < 6 ? words.includes(t) : words.some((w) => w.includes(t)),
          );
          if (matched) {
            add('url.lookalike_brand', 'strong', true, ev(url.offsets.host), {
              brand: b.name,
              domain: url.registrable,
            });
            brandFlagged = b;
            break;
          }
        }
      }

      // (c) Spelled almost like a brand: paytrn.com, amaz0n.in, flipkrat.com
      if (!brandFlagged) {
        // Compare the whole first label and each hyphen-separated word of
        // every label, so "amaz0n-offers.in" is caught as well as "paytrn.com".
        const candidates = new Set<string>([url.registrable.split('.')[0]]);
        for (const label of url.labels.slice(0, -1)) {
          for (const w of label.split('-')) if (w.length >= 5) candidates.add(w);
        }
        outer: for (const word of candidates) {
          for (const { label: officialLabel, brand } of BRAND_LABELS) {
            if (word === officialLabel || COMMON_WORDS.has(word)) continue;
            const decisive = foldConfusables(word) === foldConfusables(officialLabel);
            if (decisive || (word.length >= 6 && damerauLevenshtein(word, officialLabel) === 1)) {
              add('url.typosquat', 'strong', decisive, ev(url.offsets.host), {
                brand: brand.name,
                domain: url.registrable,
                resembles: officialLabel,
              });
              brandFlagged = brand;
              break outer;
            }
          }
        }
      }

      // (d) "gov" in the name of a site that is not a .gov.in / .nic.in site.
      if (!brandFlagged) {
        const govWord = url.labels
          .slice(0, -1)
          .flatMap((l) => l.split('-'))
          .some((w) => w === 'gov' || w === 'govt' || w === 'government');
        if (govWord) {
          add('url.gov_lookalike', 'moderate', false, ev(url.offsets.host), { domain: url.registrable });
          brandFlagged = undefined;
        }
      }

      // (e) Brand name only in the path: this proves nothing about who runs
      //     the site, and is a common way to look official.
      if (!brandFlagged) {
        const inPath = BRANDS.find((b) => b.tokens.some((t) => t.length >= 4 && pathAndQuery.includes(t)));
        if (inPath) {
          add('url.brand_in_path', 'weak', false, ev(url.offsets.path), {
            brand: inPath.name,
            domain: url.registrable,
          });
        }
      }
    }

    // --- International characters ---------------------------------------
    if (url.hasPunycode || url.hasNonAscii) {
      const decoded = url.decodedLabels.join('.');
      const mixed = url.decodedLabels.find((l) => {
        const s = scriptsIn(l);
        return s.has('latin') && (s.has('cyrillic') || s.has('greek'));
      });
      const homoglyphOnly = url.decodedLabels.find(
        (l) => l.length >= 3 && [...l].every((ch) => HOMOGLYPHS.has(ch) || /[0-9-]/.test(ch)) && [...l].some((ch) => HOMOGLYPHS.has(ch)),
      );
      if (mixed) {
        add('url.mixed_script', 'strong', true, ev(url.offsets.host), { shown: decoded, host: url.host });
      } else if (homoglyphOnly) {
        add('url.idn_lookalike', 'strong', true, ev(url.offsets.host), { shown: decoded, host: url.host });
      } else {
        add('url.punycode', 'moderate', false, ev(url.offsets.host), { shown: decoded, host: url.host });
      }
    }

    // --- Link shorteners --------------------------------------------------
    if (SHORTENERS.has(url.registrable)) {
      add('url.shortener', 'moderate', false, ev(url.offsets.host), { service: url.registrable });
    }

    // --- Structure hints (weak) ---------------------------------------------
    if (!official && !government) {
      if (RISKY_TLDS.has(url.tld)) {
        add('url.risky_tld', 'weak', false, ev(url.offsets.host), { tld: url.tld });
      }
      if (url.subdomain.length > 0 && url.subdomain.split('.').length >= 3) {
        add('url.many_subdomains', 'weak', false, ev(url.offsets.host), {
          count: String(url.subdomain.split('.').length),
        });
      }
      const hyphens = (url.registrable.split('.')[0].match(/-/g) ?? []).length;
      if (hyphens >= 3) {
        add('url.many_hyphens', 'weak', false, ev(url.offsets.host), { count: String(hyphens) });
      }
    }
  }

  // --- Downloading an app file ------------------------------------------------
  if (/\.apk(?:$|[?&#/])/.test(pathAndQuery.replace(/\?$/, ''))) {
    add('url.apk', 'strong', true, ev(url.offsets.path[1] > url.offsets.path[0] ? url.offsets.path : url.offsets.query));
  }

  // --- Query string -----------------------------------------------------------
  if (url.query.length > 0) {
    const params = url.query.split('&').filter(Boolean);
    if (params.length > 8) {
      add('url.many_params', 'weak', false, ev(url.offsets.query), { count: String(params.length) });
    }
    const sensitive = params
      .map((p) => p.split('=')[0].toLowerCase())
      .find((name) => SENSITIVE_PARAMS.has(name));
    if (sensitive) {
      add('url.sensitive_param', 'moderate', false, ev(url.offsets.query), { name: sensitive });
    }
  }

  if (url.raw.length > 150) {
    add('url.very_long', 'weak', false, [{ start: base, end: base + Math.min(url.raw.length, 80), text: url.raw.slice(0, 80) + '…' }], {
      length: String(url.raw.length),
    });
  }

  if (url.port !== null && url.port !== '' && url.port !== '80' && url.port !== '443') {
    add('url.nonstandard_port', 'weak', false, ev(url.offsets.host), { port: url.port });
  }

  return { findings, notes };
}
