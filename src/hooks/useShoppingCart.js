import { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { setProductInCache } from '../utils/productCache';

export const useShoppingCart = (sku, product) => {
  const { cartItems = [], updateCart } = useContext(CartContext);
  const { showNotification } = useContext(NotificationContext);

  const isInCart = cartItems.some(item => item.sku === sku);

  const handleToggleCart = () => {
    if (!sku) return;

    if (isInCart) {
      // --- REMOVE FROM CART ---
      const updatedCart = cartItems.filter(item => item.sku !== sku);
      updateCart(updatedCart);
      
      // The product cache is no longer removed from local storage here.
      // It will now expire naturally after 1 hour, according to the TTL logic.
      
      showNotification('Item was removed from the Shopping Cart.');
    } else {
      // --- ADD TO CART ---
      const updatedCart = [...cartItems, { sku, checked: true }];
      updateCart(updatedCart);
      
      // Use the cache utility to store the product with a timestamp.
      if (product) {
        setProductInCache(sku, product);
      }
      showNotification('Item was added to the Shopping Cart!');
    }
  };

  return { isInCart, handleToggleCart };
};