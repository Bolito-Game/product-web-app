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
        const productData = await getProductsByCategory(categoryId);
        const visibleProducts = productData.filter(
          product => product.productStatus !== 'DISCONTINUED'
        );
        setProducts(visibleProducts);
      } catch (err) {
        setError('Failed to load products for this category.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  if (loading) return <Loader />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="product-grid product-grid-3">
      {products.map((product) => (
        <ProductCard key={product.sku} product={product} />
      ))}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const CategoriesPage = () => {
  const [categories, setCategories] = useState([]); // API categories (original format)
  const [displayedCategories, setDisplayedCategories] = useState([]); // What user sees
  const [openCategory, setOpenCategory] = useState(null);
  const [nextToken, setNextToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState(null);

  // ORIGINAL fetchCategories - UNCHANGED (loads from API)
  const fetchCategories = async (token) => {
    try {
      const data = await getAllCategories(token);
      const sortedCategories = data.items.sort((a, b) => a.text.localeCompare(b.text));
      setCategories(prev => token ? [...prev, ...sortedCategories] : sortedCategories);
      setNextToken(data.nextToken);
      
      // Open first category on initial load ONLY
      if (!token && sortedCategories.length > 0) {
        setOpenCategory(sortedCategories[0].category);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to fetch categories.');
    }
  };

  // UNIVERSAL SEARCH - searches ALL languages, category + text fields
  const performSearch = async (term) => {
    const trimmedTerm = term.trim();
    
    // Show all categories for searches < 2 characters
    if (trimmedTerm.length < 2) {
      setDisplayedCategories(categories);
      setSearchResults([]);
      setNoResults(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      console.log(`🔍 Universal search for "${trimmedTerm}" (all languages)`);
      const results = await searchCategories(trimmedTerm);
      
      if (results.length === 0) {
        setNoResults(true);
        setDisplayedCategories([]);
        setSearchResults([]);
      } else {
        // Convert cached format to API-compatible format
        const displayResults = results.map(cat => ({
          category: cat.category,
          text: cat.text,
          matchScore: cat.matchScore,
          matchType: cat.matchType,
          matchedField: cat.matchedField,
          lang: cat.lang // For display/debugging
        }));
        
        setSearchResults(results);
        setDisplayedCategories(displayResults);
        setNoResults(false);
        
        // Auto-open first search result
        if (displayResults.length > 0 && openCategory !== displayResults[0].category) {
          setOpenCategory(displayResults[0].category);
        }
      }
    } catch (err) {
      console.error('❌ Search failed:', err);
      // Fallback to API categories
      setDisplayedCategories(categories);
      setNoResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search handler
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // 200ms debounce
    window.searchTimeout = setTimeout(() => {
      performSearch(term);
    }, 200);
  };

  // Clear search - returns to ORIGINAL state
  const clearSearch = () => {
    setSearchTerm('');
    setDisplayedCategories(categories);
    setSearchResults([]);
    setNoResults(false);
    setSearchLoading(false);
    // Restore first category open state if we had categories
    if (categories.length > 0 && !openCategory) {
      setOpenCategory(categories[0].category);
    }
  };

  // INITIAL LOAD - EXACTLY LIKE BEFORE
  useEffect(() => {
    const initialize = async () => {
      setInitialLoading(true);
      try {
        await fetchCategories(null);
        setDisplayedCategories(categories);
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setInitialLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Sync displayedCategories when API categories update (but only when not searching)
  useEffect(() => {
    if (!searchTerm) {
      setDisplayedCategories(categories);
    }
  }, [categories, searchTerm]);

  const handleLoadMoreCategories = () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    fetchCategories(nextToken).finally(() => setLoadingMore(false));
  };
  
  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  // Format match indicator for display
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
        
        {/* 🔍 SEARCH BAR */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search categories (category ID or name)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
              disabled={initialLoading}
            />
            {searchLoading && (
              <span className="search-loading">🔄</span>
            )}
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={clearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Search Stats */}
          {searchResults.length > 0 && (
            <div className="search-stats">
              Found {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
              {searchResults.length > 1 && (
                <span className="search-languages">
                  ({[...new Set(searchResults.map(r => r.lang))].join(', ')})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NO RESULTS MESSAGE */}
      {noResults && (
        <div className="no-results">
          <div className="no-results-icon">😔</div>
          <p>No categories found matching "<strong>{searchTerm}</strong>"</p>
          <p className="search-hint">
            Try searching with at least 2 characters in category ID or name.
          </p>
          <button onClick={clearSearch} className="show-all-btn">
            Show All Categories
          </button>
        </div>
      )}

      {/* CATEGORIES ACCORDION */}
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
      
      {/* LOAD MORE BUTTON - only when not searching */}
      {nextToken && !searchTerm && !noResults && (
        <div className="load-more-container">
          <button 
            onClick={handleLoadMoreCategories} 
            disabled={loadingMore}
            className="load-more-button"
          >
            {loadingMore ? 'Loading...' : 'Load More Categories'}
          </button>
        </div>
      )}
      
      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-message" style={{ textAlign: 'center', margin: '20px 0' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;