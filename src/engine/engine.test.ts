import { analyzeMessage, analyzeUrl, extractUrls, parseUrl } from './index';
import { countLetters, normalizeText, toOriginalRange } from './normalize';
import { decodePunycodeLabel } from './punycode';
import { scoreFindings } from './assess';
import { damerauLevenshtein, foldConfusables } from './url-rules';
import { DATASET, LABEL_LEVELS, type Fixture } from './__fixtures__/dataset';
import type { Finding } from './types';

function run(f: Fixture) {
  return f.kind === 'message' ? analyzeMessage(f.text) : analyzeUrl(f.text);
}

describe('normalizeText', () => {
  it('lower-cases and keeps a map back to the original', () => {
    const n = normalizeText('Share OTP');
    expect(n.text).toBe('share otp');
    const r = toOriginalRange(n, 6, 9);
    expect('Share OTP'.slice(r.start, r.end)).toBe('OTP');
  });

  it('folds styled and full-width letters', () => {
    expect(normalizeText('𝐎𝐓𝐏').text).toBe('otp');
    expect(normalizeText('ＯＴＰ').text).toBe('otp');
  });

  it('maps Devanagari and Gujarati digits to ASCII', () => {
    expect(normalizeText('₹१२३').text).toBe('₹123');
    expect(normalizeText('૪૫૬').text).toBe('456');
  });

  it('removes zero-width characters but keeps ZWJ/ZWNJ', () => {
    expect(normalizeText('o​t​p').text).toBe('otp');
    expect(normalizeText('a‍b').text).toBe('a‍b');
  });

  it('keeps positions correct after characters are removed', () => {
    const original = 'x O​TP y';
    const n = normalizeText(original);
    const i = n.text.indexOf('otp');
    const r = toOriginalRange(n, i, i + 3);
    expect(original.slice(r.start, r.end)).toBe('O​TP');
  });

  it('handles emoji and empty input without throwing', () => {
    expect(() => normalizeText('😀😀 pay now 🔥')).not.toThrow();
    expect(normalizeText('').text).toBe('');
    expect(toOriginalRange(normalizeText(''), 0, 0)).toEqual({ start: 0, end: 0 });
  });

  it('counts letters in English, Hindi and Gujarati but not digits or punctuation', () => {
    expect(countLetters('Hi 123 !')).toBe(2);
    expect(countLetters('नमस्ते ४५')).toBeGreaterThan(3);
    expect(countLetters('૧૨૩ ।')).toBe(0);
  });
});

describe('punycode', () => {
  it('decodes a known label', () => {
    expect(decodePunycodeLabel('xn--pple-43d')).toBe('аpple');
    expect(decodePunycodeLabel('xn--mnchen-3ya')).toBe('münchen');
  });
  it('returns null for invalid input', () => {
    expect(decodePunycodeLabel('xn--***')).toBeNull();
  });
});

describe('URL extraction', () => {
  it('finds scheme, www and bare-domain links with correct offsets', () => {
    const text = 'Visit https://a-b.example.com/x?y=1, or www.test.in. Also pay at upi-help.xyz/now';
    const urls = extractUrls(text);
    expect(urls.map((u) => u.raw)).toEqual([
      'https://a-b.example.com/x?y=1',
      'www.test.in',
      'upi-help.xyz/now',
    ]);
    for (const u of urls) expect(text.slice(u.start, u.end)).toBe(u.raw);
  });

  it('does not treat abbreviations, file names or emails as links', () => {
    expect(extractUrls('e.g. see report.pdf or mail me@example.com, a.m. tomorrow')).toEqual([]);
  });

  it('strips trailing punctuation including the Hindi danda', () => {
    const urls = extractUrls('लिंक: https://example.com/a।');
    expect(urls[0].raw).toBe('https://example.com/a');
  });
});

describe('URL parsing', () => {
  const ok = (s: string) => {
    const r = parseUrl(s);
    if (!r.ok || !('url' in r)) throw new Error('expected a parsed url for ' + s);
    return r.url;
  };

  it('splits parts and finds the registrable domain', () => {
    const u = ok('https://user@login.secure.sbi.co.in:8443/a/b?x=1#top');
    expect(u.userinfo).toBe('user');
    expect(u.host).toBe('login.secure.sbi.co.in');
    expect(u.port).toBe('8443');
    expect(u.registrable).toBe('sbi.co.in');
    expect(u.subdomain).toBe('login.secure');
    expect(u.path).toBe('/a/b');
    expect(u.query).toBe('x=1');
  });

  it('handles URLs without a scheme and host:port', () => {
    expect(ok('example.com:8080/x').port).toBe('8080');
    expect(ok('www.example.com').scheme).toBeNull();
  });

  it('classifies IP hosts', () => {
    expect(ok('http://10.0.0.1/a').hostKind).toBe('ipv4');
    expect(ok('http://3232235777/a').hostKind).toBe('numeric-ip');
    expect(ok('http://[::1]/a').hostKind).toBe('ipv6');
  });

  it('reports special schemes instead of crashing', () => {
    const r = parseUrl('javascript:alert(1)');
    expect(r.ok && 'special' in r && r.special).toBe('javascript');
  });

  it.each(['', '   ', 'http://', 'http://a b.com', 'http://exa..mple.com', 'http://999.1.1.1', 'localhost', 'https://-bad.com', 'http://ex.com:99999'])(
    'rejects %p',
    (s) => {
      expect(parseUrl(s).ok).toBe(false);
    },
  );

  it('survives a very long URL', () => {
    const long = 'https://example.com/' + 'a'.repeat(100000);
    expect(() => analyzeUrl(long)).not.toThrow();
  });
});

