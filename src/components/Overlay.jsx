import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

// Длительность закрытия — та же, что у анимаций .overlay в site.css
const EXIT_MS = 300;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea';

// Затемнение с окном поверх страницы. kind задаёт вид окна (popup, basket, dialog),
// появление и уход анимирует CSS по data-phase. Закрывается по Esc и по клику на затемнение.
export default function Overlay({ open, onClose, kind, label, children }) {
  const [phase, setPhase] = useState(open ? 'open' : 'closed');
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useBodyScrollLock(phase !== 'closed');

  useEffect(() => {
    if (open) {
      setPhase('open');
      return undefined;
    }
    setPhase((current) => (current === 'open' ? 'closing' : current));
    const timer = setTimeout(() => setPhase('closed'), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (phase !== 'open') return undefined;
    const panel = panelRef.current;
    const before = document.activeElement;
    panel.focus({ preventScroll: true });

    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      // Tab ходит по кругу внутри окна
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      const current = document.activeElement;
      if (event.shiftKey && (current === items[0] || current === panel)) {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (!event.shiftKey && current === items.at(-1)) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, [phase]);

  if (phase === 'closed') return null;
  return createPortal(
    <div
      className={`overlay overlay--${kind}`}
      data-phase={phase}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div ref={panelRef} className="overlay__panel" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
