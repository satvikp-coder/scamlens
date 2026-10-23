/**
 * Turns the engine's structured result into translated text.
 * The engine knows nothing about languages; this is the only place that maps
 * stable ids (like "credentials.otp") to the translated sentences.
 */
import type { ActionId, AnalysisResult, Finding, LimitationId, Note, Severity } from '@/engine';
import type { MessageKey, Params } from '@/i18n';

export type T = (key: MessageKey, params?: Params) => string;

export function describeFinding(t: T, f: Finding): { title: string; why: string } {
  const params = f.params as Params | undefined;
  return {
    title: t(`finding.${f.id}.title` as MessageKey, params),
    why: t(`finding.${f.id}.why` as MessageKey, params),
  };
}

export function describeNote(t: T, n: Note): { title: string; why: string } {
  const params = n.params as Params | undefined;
  return {
    title: t(`note.${n.id}.title` as MessageKey, params),
    why: t(`note.${n.id}.why` as MessageKey, params),
  };
}

export const describeAction = (t: T, id: ActionId) => t(`action.${id}` as MessageKey);
export const describeLimitation = (t: T, id: LimitationId) => t(`limit.${id}` as MessageKey);
export const severityLabel = (t: T, s: Severity) => t(`result.severity.${s}` as MessageKey);

export function summaryText(t: T, result: AnalysisResult): string {
  if (result.level === 'unable') {
    const reason = result.unableReason ?? 'too_short';
    let text = t(`result.unable.${reason}` as MessageKey);
    if (reason === 'malformed_url') {
      const why = result.findings[0]?.params?.reason;
      if (why) text += ' ' + t(`result.malformed.${why}` as MessageKey);
    }
    return text;
  }
  return t(`result.summary.${result.level}` as MessageKey);
}

/**
 * Text for Copy / Share. It contains the level, the summary and the NAMES of
 * the warning signs only. It never includes the user's original message.
 */
export function shareSummary(t: T, result: AnalysisResult): string {
  const lines: string[] = [];
  lines.push(`${t('result.share.header')}: ${t(`result.level.${result.level}` as MessageKey)}`);
  lines.push(summaryText(t, result));
  if (result.findings.length > 0) {
    lines.push('', t('result.share.signs'));
    for (const f of result.findings) lines.push(`- ${describeFinding(t, f).title}`);
  }
  lines.push('', t('result.share.private'), t('result.share.footer'));
  return lines.join('\n');
}
