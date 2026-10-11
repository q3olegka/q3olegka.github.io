import { X } from 'lucide-react';
import { cart, useCart } from '../hooks/useCart.js';
import { useStore } from '../hooks/useStore.jsx';
import { formatPrice } from '../utils/format.js';
import { DeleteIcon } from './icons.jsx';
import Overlay from './Overlay.jsx';
import ProductImage from './ProductImage.jsx';
import Stepper from './Stepper.jsx';

// Окно корзины. checkoutHref — куда ведёт «Оформить заказ»; на самой странице оформления
// его не передают, и кнопка просто закрывает корзину.
export default function Basket({ open, onClose, checkoutHref }) {
  const { delivery } = useStore().store;
  const { items, subtotal, missing } = useCart();
  // Оформить заказ нельзя из пустой корзины и пока сумма меньше минимальной
  const blocked = !items.length || missing > 0;

  return (
    <Overlay open={open} onClose={onClose} kind="basket" label="Ваш заказ">
      <div className="basket">
        <header className="basket__head">
          <h2>Ваш заказ</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Закрыть">
            <X size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </header>
        <div className="basket__list">
          {items.map((item) => (
            <article key={item.key} className="basket-item">
              <ProductImage product={item.product} className="basket-item__photo" />
              <div className="basket-item__text">
                <h3>{item.title}</h3>
                {item.addonsText && <p>{item.addonsText}</p>}
                <strong>{formatPrice(item.total)}</strong>
              </div>
              <button
                type="button"
                className="basket-item__delete"
                onClick={() => cart.setQty(item.key, 0)}
                aria-label={`Удалить: ${item.title}`}
              >
                <DeleteIcon />
              </button>
              <Stepper
                value={item.line.qty}
                onMinus={() => cart.setQty(item.key, item.line.qty - 1)}
                onPlus={() => cart.setQty(item.key, item.line.qty + 1)}
                label={`${item.title}: количество`}
              />
            </article>
          ))}
          <div className="basket__hint">
            {!items.length && <p>В корзине пока пусто</p>}
            {items.length > 0 && missing > 0 && (
              <p className="basket__min">
                Минимальный заказ — от {formatPrice(delivery.minOrder)}. Добавьте ещё на {formatPrice(missing)}
              </p>
            )}
            {items.length > 0 && <p>Бесплатная доставка — от {formatPrice(delivery.freeFrom)}</p>}
          </div>
        </div>
        <footer className="basket__foot">
          <p className="total">
            <span>Итого:</span>
            <strong>{formatPrice(subtotal)}</strong>
          </p>
          {checkoutHref && !blocked ? (
            <a className="button" href={checkoutHref}>
              Оформить заказ
            </a>
          ) : (
            <button type="button" className="button" disabled={blocked} onClick={onClose}>
              Оформить заказ
            </button>
          )}
        </footer>
      </div>
    </Overlay>
  );
}
