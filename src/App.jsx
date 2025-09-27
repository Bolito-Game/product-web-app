import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Hooks
import useResponsive from './hooks/useResponsive';

// Import Components
import Header from './components/Header';

// Import Pages
import AllProductsPage from './pages/AllProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  const { isMobile } = useResponsive();

  return (
    <div className="app-layout">
      <Header />  {/* Always show header */}
      <main className="main-content">
        {/* --- Desktop Layout --- */}
        {!isMobile && (
          <>
            <div className="page-content-area">
              <Routes>
                <Route path="/" element={<AllProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/product/:sku" element={<ProductDetailPage />} />
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
            </Routes>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;