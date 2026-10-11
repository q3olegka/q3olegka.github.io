import { imageUrl } from '../utils/store.js';

// Фото в рамке со скруглением: любое изображение заполняет рамку и обрезается по ней,
// zoom — увеличение поверх заполнения (в макете 1,2)
export default function ProductImage({ product, className = '', eager = false }) {
  return (
    <div className={`photo ${className}`}>
      <img
        src={imageUrl(product.image)}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ transform: `scale(${product.zoom})` }}
      />
    </div>
  );
}
