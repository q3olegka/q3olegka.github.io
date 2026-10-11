// Яндекс Карты: JS API v3 (карта), HTTP Геокодер (адрес — в точку), Геосаджест (подсказки).
// Ключи лежат в .env.local, см. .env.example. Координаты везде [долгота, широта].

const MAP_KEY = import.meta.env.VITE_YMAPS_KEY;
const GEOCODER_KEY = import.meta.env.VITE_YGEOCODER_KEY;
const SUGGEST_KEY = import.meta.env.VITE_YSUGGEST_KEY;

export const hasMapKey = Boolean(MAP_KEY);
export const hasSuggestKey = Boolean(SUGGEST_KEY);

// Поиск адресов ограничен Нижним Новгородом с окрестностями
const CITY = 'Нижний Новгород';
const BBOX = '43.60,56.15~44.25,56.45';

// Колесо мыши над картой масштабирует её; прокрутку страницы в это время гасит ZoneMap
const BEHAVIORS = ['drag', 'pinchZoom', 'dblClick', 'scrollZoom'];
const ZONE_STYLE = { fill: '#ae865d', fillOpacity: 0.16, stroke: [{ color: '#ae865d', width: 2 }] };

let loading;

export function loadYmaps() {
  loading ??= new Promise((resolve, reject) => {
    if (!MAP_KEY) {
      reject(new Error('Нет ключа Яндекс Карт'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(MAP_KEY)}&lang=ru_RU`;
    script.onload = () => window.ymaps3.ready.then(() => resolve(window.ymaps3), reject);
    script.onerror = () => reject(new Error('Яндекс Карты не загрузились'));
    document.head.append(script);
  });
  return loading;
}

// Адрес — в точку. null — адрес не найден; исключение — сервис недоступен (нет ключа, сбой, лимит).
export async function geocode(text) {
  if (!GEOCODER_KEY) throw new Error('Нет ключа Геокодера');
  const params = new URLSearchParams({
    apikey: GEOCODER_KEY,
    geocode: `${CITY}, ${text}`,
    lang: 'ru_RU',
    format: 'json',
    results: '1',
    bbox: BBOX,
    rspn: '1',
  });
  const response = await fetch(`https://geocode-maps.yandex.ru/v1/?${params}`);
  if (!response.ok) throw new Error(`Геокодер: ${response.status}`);
  const data = await response.json();
  const found = data.response.GeoObjectCollection.featureMember[0]?.GeoObject;
  const meta = found?.metaDataProperty.GeocoderMetaData;
  // На неизвестный адрес геокодер отвечает самим городом или районом — это не находка
  if (!meta || !['house', 'street'].includes(meta.kind)) return null;
  return { coords: found.Point.pos.split(' ').map(Number), precise: meta.kind === 'house' };
}

// Подсказки при вводе адреса. types: 'street,house' — улицы и дома, 'street' — только улицы.
export async function suggest(text, types = 'street,house') {
  const params = new URLSearchParams({
    apikey: SUGGEST_KEY,
    text,
    lang: 'ru',
    bbox: BBOX,
    strict_bounds: '1',
    types,
    results: '5',
  });
  const response = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`);
  if (!response.ok) throw new Error(`Геосаджест: ${response.status}`);
  const data = await response.json();
  return (data.results ?? []).map((item) => ({ title: item.title.text, subtitle: item.subtitle?.text ?? '' }));
}

const closed = (ring) => ({ type: 'Polygon', coordinates: [[...ring, ring[0]]] });

function markerElement(className) {
  const element = document.createElement('div');
  element.className = className;
  return element;
}

// Карта с меткой кофейни и зоной доставки. Возвращает управление картой.
export async function createZoneMap(container, { cafe, zone, zoom = 12 }) {
  const ymaps3 = await loadYmaps();
  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapFeature, YMapMarker } = ymaps3;

  const map = new YMap(container, { location: { center: cafe, zoom }, behaviors: BEHAVIORS });
  map.addChild(new YMapDefaultSchemeLayer());
  map.addChild(new YMapDefaultFeaturesLayer());

  const area = new YMapFeature({ geometry: closed(zone), style: ZONE_STYLE });
  const cafeMarker = new YMapMarker({ coordinates: cafe }, markerElement('map-pin'));
  map.addChild(area);
  map.addChild(cafeMarker);

  let cafeCoords = cafe;
  let pointMarker = null;

  return {
    ymaps3,
    map,
    cafeMarker,
    setZone: (ring) => area.update({ geometry: closed(ring) }),
    setCafe(coords) {
      cafeCoords = coords;
      cafeMarker.update({ coordinates: coords });
    },
    // Метка найденного адреса; карта подстраивается так, чтобы были видны и адрес, и кофейня
    setPoint(coords) {
      if (pointMarker) map.removeChild(pointMarker);
      pointMarker = coords ? new YMapMarker({ coordinates: coords }, markerElement('map-pin map-pin--address')) : null;
      if (!pointMarker) return;
      map.addChild(pointMarker);
      const padX = Math.max(Math.abs(coords[0] - cafeCoords[0]) * 0.25, 0.004);
      const padY = Math.max(Math.abs(coords[1] - cafeCoords[1]) * 0.25, 0.003);
      map.setLocation({
        bounds: [
          [Math.min(coords[0], cafeCoords[0]) - padX, Math.min(coords[1], cafeCoords[1]) - padY],
          [Math.max(coords[0], cafeCoords[0]) + padX, Math.max(coords[1], cafeCoords[1]) + padY],
        ],
        duration: 400,
      });
    },
    zoomBy: (step) => map.setLocation({ zoom: map.zoom + step, duration: 200 }),
    destroy: () => map.destroy(),
  };
}

// Правка зоны на карте настроек: вершина тянется мышью, точка на середине стороны добавляет вершину,
// двойной клик по вершине её удаляет. onChange получает новое кольцо после каждого действия.
export function attachZoneEditor({ ymaps3, map, setZone }, ring, onChange) {
  const { YMapMarker } = ymaps3;
  let points = ring.map((point) => [...point]);
  let handles = [];

  const middle = (index) => {
    const from = points[index];
    const to = points[(index + 1) % points.length];
    return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  };
  const emit = () => onChange(points.map((point) => [...point]));

  function rebuild() {
    handles.forEach((handle) => map.removeChild(handle));
    setZone(points);

    const mids = points.map((_, index) => {
      const element = markerElement('zone-handle zone-handle--mid');
      element.title = 'Добавить вершину';
      element.addEventListener('click', () => {
        points.splice(index + 1, 0, middle(index));
        rebuild();
        emit();
      });
      return new YMapMarker({ coordinates: middle(index), blockBehaviors: true }, element);
    });

    const corners = points.map((point, index) => {
      const element = markerElement('zone-handle');
      element.title = 'Потяните, чтобы передвинуть. Двойной клик — удалить';
      element.addEventListener('dblclick', () => {
        if (points.length <= 3) return;
        points.splice(index, 1);
        rebuild();
        emit();
      });
      const corner = new YMapMarker(
        {
          coordinates: point,
          draggable: true,
          blockBehaviors: true,
          onDragMove(coords) {
            const before = (index + points.length - 1) % points.length;
            points[index] = coords;
            corner.update({ coordinates: coords });
            setZone(points);
            mids[before].update({ coordinates: middle(before) });
            mids[index].update({ coordinates: middle(index) });
          },
          onDragEnd: emit,
        },
        element,
      );
      return corner;
    });

    handles = [...mids, ...corners];
    handles.forEach((handle) => map.addChild(handle));
  }

  rebuild();
  return {
    reset(next) {
      points = next.map((point) => [...point]);
      rebuild();
    },
    destroy() {
      handles.forEach((handle) => map.removeChild(handle));
      handles = [];
    },
  };
}

// В настройках метку кофейни можно перетащить
export function makeCafeDraggable({ cafeMarker }, onChange) {
  cafeMarker.update({
    draggable: true,
    onDragMove: (coords) => cafeMarker.update({ coordinates: coords }),
    onDragEnd: onChange,
  });
}
