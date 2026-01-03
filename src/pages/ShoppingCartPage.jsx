// src/pages/ShoppingCartPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { cleanupExpiredProducts } from '../utils/productCache';

const ShoppingCartPage = () => {
  const { t } = useTranslation();
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const cartStorageKey = 'product-web-app-shopping-cart';

  const navigate = useNavigate();

  const handleCheckout = () => {
    const itemsToCheckout = cartData
      .filter((item) => item.checked)
      .map((item) => ({ sku: item.product.sku, quantity: 1 }));

    if (itemsToCheckout.length > 0) {
      navigate('/checkout', {
        state: {
          items: itemsToCheckout,
          fromCart: true
        }
      });
    }
  };

  useEffect(() => {
    const loadCartData = () => {
      const cartItemsString = localStorage.getItem(cartStorageKey);
      if (!cartItemsString) {
        setLoading(false);
        return;
      }

      let cartItems;
      try {
        cartItems = JSON.parse(cartItemsString);
      } catch (e) {
        console.error('Failed to parse cart JSON', e);
        setLoading(false);
        return;
      }

      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }

      const productsData = cartItems.map(item => {
        const productJson = localStorage.getItem(item.sku);
        let product = null;

        if (productJson) {
          try {
            const cachedItem = JSON.parse(productJson);
            if (cachedItem && cachedItem.data) {
              product = cachedItem.data;
            }
          } catch (e) {
            console.error(`Failed to parse product from cache for SKU: ${item.sku}`, e);
          }
        }

        const isChecked = product?.productStatus === 'ACTIVE' ? item.checked : false;

        return { ...item, product, checked: isChecked };
      }).filter(item => item.product);

      setCartData(productsData);

      const updatedCartItems = productsData.map(({ sku, checked }) => ({ sku, checked }));
      localStorage.setItem(cartStorageKey, JSON.stringify(updatedCartItems));

      setLoading(false);
    };

    loadCartData();
    cleanupExpiredProducts();
  }, []);

  const handleToggleCheck = useCallback((skuToToggle) => {
    const newCartData = cartData.map(item => {
      if (item.sku === skuToToggle) {
        if (item.product.productStatus === 'ACTIVE') {
          return { ...item, checked: !item.checked };
        }
      }
      return item;
    });

    setCartData(newCartData);

    const updatedCartForStorage = newCartData.map(({ sku, checked }) => ({ sku, checked }));
    localStorage.setItem(cartStorageKey, JSON.stringify(updatedCartForStorage));
  }, [cartData]);

  if (loading) {
    return <Loader />;
  }

  if (cartData.length === 0) {
    return (
      <div className="no-results">
        <p>{t('cart.empty')}</p>
      </div>
    );
  }

  const checkedItemsCount = cartData.filter(item => item.checked).length;

  return (
    <div className="shopping-cart-page">
      <div className="page-header">
        <h2>{t('cart.title')}</h2>

        <button
          className="checkout-button"
          disabled={checkedItemsCount === 0}
          onClick={handleCheckout}
        >
          {t('cart.checkout_button', { count: checkedItemsCount })}
        </button>
      </div>

      <div className="product-grid product-grid-3">
        {cartData.map(({ product, checked }) => (
          <ProductCard
            key={product.sku}
            product={product}
            isChecked={checked}
            onToggleCheck={() => handleToggleCheck(product.sku)}
            isCheckable={true}
          />
        ))}
      </div>
    </div>
  );
};

export default ShoppingCartPage;