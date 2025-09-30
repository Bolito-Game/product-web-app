import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const CART_KEY = 'product-web-app-shopping-cart';

  // Sync cartItems with localStorage
  const syncCartWithStorage = () => {
    const stored = localStorage.getItem(CART_KEY);
    const newItems = stored ? stored.split(',').filter(Boolean) : [];
    setCartItems([...newItems]); // Create new array to ensure re-render
  };

  useEffect(() => {
    // Initial load
    syncCartWithStorage();

    // Listen for storage changes from other tabs
    const handleStorage = (event) => {
      if (event.key === CART_KEY) {
        syncCartWithStorage();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateCart = (items) => {
    setCartItems([...items]); // Create new array to ensure re-render
    localStorage.setItem(CART_KEY, items.join(','));
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        updateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;