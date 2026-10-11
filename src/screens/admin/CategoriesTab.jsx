import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { ConfirmButton, newId, swapped, TextField } from './fields.jsx';

export default function CategoriesTab({ store, update }) {
  const setCategories = (change) => update((data) => ({ ...data, categories: change(data.categories) }));
  const used = (id) => store.products.some((product) => product.categoryId === id);

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Категории</h2>
        <button
          type="button"
          className="abutton"
          onClick={() => setCategories((list) => [...list, { id: newId('category'), title: 'Новая категория' }])}
        >
          <Plus size={16} aria-hidden="true" /> Добавить категорию
        </button>
      </header>
      <p className="panel__note">
        Порядок здесь — порядок на сайте. Категория появляется на сайте, когда в ней есть хотя бы один товар. Удалить можно
        только пустую категорию.
      </p>
      <ul className="rows">
        {store.categories.map((category, index) => (
          <li key={category.id}>
            <TextField
              aria-label="Название категории"
              value={category.title}
              onChange={(title) => setCategories((list) => list.map((other) => (other.id === category.id ? { ...other, title } : other)))}
            />
            <div className="rows__actions">
              <button
                type="button"
                className="abutton abutton--icon"
                disabled={index === 0}
                onClick={() => setCategories((list) => swapped(list, index, -1))}
                aria-label="Выше"
              >
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="abutton abutton--icon"
                disabled={index === store.categories.length - 1}
                onClick={() => setCategories((list) => swapped(list, index, 1))}
                aria-label="Ниже"
              >
                <ArrowDown size={16} aria-hidden="true" />
              </button>
              <ConfirmButton
                disabled={used(category.id)}
                title={used(category.id) ? 'Сначала перенесите или удалите товары категории' : undefined}
                onConfirm={() => setCategories((list) => list.filter((other) => other.id !== category.id))}
              >
                Удалить
              </ConfirmButton>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
