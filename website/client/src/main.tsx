// Qlobal stil ən əvvəl yüklənməlidir ki, komponent CSS modulları (məs. footer/panel padding) onu əvəz edə bilsin.
import './styles/global.css';
import './styles/page-enter.css'; // səhifəyə giriş animasiyası — bəyənməsək bu sətri silmək kifayətdir
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { playLanguageEnter } from './components/LanguageSwitch';
import { ToastProvider } from './components/Toast';
import { currentLanguage } from './i18n';
import { router } from './routes';

document.documentElement.lang = currentLanguage();
playLanguageEnter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
