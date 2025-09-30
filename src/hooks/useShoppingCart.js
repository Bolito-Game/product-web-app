import { useState, useEffect, useCallback, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { NotificationContext } from '../contexts/NotificationContext'; // Import NotificationContext

// A constant for the local storage key to avoid typos.
const CART_KEY = 'product-web-app-shopping-cart';

/**
 * Custom hook to manage shopping cart state and actions.
 * @param {string} sku - The SKU of the product on the current page.
 * @param {object} product - The full product data object from the API.
 * @returns {{isInCart: boolean, handleToggleCart: function}}
 */
export const useShoppingCart = (sku, product) => {
  // Destructure cart items and update function from CartContext
  const { cartItems = [], updateCart } = useContext(CartContext);
  // Destructure showNotification from NotificationContext
  const { showNotification } = useContext(NotificationContext);

  const [isInCart, setIsInCart] = useState(() => cartItems.includes(sku));

  useEffect(() => {
    setIsInCart(cartItems.includes(sku));
  }, [sku, cartItems]);

  const handleToggleCart = useCallback(() => {
    if (!sku) {
      // If SKU is not available, we can't perform cart operations.
      return;
    }

    const isCurrentlyInCart = cartItems.includes(sku);

    if (isCurrentlyInCart) {
      // --- REMOVE FROM CART ---
      const updatedSkus = cartItems.filter(itemSku => itemSku !== sku);
      updateCart(updatedSkus); // Update the list of SKUs in CartContext and localStorage (CART_KEY)
      localStorage.removeItem(sku); // REMOVED: Remove the full product details from localStorage by its SKU
      setIsInCart(false);
      
      showNotification('Item was removed from the Shopping Cart.');

    } else {
      // --- ADD TO CART ---
      const updatedSkus = [...cartItems, sku];
      updateCart(updatedSkus); // Update the list of SKUs in CartContext and localStorage (CART_KEY)
      // ADDED: Store the full product details in localStorage using the SKU as the key
      if (product) { // Ensure product data is available before storing
        localStorage.setItem(sku, JSON.stringify(product));
      }
      setIsInCart(true);
      
      showNotification('Item was added to the Shopping Cart!');
    }
  }, [sku, product, cartItems, updateCart, showNotification]);

  return { isInCart, handleToggleCart };
};