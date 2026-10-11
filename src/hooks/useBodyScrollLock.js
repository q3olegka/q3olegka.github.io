import { useEffect } from 'react';

let locks = 0;

// Останавливает прокрутку страницы под окном; место полосы прокрутки занимает отступ, чтобы вёрстка не прыгала
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const { style } = document.body;
    if (locks++ === 0) {
      const gap = window.innerWidth - document.documentElement.clientWidth;
      style.overflow = 'hidden';
      if (gap > 0) style.paddingRight = `${gap}px`;
    }
    return () => {
      if (--locks === 0) {
        style.overflow = '';
        style.paddingRight = '';
      }
    };
  }, [locked]);
}
