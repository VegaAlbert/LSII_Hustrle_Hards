import { translate } from '../i18n/translate';
import type { Language } from '../settings/settings';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/**
 * Formats an ISO date relative to now in a language, e.g. "3 days ago" / "hace 3 días" / "fa 3 dies". Under a minute
 * it is "just now".
 */
export function formatRelativeTime(isoDate: string, language: Language = 'en', now: Date = new Date()): string {
  const relativeFormat = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const seconds = Math.round((new Date(isoDate).getTime() - now.getTime()) / 1000);
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeFormat.format(Math.trunc(seconds / unitSeconds), unit);
    }
  }
  return translate(language, 'common.justNow');
}
