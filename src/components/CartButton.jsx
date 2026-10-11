import { ShoppingCart } from 'lucide-react';

// Пока корзина пуста, кнопка неактивна и кружка с количеством нет
export default function CartButton({ count, onClick }) {
  return (
    <button
      type="button"
      className="cart-button"
      disabled={!count}
      onClick={onClick}
      aria-label={count ? `Корзина, товаров: ${count}` : 'Корзина пуста'}
    >
      <ShoppingCart size={16} strokeWidth={2} aria-hidden="true" />
      <span className="cart-button__label">Корзина</span>
      {count > 0 && <span className="cart-button__count">{count}</span>}
    </button>
  );
}
