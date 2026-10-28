import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import VideoGrid from '../components/VideoGrid';

/**
 * Home page: search box and video list. US-08: the search lives in the URL (/?q=cats), so the browser's back button
 * returns to the previous search and a search can be shared as a link.
 */
const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';

  return (
    <>
      {/* The key resets the box when the URL changes from outside, e.g. back button or the "Pro Tube" link */}
      <SearchBar key={query} initialQuery={query} onSearch={(text) => setSearchParams(text ? { q: text } : {})} />
      <VideoGrid query={query} />
    </>
  );
};

export default HomePage;
