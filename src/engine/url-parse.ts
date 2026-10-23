/**
 * URL extraction and parsing.
 *
 * We parse by hand instead of using the platform `URL` class because the
 * React Native JS engine's URL support is incomplete and does not do
 * internationalized-domain handling. Parsing is purely textual: nothing here
 * ever contacts the network.
 */

import { BARE_DOMAIN_TLDS, MULTIPART_SUFFIXES } from './domain-data';
import { decodePunycodeLabel } from './punycode';

export type HostKind = 'domain' | 'ipv4' | 'ipv6' | 'numeric-ip';

export interface ParsedUrl {
  /** The URL text as it appeared (trimmed, trailing punctuation removed). */
  raw: string;
  scheme: string | null;
  userinfo: string | null;
  host: string;
  hostKind: HostKind;
  port: string | null;
  path: string;
  query: string;
  /** [start, end) offsets inside `raw`. */
  offsets: {
    scheme: [number, number] | null;
    userinfo: [number, number] | null;
    host: [number, number];
    path: [number, number];
    query: [number, number];
  };
  labels: string[];
  /** Labels with any Punycode ("xn--") decoded to real characters. */
  decodedLabels: string[];
  tld: string;
  /** e.g. "sbi.co.in" for "www.sbi.co.in". Empty for IP hosts. */
  registrable: string;
  /** Everything left of the registrable domain, e.g. "www". */
  subdomain: string;
  hasPunycode: boolean;
  hasNonAscii: boolean;
}

export type ParseOutcome =
  | { ok: true; url: ParsedUrl }
  | { ok: true; special: string; raw: string }
  | { ok: false; reason: 'empty' | 'spaces' | 'bad_host' | 'bad_chars' | 'bad_port' };

/** Schemes that run code, install apps or open files rather than web pages. */
const UNSAFE_SCHEMES = new Set(['javascript', 'data', 'vbscript', 'file', 'intent', 'blob']);

