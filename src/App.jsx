import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Hooks
import useResponsive from './hooks/useResponsive';

// Import Components
import Header from './components/Header';
import AdComponent from './components/AdComponent';

// Import Pages
import AllProductsPage from './pages/AllProductsPage';
import CategoriesPage from './pages/CategoriesPage';

function App() {
  const { isMobile } = useResponsive();

  // The <BrowserRouter> wrapper is now removed from this return statement
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {/* --- Desktop Layout --- */}
        {!isMobile && (
          <>
            <div className="desktop-ad left-ad"><AdComponent /></div>
            <div className="page-content-area">
              <Routes>
                <Route path="/" element={<AllProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
              </Routes>
            </div>
            <div className="desktop-ad right-ad"><AdComponent /></div>
          </>
        )}

        {/* --- Mobile Layout --- */}
        {isMobile && (
          <div className="page-content-area">
            <Routes>
              <Route path="/" element={<AllProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
            </Routes>
          </div>
        )}
      </main>

      {/* --- Floating Ad for Mobile --- */}
      {isMobile && <AdComponent />}
    </div>
  );
}

export default App;