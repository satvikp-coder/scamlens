/**
 * Shared types for the ScamLens detection engine.
 *
 * The engine never produces display text. It returns structured data (stable
 * ids, severities, evidence offsets and small parameters) and the UI turns
 * that into the selected language. See docs/DETECTION_ENGINE.md.
 */

export type RiskLevel = 'low' | 'caution' | 'high' | 'unable';

/** How strongly one indicator points at fraud on its own. */
export type Severity = 'weak' | 'moderate' | 'strong';

/**
 * Indicators in the same category are counted once (the strongest wins), so
 * the same underlying warning cannot inflate the result.
 */
export type Category =
  | 'urgency'
  | 'credentials'
  | 'payment'
  | 'reward'
  | 'job'
  | 'impersonation'
  | 'remote-access'
  | 'off-platform'
  | 'link';

export const MESSAGE_FINDING_IDS = [
  'urgency.pressure',
  'urgency.threat',
  'credentials.otp',
  'credentials.pin_password',
  'credentials.card',
  'payment.fee',
  'payment.upi_trick',
  'reward.prize',
  'job.upfront_fee',
  'job.easy_income',
  'impersonation.authority',
  'remote.app',
  'offplatform.contact',
] as const;
export type MessageFindingId = (typeof MESSAGE_FINDING_IDS)[number];

export const URL_FINDING_IDS = [
  'url.malformed',
  'url.unsafe_scheme',
  'url.not_https',
  'url.ip_host',
  'url.userinfo',
  'url.lookalike_brand',
  'url.brand_in_subdomain',
  'url.domain_in_subdomain',
  'url.typosquat',
  'url.punycode',
  'url.mixed_script',
  'url.idn_lookalike',
  'url.shortener',
  'url.apk',
  'url.gov_lookalike',
  'url.many_subdomains',
  'url.many_hyphens',
  'url.very_long',
  'url.many_params',
  'url.sensitive_param',
  'url.risky_tld',
  'url.nonstandard_port',
  'url.brand_in_path',
] as const;
export type UrlFindingId = (typeof URL_FINDING_IDS)[number];

export type FindingId = MessageFindingId | UrlFindingId;

/** A piece of the user's own input that triggered a finding. */
export interface Evidence {
  /** Offsets into the ORIGINAL input string (not the normalized copy). */
  start: number;
  end: number;
  text: string;
}

export interface Finding {
  id: FindingId;
  category: Category;
  severity: Severity;
  /**
   * A decisive finding is one that almost never has an innocent explanation
   * (for example asking you to share an OTP). One decisive finding is enough
   * for a "high" assessment.
   */
  decisive: boolean;
  evidence: Evidence[];
  /** Small values the UI can insert into a translated sentence. */
  params?: Record<string, string>;
}

export type NoteId = 'official_domain_match';

/** Neutral observations that are not warnings. */
export interface Note {
  id: NoteId;
  params?: Record<string, string>;
}

export type ActionId =
  | 'dont_click'
  | 'dont_share'
  | 'dont_pay'
  | 'dont_install'
  | 'verify_official'
  | 'report'
  | 'already_acted'
  | 'wait_and_check'
  | 'stay_alert';

export type LimitationId =
  | 'heuristic'
  | 'offline_url'
  | 'not_proof_of_safety'
  | 'language_coverage'
  | 'truncated';

export type InputKind = 'message' | 'url';

export type UnableReason = 'too_short' | 'malformed_url' | 'empty';

export interface AnalysisResult {
  kind: InputKind;
  level: RiskLevel;
  /**
   * Internal ordering value used only to decide the level. It is NOT a
   * probability and must never be shown to users as a percentage.
   */
  score: number;
  findings: Finding[];
  notes: Note[];
  actions: ActionId[];
  limitations: LimitationId[];
  unableReason?: UnableReason;
  /** Hosts found in the input, for display (never fetched). */
  hosts: string[];
  /** True when the input was longer than the engine limit and was cut. */
  truncated: boolean;
}

export const MAX_MESSAGE_CHARS = 5000;
export const MAX_URL_CHARS = 2048;
