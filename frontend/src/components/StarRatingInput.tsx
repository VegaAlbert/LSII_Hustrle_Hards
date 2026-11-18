import { useState } from 'react';
import { MAX_SCORE, MIN_SCORE } from '../ratings/ratingsApi';

type Props = {
  // Score already given by the user, null if they have not rated yet
  value: number | null;
  onRate: (score: number) => void;
  disabled?: boolean;
};

const SCORES = Array.from({ length: MAX_SCORE - MIN_SCORE + 1 }, (_, index) => MIN_SCORE + index);

/**
 * Picker of 1 to 5 stars. Hovering (or focusing) a star lights it up with the ones before it; clicking it rates.
 */
const StarRatingInput = ({ value, onRate, disabled = false }: Props) => {
  // Star under the mouse or focused, shown instead of the saved value while it lasts
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value ?? 0;

  return (
    <div
      className="star-input"
      role="radiogroup"
      aria-label="Your rating"
      onMouseLeave={() => setPreview(null)}
      aria-disabled={disabled}
    >
      {SCORES.map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${score} ${score === 1 ? 'star' : 'stars'}`}
          className={`star-input-star${score <= shown ? ' is-on' : ''}`}
          disabled={disabled}
          onMouseEnter={() => setPreview(score)}
          onFocus={() => setPreview(score)}
          onBlur={() => setPreview(null)}
          onClick={() => onRate(score)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRatingInput;
