import { TextField } from './fields.jsx';

const SOCIALS = [
  ['telegram', 'Telegram'],
  ['vk', 'ВКонтакте'],
  ['whatsapp', 'WhatsApp'],
];

export default function ContactsTab({ store, update }) {
  const setCafe = (change) => update((data) => ({ ...data, cafe: { ...data.cafe, ...change } }));
  const setSocial = (key, url) => update((data) => ({ ...data, socials: { ...data.socials, [key]: url } }));

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Контакты</h2>
      </header>
      <p className="panel__note">Показываются в подвале сайта. Соцсеть без ссылки на сайте не показывается.</p>
      <div className="form-grid">
        <TextField label="Телефон" type="tel" value={store.cafe.phone} onChange={(phone) => setCafe({ phone })} />
        <TextField label="Почта" type="email" value={store.cafe.email} onChange={(email) => setCafe({ email })} />
        {SOCIALS.map(([key, label]) => (
          <TextField
            key={key}
            label={`${label}, ссылка`}
            placeholder="https://"
            value={store.socials[key] ?? ''}
            onChange={(url) => setSocial(key, url.trim())}
          />
        ))}
      </div>
    </section>
  );
}
