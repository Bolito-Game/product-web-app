import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

  return (
    <BrowserRouter>
      {/* The main container for the entire application layout */}
      <div className="app-layout">
        <Header />
        
        {/* The main content area that adapts to the device type */}
        <main className="main-content">
          {/* --- Desktop Layout (with side ads) --- */}
          {!isMobile && (
            <>
              {/* Left Ad Column */}
              <div className="desktop-ad left-ad">
                <AdComponent />
              </div>

              {/* Center Content Column */}
              <div className="page-content-area">
                <Routes>
                  <Route path="/" element={<AllProductsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                </Routes>
              </div>

              {/* Right Ad Column */}
              <div className="desktop-ad right-ad">
                <AdComponent />
              </div>
            </>
          )}

          {/* --- Mobile Layout (content only, ad is fixed at bottom) --- */}
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
        {/* This is rendered outside of 'main' to allow for fixed positioning */}
        {isMobile && <AdComponent />}
      </div>
    </BrowserRouter>
  );
}

export default App;