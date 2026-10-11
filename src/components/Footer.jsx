import { siTelegram, siVk, siWhatsapp } from 'simple-icons';
import { useStore } from '../hooks/useStore.jsx';
import { Logo } from './Header.jsx';
import { BrandIcon } from './icons.jsx';

const SOCIALS = [
  { key: 'telegram', label: 'Telegram', icon: siTelegram },
  { key: 'vk', label: 'ВКонтакте', icon: siVk },
  { key: 'whatsapp', label: 'WhatsApp', icon: siWhatsapp },
];

const stay = (event) => event.preventDefault();

export default function Footer() {
  const { cafe, socials } = useStore().store;
  return (
    <footer className="footer" id="contacts">
      <div className="container footer__inner">
        <Logo />
        <div className="footer__contacts">
          <a href={`tel:+${cafe.phone.replace(/\D/g, '')}`}>{cafe.phone}</a>
          <a href={`mailto:${cafe.email}`}>{cafe.email}</a>
          <div className="footer__socials">
            {SOCIALS.filter(({ key }) => socials[key]).map(({ key, label, icon }) => (
              <a key={key} href={socials[key]} aria-label={label} target="_blank" rel="noreferrer">
                <BrandIcon icon={icon} />
              </a>
            ))}
          </div>
        </div>
        <div className="footer__legal">
          {/* Текстов документов пока нет — ссылки-заглушки */}
          <a href="#" onClick={stay}>
            Политика конфиденциальности
          </a>
          <a href="#" onClick={stay}>
            Пользовательское соглашение
          </a>
        </div>
      </div>
    </footer>
  );
}
