import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="app-header">
      <h1>Product Showcase</h1>
      <nav>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
          All Products
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
          By Category
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;