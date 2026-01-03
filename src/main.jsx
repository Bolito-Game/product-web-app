
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext'; 
import { CategoriesProvider } from './contexts/CategoriesContext'; 

import ErrorBoundary from './components/ErrorBoundary';
import App from './App.jsx';
import './styles/main.css';
import './i18n.js'

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('categories')) {
    console.warn('Categories sync error (non-critical):', event.reason);
    event.preventDefault(); // Prevent unhandled rejection warning
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary> 
        <NotificationProvider>
          <CartProvider>
            <CategoriesProvider>
              <App />
            </CategoriesProvider>
          </CartProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);