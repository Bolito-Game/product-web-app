import React, { useState, useEffect } from 'react';
import { getAllCategories, getProductsByCategory } from '../api/graphqlService';
import { searchCategories } from '../database';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

// --- SUB-COMPONENT: CategoryProductList ---
const CategoryProductList = ({ categoryId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // The new function returns the object: { items: [...], nextToken: ... }
        const productData = await getProductsByCategory(categoryId);
        
        // Access .items from the returned data
        if (productData && productData.items) {
          const visibleProducts = productData.items.filter(
            product => product.productStatus !== 'DISCONTINUED'
          );
          setProducts(visibleProducts);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products for this category.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  if (loading) return <Loader />;
  if (error) return <p className="error-message">{error}</p>;
  
  if (products.length === 0) return <p className="no-products">No products found in this category.</p>;

  return (
    <div className="product-grid product-grid-3">
      {products.map((product) => (
        // Passing the product object which now contains 'sku' and 'localizations'
        <ProductCard key={product.sku} product={product} />
      ))}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const CategoriesPage = () => {
  const [categories, setCategories] = useState([]); 
  const [displayedCategories, setDisplayedCategories] = useState([]); 
  const [openCategory, setOpenCategory] = useState(null);
  const [nextToken, setNextToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async (token) => {
    try {
      const data = await getAllCategories(token);
      const sortedCategories = data.items.sort((a, b) => a.text.localeCompare(b.text));
      setCategories(prev => token ? [...prev, ...sortedCategories] : sortedCategories);
      setNextToken(data.nextToken);
      
      if (!token && sortedCategories.length > 0) {
        setOpenCategory(sortedCategories[0].category);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to fetch categories.');
    }
  };

  const performSearch = async (term) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length < 2) {
      setDisplayedCategories(categories);
      setSearchResults([]);
      setNoResults(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchCategories(trimmedTerm);
      if (results.length === 0) {
        setNoResults(true);
        setDisplayedCategories([]);
        setSearchResults([]);
      } else {
        const displayResults = results.map(cat => ({
          category: cat.category,
          text: cat.text,
          matchType: cat.matchType,
          matchScore: cat.matchScore,
          lang: cat.lang
        }));
        
        setSearchResults(results);
        setDisplayedCategories(displayResults);
        setNoResults(false);
        
        if (displayResults.length > 0 && openCategory !== displayResults[0].category) {
          setOpenCategory(displayResults[0].category);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      setDisplayedCategories(categories);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => performSearch(term), 200);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDisplayedCategories(categories);
    setSearchResults([]);
    setNoResults(false);
    if (categories.length > 0) setOpenCategory(categories[0].category);
  };

  useEffect(() => {
    const initialize = async () => {
      setInitialLoading(true);
      await fetchCategories(null);
      setInitialLoading(false);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!searchTerm) setDisplayedCategories(categories);
  }, [categories, searchTerm]);

  const handleLoadMoreCategories = () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    fetchCategories(nextToken).finally(() => setLoadingMore(false));
  };
  
  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const formatMatchIndicator = (matchType, matchScore) => {
    switch (matchType) {
      case 'exact': return '✅ Exact';
      case 'startsWith': return '🔍 Starts';
      case 'contains': return '📋 Contains';
      case 'fuzzy': return `🎯 ${matchScore}%`;
      default: return '';
    }
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="categories-page">
      <div className="page-header">
        <h2>Products by Category</h2>
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search categories..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchLoading && <span className="search-loading">🔄</span>}
            {searchTerm && <button className="clear-search-btn" onClick={clearSearch}>✕</button>}
          </div>
        </div>
      </div>

      {noResults && (
        <div className="no-results">
          <p>No categories found matching "<strong>{searchTerm}</strong>"</p>
          <button onClick={clearSearch} className="show-all-btn">Show All</button>
        </div>
      )}

      <div className="accordion">
        {displayedCategories.map((cat) => (
          <div key={cat.category} className="accordion-item">
            <button
              className={`accordion-header ${cat.matchType ? 'search-match' : ''}`}
              onClick={() => toggleCategory(cat.category)}
            >
              <span className="category-name">
                {cat.text}
                {cat.matchType && (
                  <span className="match-indicator">
                    {formatMatchIndicator(cat.matchType, cat.matchScore)}
                  </span>
                )}
              </span>
              <span className={`arrow ${openCategory === cat.category ? 'open' : ''}`}>▼</span>
            </button>
            {openCategory === cat.category && (
              <div className="accordion-content">
                <CategoryProductList categoryId={cat.category} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {nextToken && !searchTerm && (
        <div className="load-more-container">
          <button onClick={handleLoadMoreCategories} disabled={loadingMore} className="load-more-button">
            {loadingMore ? 'Loading...' : 'Load More Categories'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;