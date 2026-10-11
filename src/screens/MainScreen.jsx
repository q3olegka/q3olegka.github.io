import { useState } from 'react';
import Basket from '../components/Basket.jsx';
import BuyPopup from '../components/BuyPopup.jsx';
import CategorySection from '../components/CategorySection.jsx';
import DeliveryBlock from '../components/DeliveryBlock.jsx';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { useCart } from '../hooks/useCart.js';
import { useStore } from '../hooks/useStore.jsx';
import { productsOf, sizeLegend } from '../utils/store.js';

const NAV = [
  { id: 'menu', label: 'Меню' },
  { id: 'delivery', label: 'Доставка' },
  { id: 'contacts', label: 'Контакты' },
];

export default function MainScreen() {
  const { store } = useStore();
  const summary = useCart();
  // Товар остаётся в состоянии и после закрытия — пока окно уходит с экрана, оно не пустеет
  const [popup, setPopup] = useState({ productId: null, open: false });
  const [basketOpen, setBasketOpen] = useState(false);

  return (
    <>
      <Header nav={NAV} count={summary.count} onCartClick={() => setBasketOpen(true)} />
      <main>
        <div className="catalog container" id="menu">
          {store.categories.map((category) => {
            const products = productsOf(store, category.id);
            return (
              products.length > 0 && (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={products}
                  legend={sizeLegend(store, category.id)}
                  summary={summary}
                  onAdd={(productId) => setPopup({ productId, open: true })}
                />
              )
            );
          })}
        </div>
        <DeliveryBlock />
      </main>
      <Footer />
      <BuyPopup
        product={store.products.find((product) => product.id === popup.productId)}
        open={popup.open}
        onClose={() => setPopup((current) => ({ ...current, open: false }))}
      />
      <Basket open={basketOpen} onClose={() => setBasketOpen(false)} checkoutHref={`${import.meta.env.BASE_URL}order/`} />
    </>
  );
}
