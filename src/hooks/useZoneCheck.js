import { useCallback, useRef, useState } from 'react';
import { pointInPolygon } from '../utils/geo.js';
import { geocode } from '../utils/ymaps.js';
import { useStore } from './useStore.jsx';

const IDLE = { status: 'idle', point: null, precise: false };

// Проверка адреса на зону доставки.
// status: idle | loading | in | out | notfound | unavailable (нет ключа, сбой или лимит сервиса);
// point — найденная точка [долгота, широта]; precise — найден дом, а не только улица.
export function useZoneCheck() {
  const { store } = useStore();
  const [state, setState] = useState(IDLE);
  const last = useRef(0);
  const { zone } = store.delivery;

  const check = useCallback(
    async (text) => {
      const id = ++last.current;
      if (!text.trim()) {
        setState(IDLE);
        return;
      }
      setState((current) => ({ ...current, status: 'loading' }));
      let next;
      try {
        const found = await geocode(text.trim());
        next = found
          ? { status: pointInPolygon(found.coords, zone) ? 'in' : 'out', point: found.coords, precise: found.precise }
          : { ...IDLE, status: 'notfound' };
      } catch {
        next = { ...IDLE, status: 'unavailable' };
      }
      if (id === last.current) setState(next);
    },
    [zone],
  );

  return { ...state, check };
}
