import { useEffect, useState } from 'react';
import { fetchVideos, type VideoSummary } from './videosApi';

export const MAX_SUGGESTIONS = 5;
// Shorter texts match almost every video, so they get no suggestions
export const MIN_SUGGESTION_LENGTH = 2;
// Wait until the user stops typing instead of sending one request per key
export const SUGGESTION_DELAY_MS = 300;

/**
 * US-08: the most relevant videos for the text being typed in the search box, as the suggestions of a video site.
 * Nothing is requested while `enabled` is false (e.g. the list is closed). A failed request just shows no suggestions:
 * the search itself still works.
 */
export function useVideoSuggestions(text: string, enabled: boolean): VideoSummary[] {
  // Remembers the text the suggestions belong to, so the ones of an older text are never shown
  const [result, setResult] = useState<{ query: string; videos: VideoSummary[] }>({ query: '', videos: [] });
  const query = text.trim();
  const active = enabled && query.length >= MIN_SUGGESTION_LENGTH;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchVideos(0, MAX_SUGGESTIONS, query)
        .then((page) => {
          if (!cancelled) setResult({ query, videos: page.content });
        })
        .catch(() => {
          if (!cancelled) setResult({ query, videos: [] });
        });
    }, SUGGESTION_DELAY_MS);
    // A new key before the delay cancels this request; a late answer for an old text is ignored
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, query]);

  return active && result.query === query ? result.videos : [];
}
