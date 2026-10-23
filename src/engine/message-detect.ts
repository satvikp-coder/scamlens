/**
 * Runs the data-driven message rules against normalized text.
 */

import { MESSAGE_RULES, NEGATION_AFTER, NEGATION_BEFORE, NEGATION_INSIDE } from './message-rules';
import { toOriginalRange, type NormalizedText } from './normalize';
import type { Evidence, Finding } from './types';

const MAX_EVIDENCE_PER_FINDING = 3;
const MAX_EVIDENCE_CHARS = 140;

function overlaps(a: Evidence, b: Evidence): boolean {
  return a.start < b.end && b.start < a.end;
}

function clip(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > MAX_EVIDENCE_CHARS ? oneLine.slice(0, MAX_EVIDENCE_CHARS - 1) + '…' : oneLine;
}

export function detectMessageFindings(norm: NormalizedText, original: string): Finding[] {
  const text = norm.text;
  const findings: Finding[] = [];

  for (const rule of MESSAGE_RULES) {
    if (rule.context && !rule.context.test(text)) continue;

    const evidence: Evidence[] = [];
    for (const pattern of rule.patterns) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        if (m[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }
        const start = m.index;
        const end = start + m[0].length;

        if (rule.negatable) {
          const before = text.slice(Math.max(0, start - 40), start);
          if (
            NEGATION_BEFORE.test(before) ||
            NEGATION_INSIDE.test(m[0]) ||
            NEGATION_AFTER.test(text.slice(end, end + 12))
          ) {
            continue;
          }
        }
        if (rule.notBefore && rule.notBefore.test(text.slice(Math.max(0, start - 40), start))) continue;
        if (rule.notAfter && rule.notAfter.test(text.slice(end, end + 30))) continue;
        if (rule.exceptionNear && rule.exceptionNear.test(text.slice(Math.max(0, start - 70), end + 70))) {
          continue;
        }

        const range = toOriginalRange(norm, start, end);
        const ev: Evidence = {
          start: range.start,
          end: range.end,
          text: clip(original.slice(range.start, range.end)),
        };
        if (!evidence.some((e) => overlaps(e, ev)) && evidence.length < MAX_EVIDENCE_PER_FINDING) {
          evidence.push(ev);
        }
      }
    }

    if (evidence.length > 0) {
      findings.push({
        id: rule.id,
        category: rule.category,
        severity: rule.strongWhen && rule.strongWhen.test(text) ? 'strong' : rule.severity,
        decisive: rule.decisive,
        evidence,
      });
    }
  }
  return findings;
}