const INVALID_HOST_CHARS = /[\s<>"'`\\^{}|%!$&*()=+,;:@[\]_~#?/]/;
const TRAILING_PUNCT = '.,;:!?)]}>\'"।॥…';

export function trimTrailingPunctuation(s: string): string {
  let end = s.length;
  while (end > 0 && TRAILING_PUNCT.includes(s[end - 1])) end--;
  return s.slice(0, end);
}

function isAllDigits(s: string): boolean {
  return s.length > 0 && /^[0-9]+$/.test(s);
}

function parseIpv4(host: string): 'ok' | 'bad' | null {
  if (!/^[0-9.]+$/.test(host)) return null;
  const parts = host.split('.');
  if (parts.length !== 4) return null;
  for (const p of parts) {
    if (!isAllDigits(p) || p.length > 3 || Number(p) > 255) return 'bad';
  }
  return 'ok';
}

export function parseUrl(input: string): ParseOutcome {
  const s = input.trim();
  if (s.length === 0) return { ok: false, reason: 'empty' };
  if (/\s/.test(s)) return { ok: false, reason: 'spaces' };
  // Control characters have no place in a link.
  if (/[\u0000-\u001f\u007f]/.test(s)) return { ok: false, reason: 'bad_chars' };

  let pos = 0;
  let scheme: string | null = null;
  let schemeRange: [number, number] | null = null;

  const m = /^([a-z][a-z0-9+.-]*):/i.exec(s);
  if (m) {
    const name = m[1].toLowerCase();
    const afterColon = s.slice(m[0].length);
    if (afterColon.startsWith('//')) {
      scheme = name;
      schemeRange = [0, m[1].length];
      pos = m[0].length + 2;
    } else if (UNSAFE_SCHEMES.has(name)) {
      return { ok: true, special: name, raw: s };
    } else if (/^[0-9]+(?:[/?#]|$)/.test(afterColon)) {
      // "example.com:8080/x" is host:port, not a scheme.
    } else if (name === 'http' || name === 'https') {
      return { ok: false, reason: 'bad_host' };
    } else {
      return { ok: true, special: name, raw: s };
    }
  }

  // Authority ends at the first "/", "?" or "#".
  let authEnd = s.length;
  for (let i = pos; i < s.length; i++) {
    const c = s[i];
    if (c === '/' || c === '?' || c === '#') {
      authEnd = i;
      break;
    }
  }
  const authority = s.slice(pos, authEnd);
  if (authority.length === 0) return { ok: false, reason: 'bad_host' };

  let userinfo: string | null = null;
  let userinfoRange: [number, number] | null = null;
  let hostPortStart = pos;
  const at = authority.lastIndexOf('@');
  if (at >= 0) {
    userinfo = authority.slice(0, at);
    userinfoRange = [pos, pos + at];
    hostPortStart = pos + at + 1;
  }
  const hostPort = s.slice(hostPortStart, authEnd);

  let host = hostPort;
  let port: string | null = null;
  let hostKind: HostKind = 'domain';
  let hostStart = hostPortStart;

  if (hostPort.startsWith('[')) {
    const close = hostPort.indexOf(']');
    if (close < 0) return { ok: false, reason: 'bad_host' };
    host = hostPort.slice(1, close);
    hostStart = hostPortStart + 1;
    const rest = hostPort.slice(close + 1);
    if (rest.startsWith(':')) port = rest.slice(1);
    else if (rest.length > 0) return { ok: false, reason: 'bad_host' };
    hostKind = 'ipv6';
    if (!/^[0-9a-f:.]+$/i.test(host) || !host.includes(':')) {
      return { ok: false, reason: 'bad_host' };
    }
  } else {
    const colon = hostPort.lastIndexOf(':');
    if (colon >= 0) {
      host = hostPort.slice(0, colon);
      port = hostPort.slice(colon + 1);
    }
  }

  if (port !== null && (!isAllDigits(port) || Number(port) > 65535)) {
    return { ok: false, reason: 'bad_port' };
  }

  const hostEnd = hostStart + host.length;
  host = host.toLowerCase();
  if (hostKind !== 'ipv6' && host.endsWith('.')) host = host.slice(0, -1);
  if (host.length === 0) return { ok: false, reason: 'bad_host' };

  // Path and query.
  let path = '';
  let query = '';
  let pathStart = authEnd;
  let pathEnd = authEnd;
  let queryStart = authEnd;
  let queryEnd = authEnd;
  if (authEnd < s.length) {
    const hashAt = s.indexOf('#', authEnd);
    const stop = hashAt >= 0 ? hashAt : s.length;
    const qAt = s.indexOf('?', authEnd);
    if (qAt >= 0 && qAt < stop) {
      pathEnd = qAt;
      path = s.slice(authEnd, qAt);
      queryStart = qAt + 1;
      queryEnd = stop;
      query = s.slice(qAt + 1, stop);
    } else {
      pathEnd = stop;
      path = s.slice(authEnd, stop);
      queryStart = queryEnd = stop;
    }
  }

  const offsets = {
    scheme: schemeRange,
    userinfo: userinfoRange,
    host: [hostStart, hostEnd] as [number, number],
    path: [pathStart, pathEnd] as [number, number],
    query: [queryStart, queryEnd] as [number, number],
  };

  const base = {
    raw: s,
    scheme,
    userinfo,
    port,
    path,
    query,
    offsets,
  };

  if (hostKind === 'ipv6') {
    return {
      ok: true,
      url: {
        ...base,
        host,
        hostKind,
        labels: [],
        decodedLabels: [],
        tld: '',
        registrable: '',
        subdomain: '',
        hasPunycode: false,
        hasNonAscii: false,
      },
    };
  }

  // Dotted IPv4, then decimal / hex "numeric" hosts that hide an IP address.
  const v4 = parseIpv4(host);
  if (v4 === 'bad') return { ok: false, reason: 'bad_host' };
  if (v4 === 'ok' || /^[0-9]{7,10}$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
    return {
      ok: true,
      url: {
        ...base,
        host,
        hostKind: v4 === 'ok' ? 'ipv4' : 'numeric-ip',
        labels: [],
        decodedLabels: [],
        tld: '',
        registrable: '',
        subdomain: '',
        hasPunycode: false,
        hasNonAscii: false,
      },
    };
  }

  if (INVALID_HOST_CHARS.test(host)) return { ok: false, reason: 'bad_chars' };
  const labels = host.split('.');
  if (labels.length < 2) return { ok: false, reason: 'bad_host' };
  for (const l of labels) {
    if (l.length === 0 || l.length > 63) return { ok: false, reason: 'bad_host' };
    if (l.startsWith('-') || l.endsWith('-')) return { ok: false, reason: 'bad_host' };
  }
  const tld = labels[labels.length - 1];
  if (!(/^[a-z]{2,24}$/.test(tld) || /^xn--[a-z0-9-]{2,}$/.test(tld) || /^[^\x00-\x7f]{2,}$/.test(tld))) {
    return { ok: false, reason: 'bad_host' };
  }

  const decodedLabels = labels.map((l) =>
    l.startsWith('xn--') ? (decodePunycodeLabel(l) ?? l) : l,
  );
  const hasPunycode = labels.some((l) => l.startsWith('xn--'));
  const hasNonAscii = labels.some((l) => /[^\u0000-\u007f]/.test(l));

  const lastTwo = labels.slice(-2).join('.');
  const regCount = MULTIPART_SUFFIXES.has(lastTwo) && labels.length >= 3 ? 3 : 2;
  const registrable = labels.slice(-regCount).join('.');
  const subdomain = labels.slice(0, -regCount).join('.');

  return {
    ok: true,
    url: {
      ...base,
      host,
      hostKind: 'domain',
      labels,
      decodedLabels,
      tld,
      registrable,
      subdomain,
      hasPunycode,
      hasNonAscii,
    },
  };
}

export interface ExtractedUrl {
  raw: string;
  /** Offsets into the ORIGINAL message. */
  start: number;
  end: number;
}

const SCHEME_OR_WWW = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const BARE_DOMAIN = /^(?:[a-z0-9-]+\.)+([a-z]{2,24})(?::[0-9]{1,5})?(?:[/?#].*)?$/i;

/**
 * Find links inside a message. Bare domains such as "sbi-kyc.xyz/login" are
 * included only when the ending is a well-known top-level domain, so words
 * like "e.g." or "report.pdf" are not mistaken for websites.
 */
export function extractUrls(text: string): ExtractedUrl[] {
  const found: ExtractedUrl[] = [];
  SCHEME_OR_WWW.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SCHEME_OR_WWW.exec(text)) !== null) {
    const raw = trimTrailingPunctuation(m[0]);
    if (raw.length === 0) continue;
    found.push({ raw, start: m.index, end: m.index + raw.length });
  }

  const token = /[^\s]+/g;
  while ((m = token.exec(text)) !== null) {
    const tStart = m.index;
    const tEnd = tStart + m[0].length;
    if (found.some((f) => f.start < tEnd && f.end > tStart)) continue;
    let s = m[0];
    let offset = 0;
    while (s.length > 0 && '([{<"\'‘“'.includes(s[0])) {
      s = s.slice(1);
      offset++;
    }
    s = trimTrailingPunctuation(s);
    if (s.length < 4 || s.includes('@')) continue;
    const dm = BARE_DOMAIN.exec(s);
    if (!dm) continue;
    if (!BARE_DOMAIN_TLDS.has(dm[1].toLowerCase())) continue;
    found.push({ raw: s, start: tStart + offset, end: tStart + offset + s.length });
  }

  found.sort((a, b) => a.start - b.start);
  return found;
}
