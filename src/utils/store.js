// Данные сайта. Опубликованная версия — public/data/store.json.
// Правки владельца хранятся в IndexedDB этого браузера и заменяют её целиком.

const DB = 'coffee-mall';
const TABLE = 'kv';
const KEY = 'store';

function withTable(mode, run) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(TABLE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(TABLE, mode);
      const request = run(transaction.objectStore(TABLE));
      transaction.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    };
  });
}

export const readDraft = () => withTable('readonly', (table) => table.get(KEY)).catch(() => undefined);
export const saveDraft = (store) => withTable('readwrite', (table) => table.put(store, KEY));
export const clearDraft = () => withTable('readwrite', (table) => table.delete(KEY));

export async function fetchPublished() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/store.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`store.json: ${response.status}`);
  return response.json();
}

export async function loadStore() {
  const [published, draft] = await Promise.all([fetchPublished(), readDraft()]);
  return { store: draft ?? published, isDraft: Boolean(draft) };
}

// Проверка формы файла перед загрузкой в настройках
export function isValidStore(data) {
  return (
    Boolean(data) &&
    ['categories', 'products', 'addons'].every((key) => Array.isArray(data[key])) &&
    data.categories.every((category) => category.id && typeof category.title === 'string') &&
    data.addons.every((addon) => addon.id && typeof addon.price === 'number') &&
    data.products.every(
      (product) =>
        product.id &&
        product.categoryId &&
        Array.isArray(product.addonIds) &&
        Array.isArray(product.variants) &&
        product.variants.length > 0 &&
        product.variants.every((variant) => typeof variant.price === 'number'),
    ) &&
    typeof data.delivery?.price === 'number' &&
    typeof data.delivery?.freeFrom === 'number' &&
    Array.isArray(data.delivery?.zone) &&
    data.delivery.zone.length >= 3 &&
    Array.isArray(data.cafe?.coords)
  );
}

// Фото товара: путь внутри сайта или загруженная владельцем картинка (data:)
export const imageUrl = (image) => (/^(data:|blob:|https?:)/.test(image) ? image : `${import.meta.env.BASE_URL}${image}`);

export const sortedVariants = (product) => [...product.variants].sort((a, b) => (a.size ?? 0) - (b.size ?? 0));

export const productsOf = (store, categoryId) =>
  store.products.filter((product) => product.categoryId === categoryId && !product.hidden);

// Справка «Размер (г)» у категории: все размеры каталога, available — есть ли размер в этой категории.
// У категории без размеров справки нет.
export function sizeLegend(store, categoryId) {
  const sizesOf = (products) => new Set(products.flatMap((product) => product.variants.map((variant) => variant.size)).filter(Boolean));
  const own = sizesOf(productsOf(store, categoryId));
  if (!own.size) return [];
  const all = sizesOf(store.products.filter((product) => !product.hidden));
  return [...all].sort((a, b) => a - b).map((size) => ({ size, available: own.has(size) }));
}
