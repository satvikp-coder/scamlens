import type { IconName } from '@/components/icon';

/** Text for each lesson lives in the language files under "lesson.<id>.*". */
export const LESSONS: { id: LessonId; icon: IconName }[] = [
  { id: 'parcel', icon: 'cube-outline' },
  { id: 'upi', icon: 'swap-horizontal-outline' },
  { id: 'qr', icon: 'qr-code-outline' },
  { id: 'otp', icon: 'keypad-outline' },
  { id: 'job', icon: 'briefcase-outline' },
  { id: 'bank_gov', icon: 'business-outline' },
  { id: 'phishing', icon: 'link-outline' },
  { id: 'remote', icon: 'desktop-outline' },
  { id: 'support', icon: 'call-outline' },
  { id: 'urgency', icon: 'timer-outline' },
];

export type LessonId =
  | 'parcel'
  | 'upi'
  | 'qr'
  | 'otp'
  | 'job'
  | 'bank_gov'
  | 'phishing'
  | 'remote'
  | 'support'
  | 'urgency';

export function isLessonId(id: unknown): id is LessonId {
  return typeof id === 'string' && LESSONS.some((l) => l.id === id);
}

/** Lessons shown on the home screen. */
export const HOME_LESSONS: LessonId[] = ['parcel', 'otp', 'upi'];

/** Practice scenarios: text and explanation are in the language files. */
export const PRACTICE: { id: string; isScam: boolean }[] = [
  { id: 'p1', isScam: true },
  { id: 'p2', isScam: false },
  { id: 'p3', isScam: true },
  { id: 'p4', isScam: false },
  { id: 'p5', isScam: true },
  { id: 'p6', isScam: true },
  { id: 'p7', isScam: false },
  { id: 'p8', isScam: true },
];
