import type { Language } from '../settings/settings';

/**
 * A text that changes with a number, e.g. "1 view" / "2 views". `one` and `other` are the plural categories of
 * Intl.PluralRules for English, Spanish and Catalan; `many` is optional (Spanish uses it for millions).
 */
export type PluralMessage = { one: string; other: string; many?: string };

export type Message = string | PluralMessage;

/**
 * Same keys as the English messages, each with the same kind of value (plain text or plural forms).
 */
export type TranslationOf<T extends Record<string, Message>> = {
  [K in keyof T]: T[K] extends string ? string : PluralMessage;
};

export type MessageGroup<T extends Record<string, Message>> = Record<Language, TranslationOf<T>>;

/**
 * Declares the texts of one area of the app in every language. English is the source: TypeScript fails the build
 * when Spanish or Catalan miss a key, add an unknown one or use a plain text where English has plural forms.
 */
export function defineMessages<T extends Record<string, Message>>(
  en: T,
  translations: Record<Exclude<Language, 'en'>, TranslationOf<T>>
): MessageGroup<T> {
  return { en: en as TranslationOf<T>, ...translations };
}
