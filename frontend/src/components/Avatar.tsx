import type { CSSProperties } from 'react';
import { avatarHue } from '../utils/avatarHue';

type Props = {
  name: string;
  size?: 'sm' | 'md';
};

/**
 * Round badge with the first letter of a user or channel name, coloured from the name. Decorative: the name is
 * always shown next to it.
 */
const Avatar = ({ name, size = 'md' }: Props) => {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?';
  const style = { '--avatar-hue': avatarHue(name) } as CSSProperties;

  return (
    <span className={`avatar avatar-${size}`} style={style} aria-hidden="true">
      {initial}
    </span>
  );
};

export default Avatar;
