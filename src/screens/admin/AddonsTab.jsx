import { Plus } from 'lucide-react';
import { ConfirmButton, newId, NumberField, TextField } from './fields.jsx';

export default function AddonsTab({ store, update }) {
  const patch = (id, change) =>
    update((data) => ({ ...data, addons: data.addons.map((addon) => (addon.id === id ? { ...addon, ...change } : addon)) }));

  // Удалённый доп снимается и со всех товаров
  const remove = (id) =>
    update((data) => ({
      ...data,
      addons: data.addons.filter((addon) => addon.id !== id),
      products: data.products.map((product) => ({ ...product, addonIds: product.addonIds.filter((other) => other !== id) })),
    }));

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Допы</h2>
        <button
          type="button"
          className="abutton"
          onClick={() => update((data) => ({ ...data, addons: [...data.addons, { id: newId('addon'), name: 'Новый доп', price: 30 }] }))}
        >
          <Plus size={16} aria-hidden="true" /> Добавить доп
        </button>
      </header>
      <p className="panel__note">
        Доп появляется в окне покупки только у тех товаров, где он отмечен: «Товары» → «Изменить» → «Допы».
      </p>
      <ul className="rows">
        {store.addons.map((addon) => {
          const count = store.products.filter((product) => product.addonIds.includes(addon.id)).length;
          return (
            <li key={addon.id}>
              <TextField aria-label="Название допа" value={addon.name} onChange={(name) => patch(addon.id, { name })} />
              <NumberField aria-label="Цена допа, Р" className="rows__number" value={addon.price} onChange={(price) => patch(addon.id, { price })} />
              <span className="rows__hint">Р · товаров: {count}</span>
              <div className="rows__actions">
                <ConfirmButton onConfirm={() => remove(addon.id)}>Удалить</ConfirmButton>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
