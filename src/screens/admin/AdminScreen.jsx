import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '../../components/Header.jsx';
import { useStore } from '../../hooks/useStore.jsx';
import AddonsTab from './AddonsTab.jsx';
import CategoriesTab from './CategoriesTab.jsx';
import ContactsTab from './ContactsTab.jsx';
import DataTab from './DataTab.jsx';
import DeliveryTab from './DeliveryTab.jsx';
import ProductsTab from './ProductsTab.jsx';

const TABS = [
  { id: 'products', label: 'Товары', Tab: ProductsTab },
  { id: 'categories', label: 'Категории', Tab: CategoriesTab },
  { id: 'addons', label: 'Допы', Tab: AddonsTab },
  { id: 'delivery', label: 'Доставка', Tab: DeliveryTab },
  { id: 'contacts', label: 'Контакты', Tab: ContactsTab },
  { id: 'data', label: 'Данные', Tab: DataTab },
];

// Настройка сайта владельцем. Каждая правка сразу попадает в данные сайта этого браузера;
// вкладка получает store и update(change), где change(данные) возвращает новые данные.
export default function AdminScreen() {
  const { store, isDraft, saving, save } = useStore();
  const [tab, setTab] = useState('products');
  const { Tab } = TABS.find((item) => item.id === tab);
  const update = (change) => save(change(store));

  let status = 'Опубликованная версия, правок нет';
  if (saving) status = 'Сохраняем…';
  else if (isDraft) status = 'Правки сохранены в этом браузере';

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="container admin__bar-inner">
          <Logo />
          <span className="admin__status" role="status">
            {status}
          </span>
          <a className="abutton" href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer">
            Открыть сайт <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      </header>
      <div className="container">
        <nav className="admin__tabs" aria-label="Разделы настройки">
          {TABS.map(({ id, label }) => (
            <button key={id} type="button" aria-current={id === tab} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <main className="admin__main">
          <Tab store={store} update={update} />
        </main>
      </div>
    </div>
  );
}
