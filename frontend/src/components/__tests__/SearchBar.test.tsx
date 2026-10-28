import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';
import { fetchVideos, type Page, type VideoSummary } from '../../videos/videosApi';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  fetchVideos: jest.fn(),
}));
const mockedFetchVideos = fetchVideos as jest.MockedFunction<typeof fetchVideos>;

const video = (id: number, title: string): VideoSummary => ({
  id,
  title,
  author: 'Author',
  durationSeconds: 60,
  thumbnailUrl: `/media/${id}.webp`,
});

const results = (content: VideoSummary[]): Page<VideoSummary> => ({
  content,
  page: 0,
  size: 5,
  totalElements: content.length,
  totalPages: content.length > 0 ? 1 : 0,
});

describe('SearchBar', () => {
  const onSearch = jest.fn();

  beforeEach(() => {
    onSearch.mockReset();
    mockedFetchVideos.mockReset();
    mockedFetchVideos.mockResolvedValue(results([]));
  });

  it('sends the trimmed text when the Search button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('combobox', { name: 'Search videos' }), '  city walls  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('city walls');
  });

  it('sends the text when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'music{Enter}');

    expect(onSearch).toHaveBeenCalledWith('music');
  });

  it('sends an empty text for an empty search instead of failing', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('combobox', { name: 'Search videos' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('starts with the initial query and without suggestions', () => {
    render(<SearchBar initialQuery="cats" onSearch={onSearch} />);

    expect(screen.getByRole('combobox', { name: 'Search videos' })).toHaveValue('cats');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(mockedFetchVideos).not.toHaveBeenCalled();
  });

  describe('suggestions', () => {
    beforeEach(() => {
      mockedFetchVideos.mockResolvedValue(results([video(1, 'Cats compilation'), video(2, 'Funny cats')]));
    });

    it('shows the most relevant titles while typing, with one request when the user stops', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats');

      const list = await screen.findByRole('listbox', { name: 'Suggestions' });
      expect(list.children).toHaveLength(2);
      expect(screen.getByRole('option', { name: 'Cats compilation' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Search videos' })).toHaveAttribute('aria-expanded', 'true');
      expect(mockedFetchVideos).toHaveBeenCalledTimes(1);
      expect(mockedFetchVideos).toHaveBeenCalledWith(0, 5, 'cats');
    });

    it('searches the clicked suggestion', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats');
      await user.click(await screen.findByRole('option', { name: 'Funny cats' }));

      expect(onSearch).toHaveBeenCalledWith('Funny cats');
      expect(screen.getByRole('combobox', { name: 'Search videos' })).toHaveValue('Funny cats');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('moves with the arrow keys and searches the highlighted suggestion with Enter', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats');
      await screen.findByRole('listbox');
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');

      expect(screen.getByRole('option', { name: 'Cats compilation' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('option', { name: 'Funny cats' })).toHaveAttribute('aria-selected', 'false');

      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('Cats compilation');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('goes from the first suggestion to the last one with the up arrow', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats');
      await screen.findByRole('listbox');
      await user.keyboard('{ArrowUp}');

      expect(screen.getByRole('option', { name: 'Funny cats' })).toHaveAttribute('aria-selected', 'true');
    });

    it('closes the list with Escape', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats');
      await screen.findByRole('listbox');
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onSearch).not.toHaveBeenCalled();
    });

    it('keeps the typed text when Escape closes the list', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);
      const box = screen.getByRole('combobox', { name: 'Search videos' });

      await user.type(box, 'cats');
      await screen.findByRole('listbox');
      // Real browsers clear a search input on Escape, jsdom does not: fireEvent returns false when the component
      // cancels that default action
      const notCancelled = fireEvent.keyDown(box, { key: 'Escape' });

      expect(notCancelled).toBe(false);
      expect(box).toHaveValue('cats');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes the list when the search box loses the focus', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats');
      await screen.findByRole('listbox');
      await user.tab();

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows no list when the suggestions cannot be loaded', async () => {
      const user = userEvent.setup();
      mockedFetchVideos.mockRejectedValue(new Error('Network Error'));
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'cats{Enter}');

      expect(onSearch).toHaveBeenCalledWith('cats');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
