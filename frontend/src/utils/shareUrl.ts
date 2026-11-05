/**
 * Builds the link of a video starting at `seconds` (?t=90), as YouTube does. 0 means from the start.
 */
export function shareUrl(url: string, seconds: number): string {
  return seconds > 0 ? `${url}?t=${Math.floor(seconds)}` : url;
}
