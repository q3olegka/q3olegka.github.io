import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Upload, X } from 'lucide-react';
import { useState } from 'react';
import ProductCard from '../../components/ProductCard.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { formatPrice } from '../../utils/format.js';
import { sortedVariants } from '../../utils/store.js';
import { ConfirmButton, newId, TextField } from './fields.jsx';

const noop = () => {};

// Загруженное фото уменьшается до 1400 px по большей стороне и хранится в данных сайта.
// Обрезку под карточку делает вёрстка, здесь картинка не режется.
async function readPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.85);
}

// В форме размеры и цены — строки: пустое поле — ошибка ввода, а не ноль
const toDraft = (product) => ({
  ...product,
  variants: product.variants.map((variant) => ({ size: variant.size ? String(variant.size) : '', price: String(variant.price) })),
});

const isNumber = (text) => /^\d+$/.test(text.trim());

// Возвращает { product } или { error } с текстом для владельца
function fromDraft(draft) {
  if (!draft.name.trim()) return { error: 'Введите название' };
  if (!draft.variants.length) return { error: 'Добавьте хотя бы одну цену' };
  if (draft.variants.some((variant) => !(isNumber(variant.price) && Number(variant.price) > 0))) {
    return { error: 'Цена — целое число больше нуля' };
  }
  if (draft.variants.some((variant) => variant.size.trim() && !(isNumber(variant.size) && Number(variant.size) > 0))) {
    return { error: 'Размер — целое число больше нуля' };
  }
  const variants = draft.variants.map((variant) => ({
    size: variant.size.trim() ? Number(variant.size) : null,
    price: Number(variant.price),
  }));
  if (variants.length > 1 && variants.some((variant) => variant.size === null)) {
    return { error: 'Когда цен несколько, у каждой нужен размер' };
  }
  if (new Set(variants.map((variant) => variant.size)).size !== variants.length) return { error: 'Размеры не должны повторяться' };
  return {
    product: {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      variants: variants.sort((a, b) => (a.size ?? 0) - (b.size ?? 0)),
    },
  };
}