describe('helpers', () => {
  it('computes edit distance with transpositions', () => {
    expect(damerauLevenshtein('flipkart', 'flipkrat')).toBe(1);
    expect(damerauLevenshtein('amazon', 'amazon')).toBe(0);
    expect(damerauLevenshtein('abc', 'xyz')).toBe(3);
  });
  it('folds look-alike characters', () => {
    expect(foldConfusables('paytrn')).toBe(foldConfusables('paytm'));
    expect(foldConfusables('g00gle')).toBe(foldConfusables('google'));
  });
});

describe('risk aggregation', () => {
  const f = (category: Finding['category'], severity: Finding['severity']): Finding => ({
    id: 'urgency.pressure',
    category,
    severity,
    decisive: false,
    evidence: [],
  });

  it('counts a category once, using its strongest finding', () => {
    expect(scoreFindings([f('link', 'weak'), f('link', 'moderate'), f('link', 'weak')])).toBe(2);
  });

  it('adds a bonus when pressure comes with a request for action', () => {
    expect(scoreFindings([f('urgency', 'weak'), f('payment', 'moderate')])).toBe(1 + 2 + 2);
    expect(scoreFindings([f('urgency', 'weak')])).toBe(1);
  });
});

describe('engine behaviour', () => {
  it('returns "unable" for empty input and never throws on odd input', () => {
    expect(analyzeMessage('').level).toBe('unable');
    expect(analyzeMessage('   \n  ').level).toBe('unable');
    expect(analyzeUrl('').level).toBe('unable');
    for (const s of ['😀', '\u0000\u0001', '((((((((', 'http://[', 'https://', '.'.repeat(5000), '@@@@', '\uD800']) {
      expect(() => analyzeMessage(s)).not.toThrow();
      expect(() => analyzeUrl(s)).not.toThrow();
    }
  });

  it('truncates very long messages and says so', () => {
    const r = analyzeMessage('hello there friend '.repeat(1000));
    expect(r.truncated).toBe(true);
    expect(r.limitations).toContain('truncated');
  });

  it('analyses a 5000-character message quickly', () => {
    const text = ('Urgent pay Rs 50 fee now at http://x-y.top/a share otp ' + 'lorem ipsum '.repeat(5)).repeat(60).slice(0, 5000);
    const t0 = Date.now();
    analyzeMessage(text);
    expect(Date.now() - t0).toBeLessThan(1500);
  });

  it('points evidence at the exact text in the original message', () => {
    const text = 'Dear user, URGENT! Please Share your OTP now. ';
    const r = analyzeMessage(text);
    const otp = r.findings.find((x) => x.id === 'credentials.otp');
    expect(otp).toBeDefined();
    for (const e of otp!.evidence) expect(text.slice(e.start, e.end).replace(/\s+/g, ' ')).toBe(e.text);
    expect(otp!.evidence[0].text.toLowerCase()).toContain('share your otp');
  });

  it('lists each underlying warning once', () => {
    const r = analyzeMessage('Share OTP. Share your OTP again. Please send OTP to us, share otp!');
    expect(r.findings.filter((x) => x.id === 'credentials.otp')).toHaveLength(1);
  });

  it('never mentions a score as a probability', () => {
    const r = analyzeMessage('Share your OTP now');
    expect(typeof r.score).toBe('number');
    expect(JSON.stringify(r)).not.toMatch(/probab|percent/i);
  });

  it('notes an official domain without calling it safe', () => {
    const r = analyzeUrl('https://www.sbi.co.in/');
    expect(r.notes.map((n) => n.id)).toContain('official_domain_match');
    expect(r.level).toBe('low');
    expect(r.limitations).toContain('not_proof_of_safety');
  });

  it('flags unsafe schemes', () => {
    const r = analyzeUrl('javascript:alert(1)');
    expect(r.level).toBe('high');
    expect(r.findings[0].id).toBe('url.unsafe_scheme');
  });

  it('does not flag HTTPS-only differences as proof of safety or danger', () => {
    expect(analyzeUrl('https://www.example.com/').findings).toEqual([]);
    expect(analyzeUrl('https://www.example.com/').limitations).toContain('not_proof_of_safety');
  });

  it('merges the same sign found in two links of one message', () => {
    const r = analyzeMessage('pay at http://a-b.top/x or http://c-d.top/y now please');
    expect(r.findings.filter((x) => x.id === 'url.not_https')).toHaveLength(1);
    expect(r.hosts).toEqual(['a-b.top', 'c-d.top']);
  });

  it('recommends not clicking, sharing or paying for a high-risk message', () => {
    const r = analyzeMessage('Pay Rs 49 redelivery fee at http://indiapost-pay.top and share your OTP now');
    expect(r.level).toBe('high');
    expect(r.actions).toEqual(expect.arrayContaining(['dont_click', 'dont_share', 'dont_pay', 'verify_official', 'report']));
  });
});

describe('dataset (dev + regression must all pass)', () => {
  const strict = DATASET.filter((d) => d.split !== 'heldout');
  it.each(strict.map((d) => [d.id, d] as const))('%s', (_id, fixture) => {
    const r = run(fixture);
    const allowed = fixture.expect ?? LABEL_LEVELS[fixture.label];
    expect(allowed).toContain(r.level);
    const ids = r.findings.map((x) => x.id);
    for (const id of fixture.mustInclude ?? []) expect(ids).toContain(id);
    for (const id of fixture.mustNotInclude ?? []) expect(ids).not.toContain(id);
  });
});
