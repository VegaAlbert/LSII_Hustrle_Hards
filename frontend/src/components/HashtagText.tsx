import { Link } from 'react-router-dom';
import { hashtagSearchUrl, splitHashtags } from '../utils/hashtags';

/**
 * Text whose #hashtags are links to a search of that hashtag, as in YouTube descriptions.
 */
const HashtagText = ({ text }: { text: string }) => (
  <>
    {splitHashtags(text).map((part, index) =>
      part.kind === 'hashtag' ? (
        // The parts never change order, so their position is a stable key
        <Link key={index} to={hashtagSearchUrl(part.value)} className="hashtag-link">
          #{part.value}
        </Link>
      ) : (
        <span key={index}>{part.value}</span>
      )
    )}
  </>
);

export default HashtagText;
