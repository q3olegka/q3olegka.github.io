import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../hooks/useStore.jsx';
import { useZoneCheck } from '../hooks/useZoneCheck.js';
import { formatPrice } from '../utils/format.js';
import AddressInput from './AddressInput.jsx';
import { ClockIcon, GiftIcon, MopedIcon } from './icons.jsx';
import ZoneMap from './ZoneMap.jsx';
import ZoneStatus from './ZoneStatus.jsx';

export default function DeliveryBlock() {
  const { delivery } = useStore().store;
  const [address, setAddress] = useState('');
  const zone = useZoneCheck();

  const submit = (event) => {
    event.preventDefault();
    zone.check(address);
  };

  return (
    <section className="delivery container" id="delivery">
      <div className="delivery__info">
        <h2>Доставка</h2>
        <ul className="perks">
          <li>
            <MopedIcon size={42} />
            <span>{delivery.areaText}</span>
          </li>
          <li>
            <ClockIcon size={32} />
            <span>
              Время доставки{'\n'}
              {delivery.time}
            </span>
          </li>
          <li>
            <GiftIcon size={34} />
            <span>
              Бесплатная доставка{'\n'}при заказе от {formatPrice(delivery.freeFrom)}
            </span>
          </li>
        </ul>
        <form className="delivery__form" onSubmit={submit}>
          <AddressInput
            value={address}
            onChange={setAddress}
            onPick={zone.check}
            placeholder="Введите ваш адрес"
            aria-label="Адрес доставки"
            icon={<MapPin size={22} aria-hidden="true" />}
          />
          <button type="submit" className="button" disabled={!address.trim() || zone.status === 'loading'}>
            Проверить зону доставки
          </button>
          <ZoneStatus zone={zone} />
        </form>
      </div>
      <ZoneMap className="delivery__map" point={zone.point} card />
    </section>
  );
}
