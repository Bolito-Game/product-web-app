import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const ShoppingCartPage = () => {
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const cartStorageKey = 'product-web-app-shopping-cart';

  useEffect(() => {
    // Fetch cart items and their full details
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
        console.error("Failed to parse cart JSON", e);
        setLoading(false);
        return;
      }

      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }
      
      // Fetch product details for each item in the cart from the local storage cache.
      const productsData = cartItems.map(item => {
        const productJson = localStorage.getItem(item.sku);
        let product = null;

        // Check for the product and parse it, expecting the new cache structure.
        if (productJson) {
          try {
            const cachedItem = JSON.parse(productJson);
            // Ensure the cached item has the expected { data, timestamp } structure.
            if (cachedItem && cachedItem.data) {
                product = cachedItem.data;
            }
          } catch (e) {
            console.error(`Failed to parse product from cache for SKU: ${item.sku}`, e);
          }
        }
        
        // **Business Rule**: If a product is not ACTIVE, it cannot be checked.
        const isChecked = product?.productStatus === 'ACTIVE' ? item.checked : false;

        return { ...item, product, checked: isChecked };
      }).filter(item => item.product); // Filter out items where product details couldn't be found

      setCartData(productsData);

      // **Data Integrity**: If any product was forced to unchecked, update localStorage
      const updatedCartItems = productsData.map(({ sku, checked }) => ({ sku, checked }));
      localStorage.setItem(cartStorageKey, JSON.stringify(updatedCartItems));

      setLoading(false);
    };

    loadCartData();
  }, []);

  const handleToggleCheck = useCallback((skuToToggle) => {
    const newCartData = cartData.map(item => {
      if (item.sku === skuToToggle) {
        // Only allow checking if the product is ACTIVE
        if (item.product.productStatus === 'ACTIVE') {
          return { ...item, checked: !item.checked };
        }
      }
      return item;
    });

    setCartData(newCartData);

    // Update localStorage with the new checked status
    const updatedCartForStorage = newCartData.map(({ sku, checked }) => ({ sku, checked }));
    localStorage.setItem(cartStorageKey, JSON.stringify(updatedCartForStorage));
  }, [cartData]);

  if (loading) {
    return <Loader />;
  }

  if (cartData.length === 0) {
    return <p className="error-message">Your shopping cart is empty. 🛒</p>;
  }

  const checkedItemsCount = cartData.filter(item => item.checked).length;

  return (
    <div className="shopping-cart-page">
      <div className="cart-header">
        <h2>Your Shopping Cart</h2>
        <button 
          className="checkout-button" 
          disabled={checkedItemsCount === 0}
        >
          Check Out {checkedItemsCount} Product{checkedItemsCount !== 1 ? 's' : ''}
        </button>
      </div>
      <div className="product-grid product-grid-3">
        {cartData.map(({ product, checked }) => (
          <ProductCard
            key={product.sku}
            product={product}
            isChecked={checked}
            onToggleCheck={() => handleToggleCheck(product.sku)}
            isCheckable={true} // Prop to tell ProductCard to show a checkmark
          />
        ))}
      </div>
    </div>
  );
};

export default ShoppingCartPage;