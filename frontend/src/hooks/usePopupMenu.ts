import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State of a small navbar menu opened by a button: closes with Escape (focus goes back to the button) or when
 * clicking anywhere else. `close()` also gives the focus back, for after choosing an option.
 */
export function usePopupMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);

  return { open, toggle, close, container, button };
}
