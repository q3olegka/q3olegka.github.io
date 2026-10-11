// «1 000 Р» — как в макете: разряды через неразрывный пробел, знак — буква «Р»
export function formatPrice(value) {
  return `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Р`;
}

// Десять цифр номера после +7; ведущие 7 и 8 считаются кодом страны
export function phoneDigits(input) {
  let digits = String(input).replace(/\D/g, '');
  if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
  return digits.slice(0, 10);
}

// Разделитель ставится только перед следующей группой цифр — иначе Backspace упирался бы в скобку
function formatDigits(digits) {
  let text = `+7 (${digits.slice(0, 3)}`;
  if (digits.length > 3) text += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) text += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) text += `-${digits.slice(8, 10)}`;
  return text;
}

// Значение поля телефона после правки: previous — что было в поле, raw — что ввёл пользователь
export function nextPhone(previous, raw) {
  const deleting = raw.length < previous.length;
  let digits = phoneDigits(raw);
  if (deleting && digits === phoneDigits(previous)) digits = digits.slice(0, -1);
  if (digits) return formatDigits(digits);
  return deleting || !/\d/.test(raw) ? '' : '+7 (';
}

export const isPhoneComplete = (value) => phoneDigits(value).length === 10;
