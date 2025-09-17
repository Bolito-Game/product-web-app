import React, { useState, useEffect } from 'react';
import { getAllCategories, getProductsByCategory } from '../api/graphqlService';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

// A new component to handle fetching and displaying products for a category
const CategoryProductList = ({ categoryId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productData = await getProductsByCategory(categoryId);
        setProducts(productData);
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

  const gridClass = products.length > 10 ? 'product-grid-3' : 'product-grid-2';

  return (
    <div className={`product-grid ${gridClass}`}>
      {products.map((product) => (
        <ProductCard key={product.sku} product={product} />
      ))}
    </div>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoryData = await getAllCategories();
        setCategories(categoryData);
        // Open the first category by default
        if (categoryData && categoryData.length > 0) {
          setOpenCategory(categoryData[0].category);
        }
      } catch (err) {
        setError('Failed to fetch categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };
  
  if (loading) return <Loader />;
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
                <CategoryProductList categoryId={cat.category} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;