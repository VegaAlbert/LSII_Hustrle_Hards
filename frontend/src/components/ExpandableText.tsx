import { useId, useState } from 'react';

type Props = {
  text: string;
};

// Texts longer than this, or with more lines, start collapsed
const MAX_CHARS = 280;
const MAX_LINES = 4;

/**
 * Long text that starts collapsed with a "Show more" button, e.g. a video description.
 */
const ExpandableText = ({ text }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const isLong = text.length > MAX_CHARS || text.split('\n').length > MAX_LINES;
  const collapsed = isLong && !expanded;

  return (
    <>
      <p id={id} dir="auto" className={`expandable-text mb-0${collapsed ? ' is-collapsed' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          className="btn btn-link btn-sm p-0 mt-2 expandable-toggle"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  );
};

export default ExpandableText;
