/**
 * Turns a list of findings into an overall assessment.
 *
 * The numbers here are an internal ordering aid chosen by hand. They are NOT
 * probabilities and have not been calibrated against real-world data, so the
 * app never shows the score to the user.
 */

import type {
  ActionId,
  AnalysisResult,
  Category,
  Finding,
  InputKind,
  LimitationId,
  RiskLevel,
  Severity,
} from './types';

const POINTS: Record<Severity, number> = { weak: 1, moderate: 2, strong: 4 };
const RANK: Record<Severity, number> = { weak: 1, moderate: 2, strong: 3 };

/** Highest severity found in each category (requirement: no double counting). */
function strongestPerCategory(findings: Finding[]): Map<Category, Severity> {
  const best = new Map<Category, Severity>();
  for (const f of findings) {
    const current = best.get(f.category);
    if (!current || RANK[f.severity] > RANK[current]) best.set(f.category, f.severity);
  }
  return best;
}

export function scoreFindings(findings: Finding[]): number {
  const best = strongestPerCategory(findings);
  let score = 0;
  for (const sev of best.values()) score += POINTS[sev];

  // Pressure on its own is common in honest messages. Pressure combined with
  // a request for money, secrets, a click or an install is the scam pattern.
  const has = (c: Category) => best.has(c);
  const pressured = has('urgency');
  const actionRequested = has('credentials') || has('payment') || has('link') || has('remote-access');
  if (pressured && actionRequested) score += 2;
  if (has('impersonation') && actionRequested) score += 2;
  return score;
}

export function levelFor(findings: Finding[], score: number, kind: InputKind): RiskLevel {
  if (findings.some((f) => f.decisive)) return 'high';
  if (score >= 6) return 'high';
  if (score >= 3) return 'caution';
  // For a bare link, any structural oddity of moderate weight or more is
  // worth a pause: it is all we have to go on.
  if (kind === 'url' && findings.some((f) => f.severity !== 'weak')) return 'caution';
  return 'low';
}

export function actionsFor(level: RiskLevel, findings: Finding[], hasLinks: boolean): ActionId[] {
  const cats = new Set(findings.map((f) => f.category));
  const ids = new Set(findings.map((f) => f.id));
  const actions: ActionId[] = [];

  if (level === 'unable') {
    return ['verify_official', 'wait_and_check'];
  }
  if (level === 'low') {
    return hasLinks ? ['verify_official', 'stay_alert'] : ['stay_alert'];
  }

  if (cats.has('link') || hasLinks) actions.push('dont_click');
  if (cats.has('credentials') || level === 'high') actions.push('dont_share');
  if (cats.has('payment') || cats.has('job') || cats.has('reward')) actions.push('dont_pay');
  if (cats.has('remote-access') || ids.has('url.apk')) actions.push('dont_install');
  actions.push('verify_official');
  if (level === 'high') {
    actions.push('report', 'already_acted');
  }
  return actions;
}

export function limitationsFor(
  kind: InputKind,
  level: RiskLevel,
  hasLinks: boolean,
  truncated: boolean,
): LimitationId[] {
  const out: LimitationId[] = ['heuristic'];
  if (hasLinks) out.push('offline_url');
  if (level === 'low') out.push('not_proof_of_safety');
  if (kind === 'message') out.push('language_coverage');
  if (truncated) out.push('truncated');
  return out;
}

export function buildResult(args: {
  kind: InputKind;
  findings: Finding[];
  notes: AnalysisResult['notes'];
  hosts: string[];
  truncated: boolean;
  forcedLevel?: RiskLevel;
  unableReason?: AnalysisResult['unableReason'];
}): AnalysisResult {
  const { kind, findings, notes, hosts, truncated, unableReason } = args;
  const score = scoreFindings(findings);
  const level = args.forcedLevel ?? levelFor(findings, score, kind);
  const hasLinks = hosts.length > 0;
  return {
    kind,
    level,
    score,
    findings: sortFindings(findings),
    notes,
    actions: actionsFor(level, findings, hasLinks),
    limitations: limitationsFor(kind, level, hasLinks, truncated),
    unableReason,
    hosts,
    truncated,
  };
}

/** Strongest first, so the most important evidence is shown at the top. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    if (a.decisive !== b.decisive) return a.decisive ? -1 : 1;
    return RANK[b.severity] - RANK[a.severity];
  });
}
