import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpandableText from '../ExpandableText';

describe('ExpandableText', () => {
  it('shows a short text without a toggle', () => {
    render(<ExpandableText text="Short description" />);

    expect(screen.getByText('Short description')).not.toHaveClass('is-collapsed');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('collapses a long text and expands it on demand', async () => {
    const user = userEvent.setup();
    render(<ExpandableText text={'a'.repeat(300)} />);

    const text = screen.getByText('a'.repeat(300));
    const toggle = screen.getByRole('button', { name: 'Show more' });
    expect(text).toHaveClass('is-collapsed');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', text.id);

    await user.click(toggle);
    expect(text).not.toHaveClass('is-collapsed');
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(text).toHaveClass('is-collapsed');
  });

  it('treats a text with many lines as long', () => {
    render(<ExpandableText text={'line\nline\nline\nline\nline'} />);

    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });
});
