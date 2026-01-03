// src/hooks/useShoppingCart.js
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../contexts/CartContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { setProductInCache } from '../utils/productCache';

export const useShoppingCart = (sku, product) => {
  const { t } = useTranslation();
  const { cartItems = [], updateCart } = useContext(CartContext);
  const { showNotification } = useContext(NotificationContext);

  const isInCart = cartItems.some(item => item.sku === sku);

  const handleToggleCart = () => {
    if (!sku) return;

    if (isInCart) {
      // --- REMOVE FROM CART ---
      const updatedCart = cartItems.filter(item => item.sku !== sku);
      updateCart(updatedCart);

      showNotification(t('cart.item_removed'));
    } else {
      // --- ADD TO CART ---
      const updatedCart = [...cartItems, { sku, checked: true }];
      updateCart(updatedCart);

      if (product) {
        setProductInCache(sku, product);
      }

      // Visual feedback animation
      setTimeout(() => {
        document.querySelector('.header-cart')?.classList.add('added');
        setTimeout(() => document.querySelector('.header-cart')?.classList.remove('added'), 600);
      }, 100);

      showNotification(t('cart.item_added'));
    }
  };

  return { isInCart, handleToggleCart };
};

export const useDeleteFromCart = (checkoutItems = []) => {
  const { t } = useTranslation();
  const { cartItems = [], updateCart } = useContext(CartContext);
  const { showNotification } = useContext(NotificationContext);

  const deleteFromCart = () => {
    const checkoutSkus = Array.isArray(checkoutItems)
      ? checkoutItems.map(item => item.product?.sku).filter(Boolean)
      : [];

    if (checkoutSkus.length === 0) return;

    const updatedCart = cartItems.filter(item => !checkoutSkus.includes(item.sku));
    updateCart(updatedCart);

    showNotification(t('cart.items_cleared_after_checkout'));
  };

  return { deleteFromCart };
};