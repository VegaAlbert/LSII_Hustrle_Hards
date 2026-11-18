import type { Language } from '../settings/settings';
import type { Message, PluralMessage } from './defineMessages';
import { MESSAGES, type MessageKey } from './messages';

export type TranslateParams = Record<string, string | number>;

export type TranslateFn = (key: MessageKey, params?: TranslateParams) => string;

function lookup(language: Language, key: MessageKey): Message {
  const [group, name] = key.split('.') as [keyof typeof MESSAGES, string];
  const messages = MESSAGES[group][language] as Record<string, Message>;
  return messages[name];
}

function pickPlural(language: Language, message: PluralMessage, count: number): string {
  const category = new Intl.PluralRules(language).select(count);
  if (category === 'one') return message.one;
  if (category === 'many' && message.many) return message.many;
  return message.other;
}

/**
 * Text of `key` in `language`. `{name}` placeholders are replaced by `params.name`; numbers are formatted for the
 * language (1,234 / 1.234). Plural messages choose their form with `params.count`.
 */
export function translate(language: Language, key: MessageKey, params: TranslateParams = {}): string {
  const message = lookup(language, key);
  const text = typeof message === 'string' ? message : pickPlural(language, message, Number(params.count ?? 0));
  const numberFormat = new Intl.NumberFormat(language);
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    if (value === undefined) return placeholder;
    return typeof value === 'number' ? numberFormat.format(value) : value;
  });
}
