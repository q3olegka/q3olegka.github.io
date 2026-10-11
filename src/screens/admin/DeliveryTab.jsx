import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ZoneMap from '../../components/ZoneMap.jsx';
import { attachZoneEditor, hasMapKey, makeCafeDraggable } from '../../utils/ymaps.js';
import { NumberField, TextField } from './fields.jsx';

export default function DeliveryTab({ store, update }) {
  const { delivery, cafe } = store;
  const setDelivery = (change) => update((data) => ({ ...data, delivery: { ...data.delivery, ...change } }));
  const setCafe = (change) => update((data) => ({ ...data, cafe: { ...data.cafe, ...change } }));

  // Зона и метка на момент открытия вкладки — к ним возвращает «Отменить правки на карте»
  const [initial] = useState({ zone: delivery.zone, coords: cafe.coords });
  const editor = useRef(null);
  // Обработчики карты живут дольше одной отрисовки, а править должны свежие данные
  const actions = useRef({ setDelivery, setCafe });
  actions.current = { setDelivery, setCafe };

  useEffect(() => () => editor.current?.destroy(), []);

  const onMapReady = (api) => {
    editor.current = attachZoneEditor(api, delivery.zone, (zone) => actions.current.setDelivery({ zone }));
    makeCafeDraggable(api, (coords) => actions.current.setCafe({ coords }));
  };

  const undo = () => {
    update((data) => ({
      ...data,
      delivery: { ...data.delivery, zone: initial.zone },
      cafe: { ...data.cafe, coords: initial.coords },
    }));
    editor.current?.reset(initial.zone);
  };

  return (
    <div className="panel-list">
      <section className="panel">
        <header className="panel__head">
          <h2>Условия доставки</h2>
        </header>
        <div className="form-grid">
          <NumberField label="Стоимость доставки, Р" value={delivery.price} onChange={(price) => setDelivery({ price })} />
          <NumberField label="Бесплатно при заказе от, Р" value={delivery.freeFrom} onChange={(freeFrom) => setDelivery({ freeFrom })} />
          <NumberField
            label="Минимальная сумма заказа, Р (0 — без ограничения)"
            value={delivery.minOrder}
            onChange={(minOrder) => setDelivery({ minOrder })}
          />
          <TextField label="Время доставки" value={delivery.time} onChange={(time) => setDelivery({ time })} />
          <TextField label="Адрес кофейни" value={cafe.address} onChange={(address) => setCafe({ address })} />
          <TextField
            label="Подпись о зоне в блоке «Доставка»"
            multiline
            rows={2}
            value={delivery.areaText}
            onChange={(areaText) => setDelivery({ areaText })}
          />
        </div>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>Зона доставки</h2>
          <button type="button" className="abutton" onClick={undo}>
            <RotateCcw size={16} aria-hidden="true" /> Отменить правки на карте
          </button>
        </header>
        <p className="panel__note">
          {hasMapKey
            ? 'Потяните вершину, чтобы передвинуть границу. Маленькая точка на стороне добавляет вершину, двойной клик по вершине её удаляет. Метку кофейни тоже можно перетащить.'
            : 'Редактор зоны заработает, когда в файле .env.local появится ключ Яндекс Карт. Сейчас действует зона по умолчанию.'}
        </p>
        <ZoneMap className="zone-editor" onReady={onMapReady} />
      </section>
    </div>
  );
}
