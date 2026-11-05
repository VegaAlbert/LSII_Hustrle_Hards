import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareDialog from '../ShareDialog';

const url = 'http://localhost/videos/5';

describe('ShareDialog', () => {
  it('offers to start the video where the viewer stopped it', async () => {
    const user = userEvent.setup();
    render(<ShareDialog url={url} title="Trip" currentTime={83.6} onClose={jest.fn()} />);

    expect(screen.getByLabelText('Video link')).toHaveValue(url);
    await user.click(screen.getByLabelText('Start at 1:23'));

    expect(screen.getByLabelText('Video link')).toHaveValue(`${url}?t=83`);
    expect(screen.getByRole('link', { name: 'Share on Email' })).toHaveAttribute(
      'href',
      `mailto:?subject=Trip&body=${encodeURIComponent(`${url}?t=83`)}`
    );
  });

  it('has no start time option at the beginning of the video', () => {
    render(<ShareDialog url={url} title="Trip" currentTime={0} onClose={jest.fn()} />);

    expect(screen.queryByLabelText(/Start at/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('closes with the close button or by clicking outside', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { container } = render(<ShareDialog url={url} title="Trip" currentTime={0} onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(container.querySelector('.share-backdrop') as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps the Copy button when the clipboard is not available', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    render(<ShareDialog url={url} title="Trip" currentTime={0} onClose={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });
});
