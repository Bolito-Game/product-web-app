import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Hooks
import useResponsive from './hooks/useResponsive';

// Import NotificationContext
import { NotificationContext } from './contexts/NotificationContext'; 

// Import Components
import Header from './components/Header';
import Notification from './components/Notification';

// Import Pages
import AllProductsPage from './pages/AllProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ShoppingCartPage from './pages/ShoppingCartPage';

function App() {
  const { isMobile } = useResponsive();
  // Get notification state and handlers from NotificationContext
  const { notificationMessage, hideNotification } = useContext(NotificationContext); 

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {/* Render Notification component if there's a message */}
        {notificationMessage && (
          <Notification message={notificationMessage} onClose={hideNotification} />
        )}

        {/* --- Desktop Layout --- */}
        {!isMobile && (
          <>
            <div className="page-content-area">
              <Routes>
                <Route path="/" element={<AllProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/product/:sku" element={<ProductDetailPage />} />
                <Route path="/shopping-cart" element={<ShoppingCartPage />} />
              </Routes>
            </div>
          </>
        )}

        {/* --- Mobile Layout --- */}
        {isMobile && (
          <div className="page-content-area">
            <Routes>
              <Route path="/" element={<AllProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/product/:sku" element={<ProductDetailPage />} />
              <Route path="/shopping-cart" element={<ShoppingCartPage />} />
            </Routes>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;