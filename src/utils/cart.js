// Строка корзины: { productId, size, addonIds, qty, at }.
// size — граммы или null у товара с одной ценой; at — порядковая метка последнего добавления.

export const lineKey = ({ productId, size, addonIds }) => `${productId}|${size ?? ''}|${[...addonIds].sort().join(',')}`;

export function addLine(lines, item, qty = 1) {
  const key = lineKey(item);
  const at = lines.reduce((max, line) => Math.max(max, line.at), 0) + 1;
  if (lines.some((line) => lineKey(line) === key)) {
    return lines.map((line) => (lineKey(line) === key ? { ...line, qty: line.qty + qty, at } : line));
  }
  return [...lines, { productId: item.productId, size: item.size ?? null, addonIds: [...item.addonIds].sort(), qty, at }];
}

export function setLineQty(lines, key, qty) {
  if (qty <= 0) return lines.filter((line) => lineKey(line) !== key);
  return lines.map((line) => (lineKey(line) === key ? { ...line, qty } : line));
}

// «−» на карточке товара: уменьшает тот его вариант, что добавлен последним
export function removeLast(lines, productId) {
  const [last] = lines.filter((line) => line.productId === productId).sort((a, b) => b.at - a.at);
  return last ? setLineQty(lines, lineKey(last), last.qty - 1) : lines;
}

export const deliveryPrice = (subtotal, { price, freeFrom }) => (subtotal > 0 && subtotal < freeFrom ? price : 0);

// Сводка корзины по текущим данным сайта. Строки, которым в данных больше нет товара,
// размера или допа, в сводку не попадают.
export function summarize(lines, store) {
  const items = [];
  for (const line of lines) {
    const product = store.products.find((candidate) => candidate.id === line.productId && !candidate.hidden);
    const variant = product?.variants.find((candidate) => (candidate.size ?? null) === line.size);
    const addons = line.addonIds.map((id) => product?.addonIds.includes(id) && store.addons.find((addon) => addon.id === id));
    if (!variant || addons.some((addon) => !addon)) continue;
    // В подписи допы идут в том же порядке, что и в окне покупки
    addons.sort((a, b) => store.addons.indexOf(a) - store.addons.indexOf(b));
    const unit = variant.price + addons.reduce((sum, addon) => sum + addon.price, 0);
    items.push({
      key: lineKey(line),
      line,
      product,
      title: variant.size ? `${product.name} - ${variant.size} г` : product.name,
      addonsText: addons.length ? `+ ${addons.map((addon) => addon.name.toLowerCase()).join(', ')}` : '',
      unit,
      total: unit * line.qty,
    });
  }
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const delivery = deliveryPrice(subtotal, store.delivery);
  return {
    items,
    count: items.reduce((sum, item) => sum + item.line.qty, 0),
    subtotal,
    delivery,
    total: subtotal + delivery,
    // Сколько не хватает до минимальной суммы заказа; пока не ноль, оформить заказ нельзя
    missing: Math.max(0, store.delivery.minOrder - subtotal),
  };
}

export const countOf = (summary, productId) =>
  summary.items.reduce((sum, item) => (item.product.id === productId ? sum + item.line.qty : sum), 0);
