import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const CART_KEY = 'product-web-app-shopping-cart';

  // Sync cartItems with localStorage
  const syncCartWithStorage = () => {
    const stored = localStorage.getItem(CART_KEY);
    console.log('syncCartWithStorage: stored value =', stored); // Debug log
    const newItems = stored ? stored.split(',').filter(Boolean) : [];
    setCartItems([...newItems]); // Create new array to ensure re-render
    console.log('syncCartWithStorage: cartItems set to', newItems); // Debug log
  };

  useEffect(() => {
    // Initial load
    syncCartWithStorage();

    // Listen for storage changes from other tabs
    const handleStorage = (event) => {
      if (event.key === CART_KEY) {
        console.log('Storage event: newValue =', event.newValue); // Debug log
        syncCartWithStorage();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateCart = (items) => {
    console.log('updateCart: new items =', items); // Debug log
    setCartItems([...items]); // Create new array to ensure re-render
    localStorage.setItem(CART_KEY, items.join(','));
    console.log('updateCart: localStorage set to', items.join(',')); // Debug log
  };

  console.log('CartProvider render: cartItems =', cartItems); // Debug log

  return React.createElement(
    CartContext.Provider,
    { value: { cartItems, updateCart } },
    children
  );
};

export default CartProvider;