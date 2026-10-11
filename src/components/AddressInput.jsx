import { useEffect, useRef, useState } from 'react';
import { hasSuggestKey, suggest } from '../utils/ymaps.js';

// Поле адреса с подсказками Яндекса. Без ключа Геосаджеста — обычное поле.
// types — что подсказывать ('street,house' или 'street'); onPick вызывается при выборе подсказки.
export default function AddressInput({ value, onChange, onPick, types, icon, ...input }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  // Текст, по которому подсказки искать не нужно: его только что выбрали из списка
  const picked = useRef('');

  useEffect(() => {
    const text = value.trim();
    if (!hasSuggestKey || text.length < 3 || text === picked.current) {
      setItems([]);
      return undefined;
    }
    let stale = false;
    const timer = setTimeout(() => {
      suggest(text, types).then(
        (list) => {
          if (stale) return;
          setItems(list);
          setCursor(-1);
        },
        () => !stale && setItems([]),
      );
    }, 350);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [value, types]);

  const pick = (item) => {
    picked.current = item.title;
    setOpen(false);
    setItems([]);
    onChange(item.title);
    onPick?.(item.title);
  };

  const onKeyDown = (event) => {
    if (!open || !items.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      // -1 — подсказка не выбрана; со стрелками курсор ходит по кругу через это положение
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setCursor((current) => {
        const next = current + step;
        if (next >= items.length) return -1;
        return next < -1 ? items.length - 1 : next;
      });
    } else if (event.key === 'Enter' && cursor >= 0) {
      event.preventDefault();
      pick(items[cursor]);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  };

  const shown = open && items.length > 0;
  return (
    <div className="field">
      {icon}
      <input
        {...input}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={shown}
        aria-autocomplete="list"
        value={value}
        onChange={(event) => {
          picked.current = '';
          setOpen(true);
          onChange(event.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {shown && (
        <ul className="suggest" role="listbox">
          {items.map((item, index) => (
            // mousedown, а не click: поле не должно потерять фокус раньше выбора
            <li
              key={`${item.title}|${item.subtitle}`}
              role="option"
              aria-selected={index === cursor}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(item);
              }}
            >
              <span>{item.title}</span>
              {item.subtitle && <small>{item.subtitle}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
