import { useEffect, useState } from 'react';

/**
 * Temporary URL to show a local file or blob (a chosen video, a thumbnail) in the page. It is released when the blob
 * changes or the component unmounts.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}
