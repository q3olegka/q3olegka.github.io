import { MapPin, Maximize, Minimize, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';
import { useStore } from '../hooks/useStore.jsx';
import { createZoneMap, hasMapKey } from '../utils/ymaps.js';

// Карта с кофейней и зоной доставки. point — найденный адрес [долгота, широта] или null.
// card — показывать плашку с адресом кофейни; onReady получает управление картой (нужно редактору зоны).
export default function ZoneMap({ point = null, card = false, className = '', onReady }) {
  const { cafe, delivery } = useStore().store;
  const boxRef = useRef(null);
  const holderRef = useRef(null);
  const apiRef = useRef(null);
  const [state, setState] = useState(hasMapKey ? 'waiting' : 'nokey');
  const [full, setFull] = useState(false);
  useBodyScrollLock(full);

  // Карта грузится, только когда блок подходит к окну: каталог не ждёт Яндекс
  useEffect(() => {
    if (!hasMapKey) return undefined;
    let dead = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        createZoneMap(holderRef.current, { cafe: cafe.coords, zone: delivery.zone }).then(
          (api) => {
            if (dead) {
              api.destroy();
              return;
            }
            apiRef.current = api;
            setState('ready');
            onReady?.(api);
          },
          () => !dead && setState('error'),
        );
      },
      { rootMargin: '600px' },
    );
    observer.observe(boxRef.current);
    return () => {
      dead = true;
      observer.disconnect();
      apiRef.current?.destroy();
      apiRef.current = null;
    };
    // Карта создаётся один раз; зона, кофейня и точка обновляются эффектами ниже
  }, []);

  useEffect(() => {
    if (state === 'ready') apiRef.current.setZone(delivery.zone);
  }, [state, delivery.zone]);

  useEffect(() => {
    if (state === 'ready') apiRef.current.setCafe(cafe.coords);
  }, [state, cafe.coords]);

  useEffect(() => {
    if (state === 'ready') apiRef.current.setPoint(point);
  }, [state, point]);

  // Колесо над готовой картой меняет её масштаб, страница при этом не прокручивается
  useEffect(() => {
    if (state !== 'ready') return undefined;
    const box = boxRef.current;
    const onWheel = (event) => event.preventDefault();
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [state]);

  // Esc возвращает карту с полного экрана на место
  useEffect(() => {
    if (!full) return undefined;
    const onKey = (event) => event.key === 'Escape' && setFull(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [full]);

  return (
    <div ref={boxRef} className={`map ${full ? 'is-full' : ''} ${className}`}>
      <div ref={holderRef} className="map__canvas" />
      {state !== 'ready' && (
        <div className="map__stub">
          <span className="map-pin" />
          {state === 'nokey' && <p>Карта появится, когда в .env.local будет ключ Яндекс Карт</p>}
          {state === 'error' && <p>Карта не загрузилась. Обновите страницу</p>}
        </div>
      )}
      {card && (
        <p className="map__card">
          <MapPin size={18} aria-hidden="true" />
          {cafe.address}
        </p>
      )}
      {state === 'ready' && (
        <div className="map__tools">
          <button type="button" onClick={() => apiRef.current.zoomBy(1)} aria-label="Приблизить">
            <Plus size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => apiRef.current.zoomBy(-1)} aria-label="Отдалить">
            <Minus size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setFull(!full)} aria-label={full ? 'Свернуть карту' : 'Карта на весь экран'}>
            {full ? <Minimize size={20} aria-hidden="true" /> : <Maximize size={20} aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  );
}
