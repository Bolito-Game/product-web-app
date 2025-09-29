import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const ShoppingCartPage = () => {
  const [cartProducts, setCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define the key for the shopping cart SKU list in local storage
    const cartStorageKey = 'product-web-app-shopping-cart';

    // Retrieve the comma-separated SKU string
    const skusString = localStorage.getItem(cartStorageKey);

    // If the key is not found or its value is empty, the cart is empty
    if (!skusString) {
      setLoading(false);
      return;
    }

    // Convert the string of SKUs into an array, removing any empty entries
    const skus = skusString.split(',').filter(sku => sku.trim() !== '');

    // If there are no valid SKUs, the cart is effectively empty
    if (skus.length === 0) {
        setLoading(false);
        return;
    }

    // Fetch each product's data from local storage using its SKU as the key
    const products = skus
      .map(sku => {
        try {
          const productJson = localStorage.getItem(sku);
          // Parse the JSON string into a product object if it exists
          return productJson ? JSON.parse(productJson) : null;
        } catch (error) {
          console.error(`Error parsing product data for SKU: ${sku}`, error);
          // Return null if there's an error parsing the data
          return null;
        }
      })
      // Filter out any null values that resulted from missing data or parsing errors
      .filter(Boolean);

    setCartProducts(products);
    setLoading(false);
  }, []); // The empty dependency array ensures this effect runs only once on component mount

  // Display a loader while fetching data
  if (loading) {
    return <Loader />;
  }

  // Display a message if the shopping cart is empty
  if (cartProducts.length === 0) {
    return <p className="error-message">Your shopping cart is empty. 🛒</p>;
  }

  // Render the list of products in the shopping cart
  return (
    <div className="shopping-cart-page">
      <h2>Your Shopping Cart</h2>
      <div className="product-grid product-grid-3">
        {cartProducts.map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ShoppingCartPage;