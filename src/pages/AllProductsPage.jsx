import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllProducts, searchProducts } from '../api/graphqlService';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const AllProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

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
      setError(t('all_products.error'));
    }
  };

  useEffect(() => {
    setInitialLoading(true);
    fetchProducts(null).finally(() => setInitialLoading(false));
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (window.searchTimeout) clearTimeout(window.searchTimeout);

    window.searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
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
        <h2>{t('all_products.title')}</h2>

        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('all_products.search_placeholder')}
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

      {noResults && (
        <div className="no-results">
          <div className="no-results-icon">📦</div>
          <p>
            {t('all_products.no_results')} "<strong>{searchTerm}</strong>"
          </p>
          <button onClick={clearSearch} className="show-all-btn">
            {t('all_products.show_all')}
          </button>
        </div>
      )}

      {!noResults && (
        <div className="product-grid product-grid-3">
          {products.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}

      {nextToken && !noResults && (
        <div className="load-more-container">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="load-more-button"
          >
            {loadingMore ? t('all_products.loading') : t('all_products.load_more')}
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default AllProductsPage;