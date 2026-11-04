/**
 * Hue (0-359) derived from a name, so the same user always gets the same avatar colour.
 */
export function avatarHue(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)!) % 360;
  }
  return hash;
}
