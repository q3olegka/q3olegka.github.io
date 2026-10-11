import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPrice, isPhoneComplete, nextPhone } from './format.js';
import { pointInPolygon } from './geo.js';
import { testStore as store } from './test-store.js';

test('цена: разряды и знак', () => {
  assert.equal(formatPrice(150), '150 Р');
  assert.equal(formatPrice(1000), '1 000 Р');
  assert.equal(formatPrice(1234567), '1 234 567 Р');
});

const type = (keys, start = '') => [...keys].reduce((value, key) => nextPhone(value, value + key), start);

test('телефон: набор по цифре', () => {
  assert.equal(type('9'), '+7 (9');
  assert.equal(type('950'), '+7 (950');
  assert.equal(type('9506'), '+7 (950) 6');
  assert.equal(type('9506252144'), '+7 (950) 625-21-44');
  assert.equal(type('95062521449999'), '+7 (950) 625-21-44');
});

test('телефон: первая 8 или 7 — код страны, дальше набирается номер', () => {
  assert.equal(type('8'), '+7 (');
  assert.equal(type('89506252144'), '+7 (950) 625-21-44');
  assert.equal(type('7'), '+7 (');
  assert.equal(type('88001234567'), '+7 (800) 123-45-67');
});

test('телефон: вставка номера целиком', () => {
  assert.equal(nextPhone('', '+7 950 625 21 44'), '+7 (950) 625-21-44');
  assert.equal(nextPhone('', '8 (950) 625-21-44'), '+7 (950) 625-21-44');
  assert.equal(nextPhone('', '9506252144'), '+7 (950) 625-21-44');
});

test('телефон: Backspace стирает до пустого поля', () => {
  let value = '+7 (950) 625-21-44';
  const seen = [];
  while (value) {
    value = nextPhone(value, value.slice(0, -1));
    seen.push(value);
  }
  assert.equal(seen.at(-1), '');
  assert.equal(new Set(seen).size, seen.length);
  assert.equal(nextPhone('+7 (', '+7 '), '');
});

test('телефон: полный номер — десять цифр', () => {
  assert.equal(isPhoneComplete('+7 (950) 625-21-44'), true);
  assert.equal(isPhoneComplete('+7 (950) 625-21-4'), false);
  assert.equal(isPhoneComplete(''), false);
});

test('точка в многоугольнике', () => {
  const square = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  assert.equal(pointInPolygon([5, 5], square), true);
  assert.equal(pointInPolygon([15, 5], square), false);
  assert.equal(pointInPolygon([5, -1], square), false);
  const notch = [
    [0, 0],
    [10, 0],
    [10, 10],
    [5, 3],
    [0, 10],
  ];
  assert.equal(pointInPolygon([5, 2], notch), true);
  assert.equal(pointInPolygon([5, 8], notch), false);
});

test('зона вокруг Мещерского озера: кофейня внутри, верхняя часть города снаружи', () => {
  const { zone } = store.delivery;
  assert.equal(pointInPolygon(store.cafe.coords, zone), true);
  assert.equal(pointInPolygon([44.07, 56.32], zone), false);
});