function ProductEditor({ initial, store, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => toDraft(initial));
  const [error, setError] = useState('');
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));
  const setVariant = (index, key, value) =>
    set('variants')(draft.variants.map((variant, i) => (i === index ? { ...variant, [key]: value } : variant)));

  const parsed = fromDraft(draft);
  // Карточка-образец показывает черновик как есть; пока в ценах ошибка — с нулевой ценой
  const preview = parsed.product ?? { ...draft, variants: [{ size: null, price: 0 }] };

  const upload = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    try {
      set('image')(await readPhoto(file));
      setError('');
    } catch {
      setError('Не удалось прочитать файл. Подойдёт фото в формате JPG, PNG или WebP');
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (parsed.error) setError(parsed.error);
    else onSave(parsed.product);
  };

  return (
    <form className="editor" onSubmit={submit}>
      <div className="editor__fields">
        <h2>{initial.name ? 'Правка товара' : 'Новый товар'}</h2>
        <TextField label="Название" value={draft.name} onChange={set('name')} />
        <TextField label="Описание" value={draft.description} onChange={set('description')} />
        <label className="afield">
          <span>Категория</span>
          <select value={draft.categoryId} onChange={(event) => set('categoryId')(event.target.value)}>
            {store.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>

        <div className="afield">
          <span>Фото</span>
          <div className="editor__photo">
            <label className="abutton">
              <Upload size={16} aria-hidden="true" /> Загрузить фото
              <input type="file" accept="image/*" hidden onChange={upload} />
            </label>
            <label className="editor__zoom">
              Масштаб
              <input
                type="range"
                min="1"
                max="2"
                step="0.05"
                value={draft.zoom}
                onChange={(event) => set('zoom')(Number(event.target.value))}
              />
            </label>
          </div>
          <small>Фото любого размера обрезается по рамке карточки само. Масштаб приближает напиток.</small>
        </div>

        <div className="afield">
          <span>Размеры и цены</span>
          {draft.variants.map((variant, index) => (
            <div key={index} className="editor__variant">
              <input
                inputMode="numeric"
                placeholder="Размер, г"
                aria-label="Размер в граммах"
                value={variant.size}
                onChange={(event) => setVariant(index, 'size', event.target.value)}
              />
              <input
                inputMode="numeric"
                placeholder="Цена, Р"
                aria-label="Цена"
                value={variant.price}
                onChange={(event) => setVariant(index, 'price', event.target.value)}
              />
              <button
                type="button"
                className="abutton abutton--icon"
                aria-label="Убрать размер"
                onClick={() => set('variants')(draft.variants.filter((_, i) => i !== index))}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="abutton" onClick={() => set('variants')([...draft.variants, { size: '', price: '' }])}>
            <Plus size={16} aria-hidden="true" /> Добавить размер
          </button>
          <small>У товара с одной ценой размер можно не указывать.</small>
        </div>

        {store.addons.length > 0 && (
          <div className="afield">
            <span>Допы</span>
            <div className="editor__checks">
              {store.addons.map((addon) => (
                <label key={addon.id}>
                  <input
                    type="checkbox"
                    checked={draft.addonIds.includes(addon.id)}
                    onChange={(event) =>
                      set('addonIds')(
                        event.target.checked ? [...draft.addonIds, addon.id] : draft.addonIds.filter((id) => id !== addon.id),
                      )
                    }
                  />
                  {addon.name}, {formatPrice(addon.price)}
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="editor__check">
          <input type="checkbox" checked={draft.hidden} onChange={(event) => set('hidden')(event.target.checked)} />
          Скрыть с сайта
        </label>

        {error && (
          <p className="editor__error" role="alert">
            {error}
          </p>
        )}
        <div className="editor__actions">
          <button type="submit" className="button">
            Сохранить
          </button>
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
      {/* Образец не нажимается и не получает фокус */}
      <aside className="editor__preview" inert>
        <span>Так карточка выглядит на сайте</span>
        <ProductCard product={preview} count={0} onAdd={noop} onRemoveLast={noop} />
      </aside>
    </form>
  );
}

export default function ProductsTab({ store, update }) {
  // Товар в редакторе; у нового товара ещё нет записи в данных
  const [editing, setEditing] = useState(null);

  const saveProduct = (product) => {
    update((data) => ({
      ...data,
      products: data.products.some((other) => other.id === product.id)
        ? data.products.map((other) => (other.id === product.id ? product : other))
        : [...data.products, product],
    }));
    setEditing(null);
  };

  const patch = (id, change) =>
    update((data) => ({ ...data, products: data.products.map((product) => (product.id === id ? { ...product, ...change } : product)) }));

  const remove = (id) => update((data) => ({ ...data, products: data.products.filter((product) => product.id !== id) }));

  // Порядок на сайте — порядок в списке; товар меняется местами с соседом из своей категории
  const move = (id, step) =>
    update((data) => {
      const products = [...data.products];
      const from = products.findIndex((product) => product.id === id);
      const siblings = products.flatMap((product, index) => (product.categoryId === products[from].categoryId ? [index] : []));
      const to = siblings[siblings.indexOf(from) + step];
      if (to === undefined) return data;
      [products[from], products[to]] = [products[to], products[from]];
      return { ...data, products };
    });

  const blank = (categoryId) => ({
    id: newId('product'),
    categoryId,
    name: '',
    description: '',
    image: 'images/img_5.webp',
    zoom: 1.2,
    // цена пустая: её вводит владелец, сохранить товар без цены нельзя
    variants: [{ size: 250, price: '' }],
    addonIds: [],
    hidden: false,
  });

  if (editing) {
    return <ProductEditor key={editing.id} initial={editing} store={store} onSave={saveProduct} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="panel-list">
      {store.categories.map((category) => {
        const products = store.products.filter((product) => product.categoryId === category.id);
        return (
          <section key={category.id} className="panel">
            <header className="panel__head">
              <h2>{category.title}</h2>
              <button type="button" className="abutton" onClick={() => setEditing(blank(category.id))}>
                <Plus size={16} aria-hidden="true" /> Добавить товар
              </button>
            </header>
            {products.length === 0 && <p className="panel__empty">Товаров нет — на сайте категория не показывается.</p>}
            <ul className="rows">
              {products.map((product, index) => (
                <li key={product.id} className={product.hidden ? 'is-hidden' : ''}>
                  <ProductImage product={product} className="rows__photo" />
                  <div className="rows__text">
                    <strong>{product.name}</strong>
                    <span>
                      {product.hidden ? 'Скрыт · ' : ''}
                      {sortedVariants(product)
                        .map((variant) => (variant.size ? `${variant.size} г — ${formatPrice(variant.price)}` : formatPrice(variant.price)))
                        .join(' · ')}
                    </span>
                  </div>
                  <div className="rows__actions">
                    <button type="button" className="abutton abutton--icon" disabled={index === 0} onClick={() => move(product.id, -1)} aria-label="Выше">
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="abutton abutton--icon"
                      disabled={index === products.length - 1}
                      onClick={() => move(product.id, 1)}
                      aria-label="Ниже"
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="abutton abutton--icon"
                      onClick={() => patch(product.id, { hidden: !product.hidden })}
                      aria-label={product.hidden ? 'Показать на сайте' : 'Скрыть с сайта'}
                    >
                      {product.hidden ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                    <button type="button" className="abutton" onClick={() => setEditing(product)}>
                      <Pencil size={16} aria-hidden="true" /> Изменить
                    </button>
                    <ConfirmButton onConfirm={() => remove(product.id)}>Удалить</ConfirmButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
