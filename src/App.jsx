import React, { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Hooks
import useResponsive from './hooks/useResponsive';
import { useLanguageCategories } from './hooks/useLanguageCategories';

// Import NotificationContext
import { NotificationContext } from './contexts/NotificationContext'; 

// Import Categories initialization
import { initializeCategories } from './app/initialize.js';

// Import Components
import Header from './components/Header';
import Notification from './components/Notification';

// Import Pages
import AllProductsPage from './pages/AllProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ShoppingCartPage from './pages/ShoppingCartPage';
import ProductsCheckoutPage from './pages/ProductsCheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderViewPage from './pages/OrderViewPage';

function App() {
  const { isMobile } = useResponsive();
  const { notificationMessage, hideNotification } = useContext(NotificationContext);
 
  // ✅ SINGLE HOOK - Handles everything
  const {
    categories: currentCategories,
    loading: categoriesLoading,
    error: categoriesError,
    language: currentLanguage,
    loadedLanguages,
    reload: reloadCategories
  } = useLanguageCategories();
 
  // ✅ Initialize ONCE on mount
  useEffect(() => {
    let isMounted = true;

    const initCategories = async () => {
      try {
        console.log('🚀 Initializing categories system...');
        await initializeCategories();
        
        if (isMounted) {
          console.log('✅ Categories system initialized');
        }
      } catch (error) {
        console.error('❌ Failed to initialize categories:', error);
        if (isMounted) {
          console.warn('⚠️ Categories will be fetched on-demand');
        }
      }
    };

    initCategories();
    return () => { isMounted = false; };
  }, []); // ✅ EMPTY DEPENDENCIES - NO INFINITE LOOP

  // ✅ Log language changes (stable)
  useEffect(() => {
    if (currentLanguage) {
      console.log(`🌐 Language: ${currentLanguage} | Loaded: [${loadedLanguages.join(', ')}]`);
    }
  }, [currentLanguage, loadedLanguages]);

  return (
    <div className="app-layout" dir={currentLanguage === 'ar' || currentLanguage === 'he' ? 'rtl' : 'ltr'}>
      <Header
        currentLanguage={currentLanguage}
        categories={currentCategories}
        onLanguageChange={reloadCategories}
      />
     
      <main className="main-content">
        {notificationMessage && (
          <Notification message={notificationMessage} onClose={hideNotification} />
        )}

        {/* ✅ Debug Panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="categories-debug" style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px'
          }}>
            <div><strong>🌐 Categories</strong></div>
            <div>Language: <span style={{color: '#4CAF50'}}>{currentLanguage}</span></div>
            <div>Loaded: <span style={{color: '#2196F3'}}>{loadedLanguages.join(', ')}</span></div>
            <div>Count: <span style={{color: '#FF9800'}}>{currentCategories?.items?.length || 0}</span></div>
            <div>Status: <span style={{color: categoriesLoading ? '#FF5722' : '#4CAF50'}}>
              {categoriesLoading ? '🔄 Loading...' : '✅ Ready'}
            </span></div>
          </div>
        )}

        {/* Routes with categories props */}
        <div className="page-content-area">
          <Routes>
            <Route path="/" element={
              <AllProductsPage
                categories={currentCategories}
                categoriesLoading={categoriesLoading}
              />
            } />
            <Route path="/categories" element={
              <CategoriesPage
                categories={currentCategories}
                categoriesLoading={categoriesLoading}
              />
            } />
            <Route path="/product/:sku" element={<ProductDetailPage />} />
            <Route path="/shopping-cart" element={<ShoppingCartPage />} />
            <Route path="/checkout" element={<ProductsCheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/order-view" element={<OrderViewPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;