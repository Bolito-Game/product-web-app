// src/components/Header.jsx
import React, { useContext, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';

const Header = () => {
  const { cartItems } = useContext(CartContext);
  const count = cartItems.length > 0 ? String(cartItems.length) : '+'; 
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Header useEffect: cartItems =', cartItems, 'count =', count);
  }, [cartItems]);

  return React.createElement(
    'header',
    { className: 'app-header' },
    
    React.createElement(
      'div',
      { className: 'header-left' },
      React.createElement('h1', null, 'Product Showcase')
    ),

    React.createElement(
      'div',
      { 
        className: 'cart-wrapper', 
        onClick: () => navigate('/shopping-cart'), 
        style: { cursor: 'pointer' } 
      },
      React.createElement(
        'svg',
        {
          viewBox: '0 0 24 24',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          width: '32',
          height: '32'
        },
        React.createElement('path', {
          d: 'M6.01 16.136L4.141 4H3a1 1 0 0 1 0-2h1.985a.993.993 0 0 1 .66.235.997.997 0 0 1 .346.627L6.319 5H14v2H6.627l1.23 8h9.399l1.5-5h2.088l-1.886 6.287A1 1 0 0 1 18 17H7.016a.993.993 0 0 1-.675-.248.999.999 0 0 1-.332-.616zM10 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm9 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0-18a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0V6h-1a1 1 0 1 1 0-2h1V3a1 1 0 0 1 1-1z',
          fill: '#0D0D0D'
        }),
        React.createElement(
          'text',
          {
            x: '19',
            y: '7',
            fontSize: '6',
            fontFamily: 'Arial, sans-serif',
            textAnchor: 'middle',
            fill: 'red',
            fontWeight: 'bold'
          },
          count
        )
      ),
      React.createElement(
        'span',
        { className: 'cart-count', style: { color: 'red', fontWeight: 'bold', marginLeft: '5px' } },
        count
      )
    ),

    React.createElement(
      'nav',
      null,
      location.pathname.startsWith('/product/') || location.pathname.startsWith('/order-view') ?
        React.createElement(
          'a',
          { href: '#', onClick: (e) => { e.preventDefault(); navigate(-1); } },
          '← Back'
        ) :
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            NavLink,
            { to: '/', className: ({ isActive }) => (isActive ? 'active' : '') },
            'All Products'
          ),
          React.createElement(
            NavLink,
            { to: '/categories', className: ({ isActive }) => (isActive ? 'active' : '') },
            'By Category'
          ),
          React.createElement(
            NavLink,
            { to: '/my-orders', className: ({ isActive }) => (isActive ? 'active' : '') },
            'My Orders'
          )
        )
    )
  );
};

export default Header;