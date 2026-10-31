import { act, renderHook, waitFor } from '@testing-library/react';
import { SUGGESTION_DELAY_MS, useVideoSuggestions } from '../useVideoSuggestions';
import { fetchVideos, type Page, type VideoSummary } from '../videosApi';

jest.mock('../videosApi', () => ({
  ...jest.requireActual('../videosApi'),
  fetchVideos: jest.fn(),
}));
const mockedFetchVideos = fetchVideos as jest.MockedFunction<typeof fetchVideos>;

const results = (...titles: string[]): Page<VideoSummary> => ({
  content: titles.map((title, index) => ({
    id: index + 1,
    title,
    author: null,
    durationSeconds: 60,
    publishedAt: '2023-11-14T22:13:20Z',
    thumbnailUrl: `/media/${index + 1}.webp`,
    videoUrl: `/media/${index + 1}.mp4`,
  })),
  page: 0,
  size: 5,
  totalElements: titles.length,
  totalPages: 1,
});

describe('useVideoSuggestions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedFetchVideos.mockReset();
    mockedFetchVideos.mockResolvedValue(results('Cats'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for the suggestions once the user stops typing', async () => {
    const { result } = renderHook(() => useVideoSuggestions(' cats ', true));

    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS - 1));
    expect(mockedFetchVideos).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    await waitFor(() => expect(result.current.map((video) => video.title)).toEqual(['Cats']));
    expect(mockedFetchVideos).toHaveBeenCalledWith(0, 5, 'cats');
  });

  it('asks nothing for texts shorter than two characters', () => {
    const { result } = renderHook(() => useVideoSuggestions('c', true));

    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS));

    expect(mockedFetchVideos).not.toHaveBeenCalled();
    expect(result.current).toEqual([]);
  });

  it('asks nothing while it is disabled', () => {
    renderHook(() => useVideoSuggestions('cats', false));

    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS));

    expect(mockedFetchVideos).not.toHaveBeenCalled();
  });

  it('ignores a late answer for an older text', async () => {
    let answerCats: (page: Page<VideoSummary>) => void = () => {};
    mockedFetchVideos
      .mockReturnValueOnce(new Promise((resolve) => (answerCats = resolve)))
      .mockResolvedValueOnce(results('Dogs'));
    const { result, rerender } = renderHook(({ text }) => useVideoSuggestions(text, true), {
      initialProps: { text: 'cats' },
    });

    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS));
    rerender({ text: 'dogs' });
    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS));
    await waitFor(() => expect(result.current.map((video) => video.title)).toEqual(['Dogs']));

    await act(async () => answerCats(results('Cats')));

    expect(result.current.map((video) => video.title)).toEqual(['Dogs']);
  });

  it('shows no suggestions of the previous text while the new ones are requested', async () => {
    const { result, rerender } = renderHook(({ text }) => useVideoSuggestions(text, true), {
      initialProps: { text: 'cats' },
    });
    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS));
    await waitFor(() => expect(result.current).toHaveLength(1));

    rerender({ text: 'cats and dogs' });

    expect(result.current).toEqual([]);
  });

  it('shows no suggestions when they cannot be loaded', async () => {
    mockedFetchVideos.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useVideoSuggestions('cats', true));

    act(() => jest.advanceTimersByTime(SUGGESTION_DELAY_MS));

    await waitFor(() => expect(mockedFetchVideos).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });
});
