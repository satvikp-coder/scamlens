/**
 * Input normalization.
 *
 * Scammers (and ordinary people) write the same word many ways: different
 * letter case, full-width or "mathematical bold" letters, Hindi/Gujarati
 * digits, hidden zero-width characters. We compare against a normalized copy
 * of the text but always show the user the ORIGINAL text, so we keep a map
 * from every normalized position back to the original position.
 */

export interface NormalizedText {
  /** Lower-cased, NFKC-normalized text with digits mapped to 0-9. */
  text: string;
  /** map[i] = index in the original string where normalized char i starts. */
  starts: number[];
  /** ends[i] = index in the original string just after normalized char i. */
  ends: number[];
  originalLength: number;
}

// Characters that are invisible and are only useful for hiding words.
// ZWJ/ZWNJ (U+200C/U+200D) are kept because Hindi and Gujarati use them.
const INVISIBLE = /[​⁠﻿­᠎]/;

function mapDigit(cp: number): string | null {
  // Devanagari digits U+0966..U+096F, Gujarati digits U+0AE6..U+0AEF.
  if (cp >= 0x0966 && cp <= 0x096f) return String(cp - 0x0966);
  if (cp >= 0x0ae6 && cp <= 0x0aef) return String(cp - 0x0ae6);
  return null;
}

export function normalizeText(input: string): NormalizedText {
  let text = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let i = 0;
  while (i < input.length) {
    const cp = input.codePointAt(i) as number;
    const ch = String.fromCodePoint(cp);
    const next = i + ch.length;
    i = next;
    const origStart = next - ch.length;
    if (INVISIBLE.test(ch)) continue;

    let mapped = mapDigit(cp);
    if (mapped === null) {
      // NFKC folds full-width and styled letters ("𝐎𝐓𝐏", "ＯＴＰ") to ASCII.
      // Doing it one character at a time keeps the position map simple.
      mapped = ch.normalize('NFKC').toLowerCase();
    }
    for (const unit of mapped) {
      for (let k = 0; k < unit.length; k++) {
        text += unit[k];
        starts.push(origStart);
        ends.push(next);
      }
    }
  }
  return { text, starts, ends, originalLength: input.length };
}

/** Convert a [start, end) range in normalized text to the original string. */
export function toOriginalRange(
  n: NormalizedText,
  start: number,
  end: number,
): { start: number; end: number } {
  if (n.text.length === 0) return { start: 0, end: 0 };
  const s = n.starts[Math.min(start, n.starts.length - 1)];
  const e = n.ends[Math.max(Math.min(end, n.ends.length) - 1, 0)];
  return { start: s, end: Math.max(e, s) };
}

/** Number of letters (any script) in a string. Used for "too vague" checks. */
export function countLetters(s: string): number {
  let count = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number;
    // Latin/other cased letters, or anything in the Devanagari..Malayalam
    // blocks (U+0900-U+0D7F) that is not a digit or punctuation mark.
    const cased = ch.toLowerCase() !== ch.toUpperCase();
    const indic =
      cp >= 0x0900 &&
      cp <= 0x0d7f &&
      mapDigit(cp) === null &&
      cp !== 0x0964 &&
      cp !== 0x0965;
    if (cased || indic) count++;
  }
  return count;
}
