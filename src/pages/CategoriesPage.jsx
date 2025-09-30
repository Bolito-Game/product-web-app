import React, { useState, useEffect } from 'react';
import { getAllCategories, getProductsByCategory } from '../api/graphqlService';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

// --- SUB-COMPONENT: Must be defined BEFORE the main component that uses it ---
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
  const [categories, setCategories] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [nextToken, setNextToken] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async (token) => {
    try {
      const data = await getAllCategories(token);

      // Sort the newly fetched categories alphabetically by their 'text' property
      const sortedCategories = data.items.sort((a, b) => a.text.localeCompare(b.text));

      setCategories(prev => token ? [...prev, ...sortedCategories] : sortedCategories);
      setNextToken(data.nextToken);
      
      // Open the first category from the sorted list on the initial load only
      if (!token && sortedCategories && sortedCategories.length > 0) {
        setOpenCategory(sortedCategories[0].category);
      }
    } catch (err) {
      setError('Failed to fetch categories.');
    }
  };

  useEffect(() => {
    setInitialLoading(true);
    fetchCategories(null).finally(() => setInitialLoading(false));
  }, []);

  const handleLoadMoreCategories = () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    fetchCategories(nextToken).finally(() => setLoadingMore(false));
  };
  
  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };
  
  if (initialLoading) return <Loader />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Products by Category</h2>
      <div className="accordion">
        {categories.map((cat) => (
          <div key={cat.category} className="accordion-item">
            <button
              className="accordion-header"
              onClick={() => toggleCategory(cat.category)}
            >
              {cat.text}
              <span className={`arrow ${openCategory === cat.category ? 'open' : ''}`}>▼</span>
            </button>
            {openCategory === cat.category && (
              <div className="accordion-content">
                {/* This is where the error was happening */}
                <CategoryProductList categoryId={cat.category} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {nextToken && (
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
    </div>
  );
};

export default CategoriesPage;