import { useEffect, useId, useRef, useState } from 'react';
import { formatDuration } from '../utils/formatDuration';
import { shareUrl } from '../utils/shareUrl';

type Props = {
  // Link of the video page, without the start time
  url: string;
  title: string;
  // Second the player is at when the dialog opens, offered as "Start at"
  currentTime: number;
  onClose: () => void;
};

const networks = (link: string, title: string) => {
  const url = encodeURIComponent(link);
  const text = encodeURIComponent(title);
  return [
    { name: 'WhatsApp', href: `https://wa.me/?text=${text}%20${url}` },
    { name: 'X', href: `https://x.com/intent/post?url=${url}&text=${text}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${url}&title=${text}` },
    { name: 'Email', href: `mailto:?subject=${text}&body=${url}` },
  ];
};

/**
 * "Share" dialog of the video page: social networks, the link to copy and an optional start time.
 */
const ShareDialog = ({ url, title, currentTime, onClose }: Props) => {
  const titleId = useId();
  const [startAtEnabled, setStartAtEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const start = Math.floor(currentTime);
  const link = shareUrl(url, startAtEnabled ? start : 0);

  useEffect(() => {
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="share-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="share-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="share-header">
          <h2 id={titleId}>Share</h2>
          <button ref={closeButton} type="button" className="pt-icon-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <ul className="share-networks">
          {networks(link, title).map((network) => (
            <li key={network.name}>
              <a href={network.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${network.name}`}>
                <span className={`share-network-icon is-${network.name.toLowerCase()}`} aria-hidden="true">
                  {network.name.charAt(0)}
                </span>
                {network.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="share-link">
          <input
            className="form-control"
            readOnly
            value={link}
            aria-label="Video link"
            onFocus={(e) => e.target.select()}
          />
          <button type="button" className="btn btn-primary" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="visually-hidden" role="status">
          {copied ? 'Link copied to the clipboard' : ''}
        </p>

        {start > 0 && (
          <div className="form-check mt-3">
            <input
              id={`${titleId}-start`}
              className="form-check-input"
              type="checkbox"
              checked={startAtEnabled}
              onChange={(event) => {
                setStartAtEnabled(event.target.checked);
                setCopied(false);
              }}
            />
            <label htmlFor={`${titleId}-start`} className="form-check-label">
              Start at {formatDuration(start)}
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareDialog;
