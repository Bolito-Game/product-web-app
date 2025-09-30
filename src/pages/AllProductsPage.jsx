import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../api/graphqlService';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const AllProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async (token) => {
    try {
      const data = await getAllProducts(token);
      
      // Filter out discontinued products before they are added to state
      const visibleProducts = data.items.filter(
        product => product.productStatus !== 'DISCONTINUED'
      );
      
      // Append new products if loading more, otherwise set the initial list
      setProducts(prevProducts => token ? [...prevProducts, ...visibleProducts] : visibleProducts);
      setNextToken(data.nextToken);
    } catch (err) {
      setError('Failed to fetch products. Please try again later.');
    }
  };

  // Effect for the initial page load
  useEffect(() => {
    setInitialLoading(true);
    fetchProducts(null).finally(() => setInitialLoading(false));
  }, []);

  const handleLoadMore = () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    fetchProducts(nextToken).finally(() => setLoadingMore(false));
  };

  if (initialLoading) return <Loader />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>All Products</h2>
      <div className="product-grid product-grid-3">
        {products.map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </div>

      {nextToken && (
        <div className="load-more-container">
          <button 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            className="load-more-button"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AllProductsPage;