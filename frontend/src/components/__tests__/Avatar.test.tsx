import { render } from '@testing-library/react';
import Avatar from '../Avatar';
import { avatarHue } from '../../utils/avatarHue';

describe('Avatar', () => {
  it('shows the first letter of the name in upper case, hidden from screen readers', () => {
    const { container } = render(<Avatar name="mark Ronson" />);

    const avatar = container.firstChild as HTMLElement;
    expect(avatar).toHaveTextContent('M');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).toHaveClass('avatar-md');
  });

  it('colours the avatar from the name', () => {
    const { container } = render(<Avatar name="bob" size="sm" />);

    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.getPropertyValue('--avatar-hue')).toBe(String(avatarHue('bob')));
    expect(avatar).toHaveClass('avatar-sm');
  });

  it('shows a question mark for an empty name', () => {
    const { container } = render(<Avatar name="  " />);

    expect(container.firstChild).toHaveTextContent('?');
  });
});

describe('avatarHue', () => {
  it('always gives the same hue for the same name', () => {
    expect(avatarHue('alice')).toBe(avatarHue('alice'));
  });

  it('gives different hues to different names', () => {
    expect(avatarHue('alice')).not.toBe(avatarHue('bob'));
  });

  it('stays between 0 and 359', () => {
    for (const name of ['a', 'Zoë', 'ภัณฑิรา', 'a very long channel name with spaces']) {
      expect(avatarHue(name)).toBeGreaterThanOrEqual(0);
      expect(avatarHue(name)).toBeLessThan(360);
    }
  });
});
