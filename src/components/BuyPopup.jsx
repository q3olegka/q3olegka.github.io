import { X } from 'lucide-react';
import { useState } from 'react';
import { cart } from '../hooks/useCart.js';
import { useStore } from '../hooks/useStore.jsx';
import { formatPrice } from '../utils/format.js';
import { sortedVariants } from '../utils/store.js';
import Overlay from './Overlay.jsx';
import ProductImage from './ProductImage.jsx';
import Stepper from './Stepper.jsx';

// Окно покупки товара. Содержимое создаётся заново при каждом открытии, поэтому выбор сбрасывается.
export default function BuyPopup({ product, open, onClose }) {
  return (
    <Overlay open={open && Boolean(product)} onClose={onClose} kind="popup" label={product?.name}>
      {product && <BuyForm product={product} onClose={onClose} />}
    </Overlay>
  );
}

function BuyForm({ product, onClose }) {
  const { store } = useStore();
  const variants = sortedVariants(product);
  const addons = store.addons.filter((addon) => product.addonIds.includes(addon.id));
  // Минимальный размер выбран сразу
  const [size, setSize] = useState(variants[0].size ?? null);
  const [picked, setPicked] = useState([]);
  const [qty, setQty] = useState(1);

  const variant = variants.find((candidate) => (candidate.size ?? null) === size) ?? variants[0];
  const unit = variant.price + addons.reduce((sum, addon) => (picked.includes(addon.id) ? sum + addon.price : sum), 0);
  const toggle = (id) => setPicked((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));

  const add = () => {
    cart.add({ productId: product.id, size: variant.size ?? null, addonIds: picked }, qty);
    onClose();
  };

  return (
    <div className="buy">
      <button type="button" className="close" onClick={onClose} aria-label="Закрыть">
        <X size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
      {/* На узком экране эта часть прокручивается, а блок итога ниже остаётся на месте */}
      <div className="buy__scroll">
        <ProductImage product={product} className="buy__photo" eager />
        <div className="buy__text">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
        </div>
        <div className="buy__options">
          {variants.some((candidate) => candidate.size) && (
            <div className="options options--sizes" role="radiogroup" aria-label="Размер, граммы">
              <p className="options__label">Размер (г)</p>
              <div className="options__row">
                {variants.map((candidate) => (
                  <label key={candidate.size} className="chip chip--size">
                    <input type="radio" name="size" checked={candidate === variant} onChange={() => setSize(candidate.size)} />
                    <span className="chip__name">{candidate.size}</span>
                    <span className="chip__price">{formatPrice(candidate.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {addons.length > 0 && (
            <div className="options" role="group" aria-label="Допы">
              <p className="options__label">Допы</p>
              <div className="options__row">
                {addons.map((addon) => (
                  <label key={addon.id} className="chip">
                    <input type="checkbox" checked={picked.includes(addon.id)} onChange={() => toggle(addon.id)} />
                    <span className="chip__name">{addon.name}</span>
                    <span className="chip__price">{formatPrice(addon.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="buy__footer">
        <p className="total">
          <span>Итого:</span>
          <strong>{formatPrice(unit * qty)}</strong>
        </p>
        <div className="buy__actions">
          <Stepper
            className="stepper--wide"
            value={qty}
            onMinus={() => setQty((current) => Math.max(1, current - 1))}
            onPlus={() => setQty((current) => current + 1)}
            label="Количество"
          />
          <button type="button" className="button" onClick={add}>
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
