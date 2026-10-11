import { useReveal } from '../hooks/useReveal.js';
import { formatPrice } from '../utils/format.js';
import { sortedVariants } from '../utils/store.js';
import ProductImage from './ProductImage.jsx';
import Stepper from './Stepper.jsx';

// count — сколько этого товара в корзине во всех вариантах: при нуле кнопка «+», иначе счётчик.
// «+» всегда открывает попап выбора, «−» убирает вариант, добавленный последним.
export default function ProductCard({ product, count, index = 0, onAdd, onRemoveLast }) {
  const [ref, visible] = useReveal();
  const [cheapest] = sortedVariants(product);

  return (
    <article ref={ref} className={`card reveal${visible ? ' is-visible' : ''}`} style={{ '--i': index % 4 }}>
      <ProductImage product={product} />
      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__desc">{product.description}</p>
        <div className="card__buy">
          <span className="card__price">{formatPrice(cheapest.price)}</span>
          {count ? (
            <Stepper value={count} onMinus={onRemoveLast} onPlus={onAdd} label={`${product.name}: количество в корзине`} />
          ) : (
            <button type="button" className="button card__add" onClick={onAdd} aria-label={`Добавить: ${product.name}`}>
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
