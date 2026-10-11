import '@fontsource/inter/500.css';
import '@fontsource/akatab/600.css';
import './styles/tokens.css';
import './styles/site.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './hooks/useStore.jsx';
import OrderScreen from './screens/OrderScreen.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <OrderScreen />
    </StoreProvider>
  </StrictMode>,
);
