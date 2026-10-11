import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../hooks/useStore.jsx';
import { isValidStore, withDefaults } from '../../utils/store.js';
import { ConfirmButton } from './fields.jsx';

export default function DataTab({ store, update }) {
  const { isDraft, reset } = useStore();
  const [message, setMessage] = useState('');

  const download = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }));
    link.download = 'store.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const upload = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isValidStore(data)) throw new Error('shape');
      update(() => withDefaults(data));
      setMessage('Файл загружен: данные сайта заменены.');
    } catch {
      setMessage('Этот файл не подходит: нужен store.json, скачанный с этой страницы.');
    }
  };

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Данные сайта</h2>
      </header>
      <p className="panel__note">
        Сервера у сайта пока нет, поэтому правки хранятся в этом браузере и видны только на этом устройстве. Чтобы их увидели
        все посетители, скачайте файл и передайте разработчику: он заменит им <code>public/data/store.json</code> и опубликует
        сайт заново. Загруженные фото лежат внутри файла.
      </p>
      <div className="panel__buttons">
        <button type="button" className="abutton" onClick={download}>
          <Download size={16} aria-hidden="true" /> Скачать store.json
        </button>
        <label className="abutton">
          <Upload size={16} aria-hidden="true" /> Загрузить store.json
          <input type="file" accept="application/json,.json" hidden onChange={upload} />
        </label>
        <ConfirmButton
          disabled={!isDraft}
          question="Стереть правки?"
          onConfirm={() => reset().then(() => setMessage('Правки стёрты: сайт показывает опубликованную версию.'))}
        >
          Сбросить к опубликованной версии
        </ConfirmButton>
      </div>
      {message && (
        <p className="panel__message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
