// A hashtag is # followed by letters, digits or _ in any language, e.g. #travel or #ñandú
const HASHTAG = /#[\p{L}\p{N}_]+/gu;

export type TextPart = { kind: 'text'; value: string } | { kind: 'hashtag'; value: string };

/**
 * Hashtags of a text without the #, in order and without repeats (ignoring case).
 */
export function extractHashtags(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const match of text.matchAll(HASHTAG)) {
    const tag = match[0].slice(1);
    if (!seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      result.push(tag);
    }
  }
  return result;
}

/**
 * Splits a text into plain parts and hashtags, so the hashtags can be rendered as links.
 */
export function splitHashtags(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(HASHTAG)) {
    if (match.index > last) parts.push({ kind: 'text', value: text.slice(last, match.index) });
    parts.push({ kind: 'hashtag', value: match[0].slice(1) });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  return parts;
}

/**
 * Home page searching for a hashtag; the search looks in titles and descriptions, where hashtags are written.
 */
export function hashtagSearchUrl(tag: string): string {
  return `/?q=${encodeURIComponent(`#${tag}`)}`;
}
