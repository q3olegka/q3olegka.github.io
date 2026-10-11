import { useEffect, useRef, useState } from 'react';

// Плавное появление: visible становится true, когда элемент впервые входит в окно
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
