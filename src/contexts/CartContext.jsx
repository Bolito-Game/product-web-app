import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

// A constant for the local storage key to avoid typos.
const CART_KEY = 'product-web-app-shopping-cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Sync cartItems with localStorage
  const syncCartWithStorage = () => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      // Parse the JSON string from storage, or default to an empty array
      const newItems = stored ? JSON.parse(stored) : [];
      setCartItems(newItems);
    } catch (error) {
      console.error("Failed to parse cart items from localStorage", error);
      setCartItems([]); // Reset to empty array on parsing error
    }
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
    localStorage.setItem(CART_KEY, JSON.stringify(items));
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