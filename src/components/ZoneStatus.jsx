// Итог проверки адреса одной строкой. strict — страница оформления: там адрес уже с домом,
// и вместо «уточните дом» говорим, что проверили по улице.
export default function ZoneStatus({ zone, strict = false }) {
  const { status, precise } = zone;
  if (status === 'idle') return null;

  let tone = 'muted';
  let text = 'Проверяем адрес…';
  if (status === 'in' && (precise || strict)) {
    tone = 'ok';
    text = precise ? 'Доставим по этому адресу' : 'Дом на карте не нашли, проверили по улице — она в зоне доставки';
  } else if (status === 'out' && (precise || strict)) {
    tone = 'bad';
    text = 'Сюда пока не доставляем';
  } else if (status === 'in' || status === 'out') {
    text = 'Уточните номер дома';
  } else if (status === 'notfound') {
    tone = 'bad';
    text = strict ? 'Адрес не найден — проверьте улицу и дом' : 'Адрес не найден';
  } else if (status === 'unavailable') {
    text = strict ? 'Не удалось проверить адрес — его уточнит оператор' : 'Проверка адреса сейчас недоступна';
  }

  return (
    <p className={`zone-status zone-status--${tone}`} role="status">
      {text}
    </p>
  );
}
