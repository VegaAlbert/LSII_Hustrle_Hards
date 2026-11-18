import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import TagInput, { MAX_TAGS } from '../TagInput';
import { I18nProvider } from '../../i18n/I18nProvider';

const Controlled = ({ initial = [] as string[], error }: { initial?: string[]; error?: string }) => {
  const [tags, setTags] = useState(initial);
  return <TagInput tags={tags} onChange={setTags} error={error} />;
};

const tagNames = () =>
  screen.queryAllByRole('button', { name: /^Remove tag/ }).map((b) => b.getAttribute('aria-label'));

describe('TagInput', () => {
  it('adds a tag with Enter or a comma, without # and extra spaces', async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.type(screen.getByLabelText('Tags'), '#travel{Enter}road   trip,');

    expect(tagNames()).toEqual(['Remove tag travel', 'Remove tag road trip']);
    expect(screen.getByLabelText('Tags')).toHaveValue('');
    expect(screen.getByText(`2/${MAX_TAGS}`)).toBeInTheDocument();
  });

  it('adds every tag of a pasted list separated by commas', async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.click(screen.getByLabelText('Tags'));
    await user.paste('Road trip,Costa Brava, beach,  sea');

    expect(tagNames()).toEqual(['Remove tag Road trip', 'Remove tag Costa Brava', 'Remove tag beach']);
    expect(screen.getByLabelText('Tags')).toHaveValue('  sea');
  });

  it('ignores blank and repeated tags', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={['Travel']} />);

    await user.type(screen.getByLabelText('Tags'), '   {Enter}travel{Enter}');

    expect(tagNames()).toEqual(['Remove tag Travel']);
  });

  it('adds the typed tag when leaving the box', async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.type(screen.getByLabelText('Tags'), 'beach');
    await user.tab();

    expect(tagNames()).toEqual(['Remove tag beach']);
  });

  it('removes a tag with its button or the last one with Backspace', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={['a', 'b', 'c']} />);

    await user.click(screen.getByRole('button', { name: 'Remove tag b' }));
    await user.type(screen.getByLabelText('Tags'), '{Backspace}');

    expect(tagNames()).toEqual(['Remove tag a']);
  });

  it('stops accepting tags at the limit', () => {
    render(<Controlled initial={Array.from({ length: MAX_TAGS }, (_, i) => `tag${i}`)} />);

    expect(screen.getByLabelText('Tags')).toBeDisabled();
    expect(screen.getByLabelText('Tags')).toHaveAttribute('placeholder', 'Tag limit reached');
  });

  it('shows an error instead of the hint', () => {
    render(<Controlled error="At most 15 tags" />);

    expect(screen.getByText('At most 15 tags')).toBeInTheDocument();
  });

  describe('in another language', () => {
    afterEach(() => localStorage.clear());

    it('shows the label, hint and remove buttons in Catalan', () => {
      localStorage.setItem('protube.language', 'ca');
      render(<Controlled initial={['platja']} />, { wrapper: I18nProvider });

      expect(screen.getByLabelText('Etiquetes')).toHaveAttribute('placeholder', 'Afegeix una etiqueta i prem Retorn');
      expect(screen.getByText('Les etiquetes ajuden a trobar el teu vídeo a les cerques.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: "Treu l'etiqueta platja" })).toBeInTheDocument();
    });
  });
});
