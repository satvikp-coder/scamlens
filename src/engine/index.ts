/**
 * Public entry points of the ScamLens detection engine.
 *
 * Pure functions: text in, structured result out. No network access, no
 * storage, no logging of the input.
 */

import { buildResult } from './assess';
import { detectMessageFindings } from './message-detect';
import { countLetters, normalizeText } from './normalize';
import {
  MAX_MESSAGE_CHARS,
  MAX_URL_CHARS,
  type AnalysisResult,
  type Evidence,
  type Finding,
  type Note,
} from './types';
import { extractUrls, parseUrl } from './url-parse';
import { checkUrl } from './url-rules';

export * from './types';
export { extractUrls, parseUrl } from './url-parse';

/** Merge findings that share an id (e.g. the same sign in two different links). */
function mergeFindings(list: Finding[]): Finding[] {
  const byId = new Map<string, Finding>();
  for (const f of list) {
    const existing = byId.get(f.id);
    if (!existing) {
      byId.set(f.id, { ...f, evidence: [...f.evidence] });
    } else {
      for (const e of f.evidence) {
        if (existing.evidence.length < 3 && !existing.evidence.some((x: Evidence) => x.start === e.start)) {
          existing.evidence.push(e);
        }
      }
    }
  }
  return [...byId.values()];
}

function uniqueNotes(notes: Note[]): Note[] {
  const seen = new Set<string>();
  return notes.filter((n) => {
    const key = n.id + JSON.stringify(n.params ?? {});
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function analyzeMessage(input: string): AnalysisResult {
  const truncated = input.length > MAX_MESSAGE_CHARS;
  const text = truncated ? input.slice(0, MAX_MESSAGE_CHARS) : input;

  if (text.trim().length === 0) {
    return buildResult({
      kind: 'message',
      findings: [],
      notes: [],
      hosts: [],
      truncated,
      forcedLevel: 'unable',
      unableReason: 'empty',
    });
  }

  const norm = normalizeText(text);
  const findings: Finding[] = detectMessageFindings(norm, text);
  const notes: Note[] = [];
  const hosts: string[] = [];

  for (const found of extractUrls(text)) {
    const parsed = parseUrl(found.raw);
    if (parsed.ok && 'url' in parsed) {
      const result = checkUrl(parsed.url, found.start);
      findings.push(...result.findings);
      notes.push(...result.notes);
      hosts.push(parsed.url.host);
    } else if (parsed.ok && 'special' in parsed) {
      // Cannot happen from extractUrls today, but keep the engine total.
      continue;
    } else {
      findings.push({
        id: 'url.malformed',
        category: 'link',
        severity: 'weak',
        decisive: false,
        evidence: [{ start: found.start, end: found.end, text: found.raw.slice(0, 140) }],
      });
    }
  }

  const merged = mergeFindings(findings);
  const hasLinks = hosts.length > 0;
  const letters = countLetters(text);
  const tooShort = !hasLinks && merged.length === 0 && (letters < 8 || text.trim().split(/\s+/).length < 3);

  return buildResult({
    kind: 'message',
    findings: merged,
    notes: uniqueNotes(notes),
    hosts: [...new Set(hosts)],
    truncated,
    forcedLevel: tooShort ? 'unable' : undefined,
    unableReason: tooShort ? 'too_short' : undefined,
  });
}

export function analyzeUrl(input: string): AnalysisResult {
  const truncated = input.length > MAX_URL_CHARS;
  const text = (truncated ? input.slice(0, MAX_URL_CHARS) : input).trim();
  const offset = (truncated ? input.slice(0, MAX_URL_CHARS) : input).indexOf(text);

  if (text.length === 0) {
    return buildResult({
      kind: 'url',
      findings: [],
      notes: [],
      hosts: [],
      truncated,
      forcedLevel: 'unable',
      unableReason: 'empty',
    });
  }

  const parsed = parseUrl(text);

  if (!parsed.ok) {
    return buildResult({
      kind: 'url',
      findings: [
        {
          id: 'url.malformed',
          category: 'link',
          severity: 'moderate',
          decisive: false,
          evidence: [{ start: offset, end: offset + Math.min(text.length, 140), text: text.slice(0, 140) }],
          params: { reason: parsed.reason },
        },
      ],
      notes: [],
      hosts: [],
      truncated,
      forcedLevel: 'unable',
      unableReason: 'malformed_url',
    });
  }

  if ('special' in parsed) {
    return buildResult({
      kind: 'url',
      findings: [
        {
          id: 'url.unsafe_scheme',
          category: 'link',
          severity: 'strong',
          decisive: true,
          evidence: [{ start: offset, end: offset + Math.min(parsed.raw.length, 140), text: parsed.raw.slice(0, 140) }],
          params: { scheme: parsed.special },
        },
      ],
      notes: [],
      hosts: [],
      truncated,
    });
  }

  const result = checkUrl(parsed.url, offset);
  return buildResult({
    kind: 'url',
    findings: mergeFindings(result.findings),
    notes: uniqueNotes(result.notes),
    hosts: [parsed.url.host],
    truncated,
  });
}
