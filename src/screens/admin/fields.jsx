import { useEffect, useState } from 'react';

export function TextField({ label, value, onChange, multiline = false, ...input }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <label className="afield">
      {label && <span>{label}</span>}
      <Tag value={value} onChange={(event) => onChange(event.target.value)} {...input} />
    </label>
  );
}

// Число в поле хранится строкой: пустое или неверное значение — ошибка ввода, а не ноль.
// onChange вызывается только с верным целым числом.
export function NumberField({ label, value, onChange, ...input }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const parse = (raw) => (/^\d+$/.test(raw.trim()) ? Number(raw) : null);

  return (
    <label className="afield">
      {label && <span>{label}</span>}
      <input
        inputMode="numeric"
        value={text}
        aria-invalid={parse(text) === null}
        onChange={(event) => {
          setText(event.target.value);
          const number = parse(event.target.value);
          if (number !== null) onChange(number);
        }}
        {...input}
      />
    </label>
  );
}

// Удаление в два нажатия: первое спрашивает, второе выполняет; через три секунды вопрос снимается
export function ConfirmButton({ onConfirm, question = 'Удалить?', children, ...button }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      className={`abutton abutton--danger${armed ? ' is-armed' : ''}`}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      {...button}
    >
      {armed ? question : children}
    </button>
  );
}

// Перестановка соседних элементов списка: step −1 — выше, +1 — ниже
export function swapped(list, index, step) {
  const target = index + step;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}`;
