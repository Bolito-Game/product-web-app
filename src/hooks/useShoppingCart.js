import { useState, useEffect, useCallback, useContext } from 'react';
import { CartContext } from './cartContext';

// A constant for the local storage key to avoid typos.
const CART_KEY = 'product-web-app-shopping-cart';

/**
 * A helper function to get the current list of SKUs from local storage.
 * @returns {string[]} An array of SKUs in the cart.
 */
const getCartSkus = () => {
  const skus = localStorage.getItem(CART_KEY);
  return skus ? skus.split(',').filter(Boolean) : [];
};

/**
 * Custom hook to manage shopping cart state and actions.
 * @param {string} sku - The SKU of the product on the current page.
 * @param {object} product - The full product data object from the API.
 * @returns {{isInCart: boolean, handleToggleCart: function}}
 */
export const useShoppingCart = (sku, product) => {
  const { cartItems = [], updateCart } = useContext(CartContext); // Fallback to empty array
  // State to track if the current product is in the cart.
  const [isInCart, setIsInCart] = useState(() => cartItems.includes(sku));

  // Re-check if the item is in the cart whenever the SKU or cartItems change.
  useEffect(() => {
    const inCart = cartItems.includes(sku);
    setIsInCart(inCart);
    console.log('useShoppingCart: sku =', sku, 'isInCart =', inCart, 'cartItems =', cartItems); // Debug log
  }, [sku, cartItems]);

  // A memoized function to add or remove the item from the cart.
  const handleToggleCart = useCallback(() => {
    if (!sku || !product) {
      console.log('handleToggleCart: Missing sku or product', { sku, product }); // Debug log
      return;
    }

    console.log('handleToggleCart: Before toggle, cartItems =', cartItems); // Debug log
    const isCurrentlyInCart = cartItems.includes(sku);

    if (isCurrentlyInCart) {
      // --- REMOVE FROM CART ---
      const updatedSkus = cartItems.filter(itemSku => itemSku !== sku);
      updateCart(updatedSkus);
      
      // Remove the separate local storage item for the product data.
      localStorage.removeItem(sku);

      setIsInCart(false);
      console.log('handleToggleCart: Item removed, updatedSkus =', updatedSkus); // Debug log
      alert(`Item was removed from the Shopping Cart.`);
    } else {
      // --- ADD TO CART ---
      const updatedSkus = [...cartItems, sku];
      updateCart(updatedSkus);

      // Add the product data as a new key-value pair in local storage.
      localStorage.setItem(sku, JSON.stringify(product));
      
      setIsInCart(true);
      console.log('handleToggleCart: Item added, updatedSkus =', updatedSkus); // Debug log
      alert('Item was added to the Shopping Cart!');
    }
  }, [sku, product, cartItems, updateCart]);

  return { isInCart, handleToggleCart };
};