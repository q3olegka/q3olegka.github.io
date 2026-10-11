import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clearDraft, fetchPublished, loadStore, saveDraft } from '../utils/store.js';

const StoreContext = createContext(null);

// Раздаёт данные сайта. save — правка владельца: сразу в состояние, в IndexedDB — с задержкой,
// чтобы не писать фото в базу на каждое нажатие клавиши.
export function StoreProvider({ children }) {
  const [state, setState] = useState(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    loadStore().then(setState, () => setFailed(true));
  }, []);

  const save = useCallback((store) => {
    setState({ store, isDraft: true });
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDraft(store).then(
        () => setSaving(false),
        () => setFailed(true),
      );
    }, 250);
  }, []);

  const reset = useCallback(async () => {
    clearTimeout(timer.current);
    await clearDraft();
    setState({ store: await fetchPublished(), isDraft: false });
    setSaving(false);
  }, []);

  if (failed) return <p className="boot-error">Не удалось загрузить или сохранить данные сайта. Обновите страницу.</p>;
  if (!state) return null;
  return <StoreContext.Provider value={{ ...state, saving, save, reset }}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
