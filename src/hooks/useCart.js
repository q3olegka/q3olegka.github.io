import { useMemo, useSyncExternalStore } from 'react';
import { addLine, removeLast, setLineQty, summarize } from '../utils/cart.js';
import { useStore } from './useStore.jsx';

// Корзина живёт в localStorage и общая для главной и страницы оформления
const KEY = 'coffee-mall:cart';
const listeners = new Set();

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter((line) => typeof line?.productId === 'string' && Array.isArray(line.addonIds) && line.qty > 0);
  } catch {
    return [];
  }
}

let lines = read();

const notify = () => listeners.forEach((listener) => listener());

function commit(next) {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // хранилище недоступно — корзина доживёт до закрытия вкладки
  }
  notify();
}

function reload() {
  lines = read();
  notify();
}

// Корзину изменила другая вкладка или страница вернулась из кэша «назад-вперёд»
window.addEventListener('storage', (event) => event.key === KEY && reload());
window.addEventListener('pageshow', (event) => event.persisted && reload());

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const cart = {
  add: (item, qty) => commit(addLine(lines, item, qty)),
  setQty: (key, qty) => commit(setLineQty(lines, key, qty)),
  removeLast: (productId) => commit(removeLast(lines, productId)),
  clear: () => commit([]),
};

// Сводка корзины по текущим данным сайта: строки с ценами, количество, суммы
export function useCart() {
  const { store } = useStore();
  const current = useSyncExternalStore(subscribe, () => lines);
  return useMemo(() => summarize(current, store), [current, store]);
}
