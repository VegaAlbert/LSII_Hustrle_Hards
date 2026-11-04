import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useVideoSuggestions } from '../videos/useVideoSuggestions';
import type { VideoSummary } from '../videos/videosApi';

type Props = {
  // Text shown when the box appears, e.g. the search that was active before leaving the page
  initialQuery?: string;
  onSearch: (query: string) => void;
};

const LIST_ID = 'video-search-suggestions';
const optionId = (video: VideoSummary) => `video-suggestion-${video.id}`;

/**
 * US-08: search box for the video list. While typing, a list suggests the titles of the most relevant videos
 * (arrows to move, Enter or click to choose, Escape to close). Sends the trimmed text; an empty search shows every
 * video again.
 */
const SearchBar = ({ initialQuery = '', onSearch }: Props) => {
  const [text, setText] = useState(initialQuery);
  // The list only opens when the user types, not for the initial query
  const [open, setOpen] = useState(false);
  // Suggestion highlighted with the arrow keys; -1 when none is
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useVideoSuggestions(text, open);
  const listVisible = open && suggestions.length > 0;

  const search = (query: string) => {
    setOpen(false);
    setActiveIndex(-1);
    onSearch(query.trim());
  };

  const choose = (video: VideoSummary) => {
    setText(video.title);
    search(video.title);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      // Browsers clear a search input on Escape: with the list open, Escape only closes the list
      if (listVisible) event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!listVisible) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === 'Enter' && suggestions[activeIndex]) {
      // Enter on a highlighted suggestion chooses it instead of searching the typed text
      event.preventDefault();
      choose(suggestions[activeIndex]);
    }
  };

  const activeSuggestion = listVisible ? suggestions[activeIndex] : undefined;

  return (
    <form role="search" className="d-flex gap-2 mb-4" onSubmit={handleSubmit}>
      <label htmlFor="video-search" className="visually-hidden">
        Search videos
      </label>
      <div className="position-relative flex-grow-1">
        <input
          id="video-search"
          type="search"
          role="combobox"
          className="form-control"
          placeholder="Search by title, author or description"
          autoComplete="off"
          maxLength={100}
          aria-autocomplete="list"
          aria-controls={listVisible ? LIST_ID : undefined}
          aria-expanded={listVisible}
          aria-activedescendant={activeSuggestion ? optionId(activeSuggestion) : undefined}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setOpen(false)}
        />
        {listVisible && (
          <ul
            id={LIST_ID}
            role="listbox"
            aria-label="Suggestions"
            className="list-group position-absolute w-100 mt-1 shadow"
            style={{ zIndex: 1000 }}
          >
            {suggestions.map((video, index) => (
              <li
                key={video.id}
                id={optionId(video)}
                role="option"
                aria-selected={index === activeIndex}
                className={`list-group-item list-group-item-action text-start${index === activeIndex ? ' active' : ''}`}
                style={{ cursor: 'pointer' }}
                // Keeps the focus in the input, so its blur does not close the list before the click
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(video)}
              >
                {video.title}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
