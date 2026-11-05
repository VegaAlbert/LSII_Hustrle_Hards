import { useId, useState, type KeyboardEvent } from 'react';

// Same limits as UploadVideoRequest in the backend
export const MAX_TAGS = 15;
export const MAX_TAG_LENGTH = 30;

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
};

/**
 * Tags typed one by one, as on YouTube: Enter or a comma adds the tag, Backspace on an empty box removes the last one.
 * Pasting "a, b, c" adds the three tags.
 */
const TagInput = ({ tags, onChange, error }: Props) => {
  const [text, setText] = useState('');
  const id = useId();
  const full = tags.length >= MAX_TAGS;

  // Adds the new, non-blank tags (without # and extra spaces) up to the limit; repeated ones are ignored
  const add = (raws: string[]) => {
    const next = [...tags];
    for (const raw of raws) {
      const tag = raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH).trim();
      if (tag && next.length < MAX_TAGS && !next.some((current) => current.toLowerCase() === tag.toLowerCase())) {
        next.push(tag);
      }
    }
    if (next.length > tags.length) onChange(next);
  };

  const handleChange = (value: string) => {
    // Everything before the last comma is complete tags; the rest is still being typed
    const parts = value.split(',');
    const rest = parts.pop() ?? '';
    if (parts.length > 0) add(parts);
    setText(rest);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add([text]);
      setText('');
    } else if (event.key === 'Backspace' && !text && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <label htmlFor={id} className="form-label">
        Tags
      </label>
      <div className={`tag-input${error ? ' is-invalid' : ''}`}>
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          disabled={full}
          placeholder={full ? 'Tag limit reached' : 'Add a tag and press Enter'}
          aria-describedby={`${id}-hint`}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            add([text]);
            setText('');
          }}
        />
      </div>
      <div id={`${id}-hint`} className="form-hint">
        <span>{error ?? 'Tags help people find your video when they search.'}</span>
        <span>
          {tags.length}/{MAX_TAGS}
        </span>
      </div>
    </div>
  );
};

export default TagInput;
