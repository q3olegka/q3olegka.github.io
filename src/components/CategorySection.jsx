import { cart } from '../hooks/useCart.js';
import { countOf } from '../utils/cart.js';
import ProductCard from './ProductCard.jsx';

// legend — справка о размерах: граммы, которые есть у товаров категории
export default function CategorySection({ category, products, legend, summary, onAdd }) {
  return (
    <section className="category">
      <header className="category__head">
        <h2>{category.title}</h2>
        {legend.length > 0 && (
          <p className="legend">
            <span>Размер (г)</span>
            {legend.map((size) => (
              <span key={size}>{size}</span>
            ))}
          </p>
        )}
      </header>
      <div className="grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            count={countOf(summary, product.id)}
            onAdd={() => onAdd(product.id)}
            onRemoveLast={() => cart.removeLast(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
