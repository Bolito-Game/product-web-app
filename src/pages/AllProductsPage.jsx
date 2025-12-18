import React, { useState, useEffect } from 'react';
import { getAllProducts, searchProducts } from '../api/graphqlService';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const AllProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Search States (Mirroring CategoriesPage style)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Centralized fetch logic to handle both browsing and searching
  const fetchProducts = async (token, term = '') => {
    try {
      let data;
      if (term.trim().length >= 2) {
        data = await searchProducts(term, token);
      } else {
        data = await getAllProducts(token);
      }

      const visibleProducts = data.items.filter(
        product => product.productStatus !== 'DISCONTINUED'
      );

      setProducts(prev => token ? [...prev, ...visibleProducts] : visibleProducts);
      setNextToken(data.nextToken);
      setNoResults(visibleProducts.length === 0 && !token);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch products. Please try again later.');
    }
  };

  // Initial Load
  useEffect(() => {
    setInitialLoading(true);
    fetchProducts(null).finally(() => setInitialLoading(false));
  }, []);

  // Debounced Search Handler
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (window.searchTimeout) clearTimeout(window.searchTimeout);

    window.searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      // If term is cleared, reset to basic product list
      await fetchProducts(null, term);
      setSearchLoading(false);
    }, 300);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setNoResults(false);
    fetchProducts(null, '');
  };

  const handleLoadMore = () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    fetchProducts(nextToken, searchTerm).finally(() => setLoadingMore(false));
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>All Products</h2>

        {/* 🔍 SEARCH BAR - Styled like CategoriesPage */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search products by name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchLoading && <span className="search-loading">🔄</span>}
            {searchTerm && (
              <button className="clear-search-btn" onClick={clearSearch}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NO RESULTS MESSAGE */}
      {noResults && (
        <div className="no-results">
          <div className="no-results-icon">📦</div>
          <p>No products found matching "<strong>{searchTerm}</strong>"</p>
          <button onClick={clearSearch} className="show-all-btn">
            Show All Products
          </button>
        </div>
      )}

      {/* PRODUCT GRID */}
      {!noResults && (
        <div className="product-grid product-grid-3">
          {products.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}

      {/* LOAD MORE */}
      {nextToken && !noResults && (
        <div className="load-more-container">
          <button 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            className="load-more-button"
          >
            {loadingMore ? 'Loading...' : 'Load More Products'}
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default AllProductsPage;