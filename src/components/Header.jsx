import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on a product detail page
  const isProductDetailPage = location.pathname.startsWith('/product/');

  return (
    <header className="app-header">
      <h1>Product Showcase</h1>
      <nav>
        {isProductDetailPage ? (
          // Show Back button on product detail page
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
            ← Back
          </a>
        ) : (
          // Show regular navigation on other pages
          <>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
              All Products
            </NavLink>
            <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
              By Category
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;