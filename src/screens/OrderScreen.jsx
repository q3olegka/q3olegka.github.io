import { Check, MapPin, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddressInput from '../components/AddressInput.jsx';
import Basket from '../components/Basket.jsx';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import Overlay from '../components/Overlay.jsx';
import ZoneMap from '../components/ZoneMap.jsx';
import ZoneStatus from '../components/ZoneStatus.jsx';
import { cart, useCart } from '../hooks/useCart.js';
import { useStore } from '../hooks/useStore.jsx';
import { useZoneCheck } from '../hooks/useZoneCheck.js';
import { formatPrice, isPhoneComplete, nextPhone } from '../utils/format.js';

const base = import.meta.env.BASE_URL;
const stay = (event) => event.preventDefault();

function Field({ label, required, children }) {
  return (
    <label className="form-field">
      <span className="form-field__label">
        {label}
        {required && <em> *</em>}
      </span>
      {children}
    </label>
  );
}

export default function OrderScreen() {
  const { delivery } = useStore().store;
  const summary = useCart();
  const zone = useZoneCheck();
  const [form, setForm] = useState({ name: '', phone: '', street: '', house: '', flat: '', entrance: '' });
  const [basketOpen, setBasketOpen] = useState(false);
  // Оплата: null — окно закрыто, 'ask' — заглушка платёжной системы, 'busy' — «платёж идёт»
  const [payment, setPayment] = useState(null);
  const [done, setDone] = useState(null);

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const input = (key) => ({ value: form[key], onChange: (event) => set(key)(event.target.value) });

  // Адрес проверяется, когда есть и улица, и дом; пауза — чтобы не слать запрос на каждую букву
  const address = form.street.trim() && form.house.trim() ? `${form.street.trim()}, ${form.house.trim()}` : '';
  const { check } = zone;
  useEffect(() => {
    const timer = setTimeout(() => check(address), address ? 700 : 0);
    return () => clearTimeout(timer);
  }, [address, check]);

  // Сервис проверки недоступен (нет ключа, сбой, лимит) — заказ не блокируем, адрес уточнит оператор
  const ready =
    summary.count > 0 &&
    form.name.trim().length > 1 &&
    isPhoneComplete(form.phone) &&
    Boolean(address) &&
    Boolean(form.flat.trim()) &&
    (zone.status === 'in' || zone.status === 'unavailable');

  // Платёжная система не подключена: оплата имитируется
  const pay = () => {
    setPayment('busy');
    setTimeout(() => {
      setDone({
        number: String(Date.now()).slice(-6),
        items: summary.items,
        total: summary.total,
        address: [form.street.trim(), `д. ${form.house.trim()}`, `кв./оф. ${form.flat.trim()}`].join(', '),
      });
      cart.clear();
      setPayment(null);
      window.scrollTo(0, 0);
    }, 1200);
  };

  return (
    <>
      <Header count={summary.count} onCartClick={() => setBasketOpen(true)} />
      <main className="order container">
        {done ? (
          <section className="done">
            <span className="done__mark">
              <Check size={40} aria-hidden="true" />
            </span>
            <h1>Оплата прошла успешно</h1>
            <p>
              Заказ № {done.number} принят — уже готовим.
              <br />
              Привезём по адресу: {done.address}. Доставка {delivery.time}.
            </p>
            <ul>
              {done.items.map((item) => (
                <li key={item.key}>
                  <span>
                    {item.title}
                    {item.addonsText && <small>{item.addonsText}</small>}
                  </span>
                  <span>
                    {item.line.qty} × {formatPrice(item.unit)}
                  </span>
                </li>
              ))}
              <li>
                <span>Оплачено</span>
                <span>{formatPrice(done.total)}</span>
              </li>
            </ul>
            <a className="button" href={base}>
              Вернуться в меню
            </a>
          </section>
        ) : (
          <>
            <nav className="crumbs" aria-label="Путь по сайту">
              <a href={base}>Главная</a> / Оформление заказа
            </nav>
            <div className="order__layout">
              <form className="order__form" onSubmit={stay} noValidate>
                <h1>Оформление заказа</h1>
                <Field label="Ваше имя" required>
                  <div className="field">
                    <User size={20} aria-hidden="true" />
                    <input type="text" name="name" autoComplete="name" placeholder="Как к вам обращаться" {...input('name')} />
                  </div>
                </Field>
                <Field label="Телефон" required>
                  <div className="field">
                    <Phone size={20} aria-hidden="true" />
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="+7 (_ _ _) _ _ _ - _ _ - _ _"
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: nextPhone(current.phone, event.target.value) }))}
                    />
                  </div>
                </Field>
                <Field label="Улица" required>
                  <AddressInput
                    name="street"
                    types="street"
                    placeholder="Например ул. Ленина"
                    value={form.street}
                    onChange={set('street')}
                    icon={<MapPin size={20} aria-hidden="true" />}
                  />
                </Field>
                <ZoneStatus zone={zone} strict />
                <div className="form-row">
                  <Field label="Дом" required>
                    <div className="field field--plain">
                      <input type="text" name="house" placeholder="77a" {...input('house')} />
                    </div>
                  </Field>
                  <Field label="Кв / Офис" required>
                    <div className="field field--plain">
                      <input type="text" name="flat" {...input('flat')} />
                    </div>
                  </Field>
                  <Field label="Подъезд">
                    <div className="field field--plain">
                      <input type="text" name="entrance" placeholder="Необязательно" {...input('entrance')} />
                    </div>
                  </Field>
                </div>
                {/* Найденный адрес показываем на карте Яндекса — так требуют условия бесплатного ключа */}
                {zone.point && <ZoneMap className="order__map" point={zone.point} />}
              </form>

              <aside className="order-summary" aria-label="Ваш заказ">
                {summary.count === 0 && (
                  <p className="order-summary__empty">
                    В корзине пока пусто. <a href={base}>Выбрать напитки</a>
                  </p>
                )}
                <ul className="order-summary__items">
                  {summary.items.map((item) => (
                    <li key={item.key}>
                      <span className="order-summary__title">{item.title}</span>
                      <span className="order-summary__qty">
                        <small>x</small> {item.line.qty}
                      </span>
                      <span className="order-summary__price">{formatPrice(item.total)}</span>
                      {item.addonsText && <span className="order-summary__addons">{item.addonsText}</span>}
                    </li>
                  ))}
                  {summary.count > 0 && (
                    <li>
                      <span>Доставка курьером</span>
                      <span />
                      <span>{summary.delivery ? formatPrice(summary.delivery) : 'бесплатно'}</span>
                    </li>
                  )}
                </ul>
                <div className="order-summary__foot">
                  <p className="total">
                    <span>Итого:</span>
                    <strong>{formatPrice(summary.total)}</strong>
                  </p>
                  <p className="consent">
                    Оформляя заказ, вы соглашаетесь с обработкой{' '}
                    <a href="#" onClick={stay}>
                      персональных данных
                    </a>
                  </p>
                  <button type="button" className="button" disabled={!ready} onClick={() => setPayment('ask')}>
                    Оформить заказ
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
      <Basket open={basketOpen} onClose={() => setBasketOpen(false)} />
      <Overlay open={Boolean(payment)} onClose={() => payment === 'ask' && setPayment(null)} kind="dialog" label="Оплата заказа">
        <div className="pay">
          <h2>Оплата заказа</h2>
          <p className="pay__sum">{formatPrice(summary.total)}</p>
          <p className="pay__note">
            Здесь откроется форма платёжной системы. Сейчас она не подключена: оплата имитируется, данные карты не нужны.
          </p>
          <div className="pay__actions">
            <button type="button" className="button button--ghost" disabled={payment === 'busy'} onClick={() => setPayment(null)}>
              Отмена
            </button>
            <button type="button" className="button" disabled={payment === 'busy'} onClick={pay}>
              {payment === 'busy' ? 'Оплачиваем…' : 'Оплатить'}
            </button>
          </div>
        </div>
      </Overlay>
    </>
  );
}
