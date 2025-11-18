// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';

const Header = () => {
  const { cartItems } = useContext(CartContext);
  const count = cartItems.length > 0 ? String(cartItems.length) : '+';
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDetailPage = location.pathname.startsWith('/product/') || location.pathname.startsWith('/order-view');

  return (
    <>
      <header className="app-header">
        {/* Logo → Home */}
        <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/assets/icons/product-showcase.svg" alt="Product Showcase" />
        </div>

        {/* Cart */}
        <div className="header-cart" onClick={() => navigate('/shopping-cart')}>
          <img src="/assets/icons/cart.svg" />
          {/* This span now looks 100% like it's part of the SVG */}
          <span className="cart-badge">
            {cartItems.length === 0 ? '+' : cartItems.length > 99 ? '99+' : cartItems.length}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          {isDetailPage ? (
            <a onClick={() => navigate(-1)} className="nav-back-button" aria-label="Go Back">
              <img src="/assets/icons/back-arrow.svg" alt="<- Back" />
            </a>
          ) : (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end><img src="/assets/icons/all-products.svg" alt="All Products" /></NavLink>
              <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><img src="/assets/icons/categories.svg" alt="By Categories" /></NavLink>
              <NavLink to="/my-orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><img src="/assets/icons/my-orders.svg" alt="My Orders" /></NavLink>
            </>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
          <img src="/assets/icons/hamburger.svg" />
        </button>
      </header>

      {/* Mobile Menu – Smooth Slide-In */}
      <div className={`mobile-menu-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
        <nav className="mobile-menu">
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <img src="/assets/icons/cross.svg" />
          </button>

          {isDetailPage ? (
            <a onClick={() => { navigate(-1); setMobileMenuOpen(false); }} className="mobile-menu-item">
              <img src="/assets/icons/back-arrow.svg" alt="<- Back" />
            </a>
          ) : (
            <>
              <NavLink to="/" className="mobile-menu-item" onClick={() => setMobileMenuOpen(false)} end><img src="/assets/icons/all-products.svg" alt="All Products" /></NavLink>
              <NavLink to="/categories" className="mobile-menu-item" onClick={() => setMobileMenuOpen(false)}><img src="/assets/icons/categories.svg" alt="By Categories" /></NavLink>
              <NavLink to="/my-orders" className="mobile-menu-item" onClick={() => setMobileMenuOpen(false)}><img src="/assets/icons/my-orders.svg" alt="My Orders" /></NavLink>
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Header;