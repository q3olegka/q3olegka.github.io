import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { addLine, countOf, deliveryPrice, lineKey, removeLast, setLineQty, summarize } from './cart.js';
import { isValidStore, sizeLegend, withDefaults } from './store.js';
import { testStore as store } from './test-store.js';

const published = JSON.parse(readFileSync(new URL('../../public/data/store.json', import.meta.url), 'utf8'));

const chocolate = (size, addonIds = []) => ({ productId: 'hot-chocolate', size, addonIds });

test('ключ варианта не зависит от порядка допов', () => {
  assert.equal(lineKey(chocolate(250, ['syrup', 'marshmallow'])), lineKey(chocolate(250, ['marshmallow', 'syrup'])));
  assert.notEqual(lineKey(chocolate(250)), lineKey(chocolate(350)));
  assert.notEqual(lineKey(chocolate(250)), lineKey(chocolate(250, ['syrup'])));
});

test('одинаковый вариант складывается в одну строку, другой — в новую', () => {
  let lines = addLine([], chocolate(250, ['syrup']));
  lines = addLine(lines, chocolate(250, ['syrup']), 2);
  lines = addLine(lines, chocolate(350));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].qty, 3);
  assert.equal(lines[1].qty, 1);
});

test('корзина из макета: 200 + 400 = 600, доставка 100, итого 700', () => {
  let lines = addLine([], chocolate(250, ['syrup']));
  lines = addLine(lines, chocolate(350), 2);
  const summary = summarize(lines, store);
  assert.deepEqual(
    summary.items.map((item) => [item.title, item.addonsText, item.total]),
    [
      ['Горячий шоколад - 250 г', '+ сироп', 200],
      ['Горячий шоколад - 350 г', '', 400],
    ],
  );
  assert.equal(summary.count, 3);
  assert.equal(summary.subtotal, 600);
  assert.equal(summary.delivery, 100);
  assert.equal(summary.total, 700);
  assert.equal(countOf(summary, 'hot-chocolate'), 3);
  assert.equal(countOf(summary, 'latte'), 0);
});

test('доставка: платная до порога, бесплатная с порога, ноль у пустой корзины', () => {
  const rules = { price: 100, freeFrom: 1000 };
  assert.equal(deliveryPrice(0, rules), 0);
  assert.equal(deliveryPrice(999, rules), 100);
  assert.equal(deliveryPrice(1000, rules), 0);
});

test('«−» на карточке уменьшает вариант, добавленный последним', () => {
  let lines = addLine([], chocolate(250));
  lines = addLine(lines, chocolate(350));
  lines = addLine(lines, { productId: 'latte', size: 250, addonIds: [] });
  lines = addLine(lines, chocolate(250));
  lines = removeLast(lines, 'hot-chocolate');
  assert.deepEqual(
    lines.map((line) => [line.productId, line.size, line.qty]),
    [
      ['hot-chocolate', 250, 1],
      ['hot-chocolate', 350, 1],
      ['latte', 250, 1],
    ],
  );
  // последним добавлялся размер 250 — он и уходит целиком, 350 остаётся
  lines = removeLast(lines, 'hot-chocolate');
  assert.deepEqual(
    lines.map((line) => [line.productId, line.size]),
    [
      ['hot-chocolate', 350],
      ['latte', 250],
    ],
  );
  assert.equal(removeLast(lines, 'tea'), lines);
});

test('количество ноль убирает строку', () => {
  const lines = addLine([], chocolate(250));
  assert.deepEqual(setLineQty(lines, lineKey(chocolate(250)), 0), []);
  assert.equal(setLineQty(lines, lineKey(chocolate(250)), 5)[0].qty, 5);
});

test('строка без товара, размера или допа в сводку не попадает', () => {
  const lines = [
    { productId: 'gone', size: 250, addonIds: [], qty: 1, at: 1 },
    { productId: 'latte', size: 999, addonIds: [], qty: 1, at: 2 },
    { productId: 'latte', size: 250, addonIds: ['syrup'], qty: 1, at: 3 },
    { productId: 'latte', size: 250, addonIds: [], qty: 2, at: 4 },
  ];
  const summary = summarize(lines, store);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.subtotal, 420);
});

test('минимальная сумма заказа: сколько не хватает', () => {
  const withMinimum = { ...store, delivery: { ...store.delivery, minOrder: 500 } };
  const latte = (qty) => [{ productId: 'latte', size: 250, addonIds: [], qty, at: 1 }];
  assert.equal(summarize(latte(2), store).missing, 0);
  assert.equal(summarize(latte(2), withMinimum).missing, 80);
  assert.equal(summarize(latte(3), withMinimum).missing, 0);
  assert.equal(summarize([], withMinimum).missing, 500);
});

test('проверка формы данных', () => {
  assert.equal(isValidStore(store), true);
  assert.equal(isValidStore({ ...store, products: [{ id: 'x' }] }), false);
  assert.equal(isValidStore(null), false);
});

// Единственная проверка самого опубликованного файла: его правит владелец, и сломанный файл не должен уйти на сайт
test('опубликованный store.json проходит проверку формы', () => {
  assert.equal(isValidStore(published), true);
});

test('файл без минимальной суммы подходит и получает ноль, с нечисловой — нет', () => {
  const { minOrder, ...delivery } = store.delivery;
  assert.equal(isValidStore({ ...store, delivery }), true);
  assert.equal(withDefaults({ ...store, delivery }).delivery.minOrder, 0);
  assert.equal(withDefaults({ ...store, delivery: { ...delivery, minOrder: 300 } }).delivery.minOrder, 300);
  assert.equal(isValidStore({ ...store, delivery: { ...delivery, minOrder: '300' } }), false);
});

test('справка о размерах: только размеры самой категории', () => {
  assert.deepEqual(sizeLegend(store, 'classic'), [250, 350, 450]);
  assert.deepEqual(sizeLegend(store, 'dessert'), [350, 450]);
  assert.deepEqual(sizeLegend(store, 'нет такой'), []);
});
