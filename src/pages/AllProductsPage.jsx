import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../api/graphqlService';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const AllProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data.items);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <Loader />;
  if (error) return <p className="error-message">{error}</p>;

  // Determine grid layout based on number of products
  const gridClass = products.length > 10 ? 'product-grid-3' : 'product-grid-2';

  return (
    <div>
      <h2>All Products</h2>
      <div className={`product-grid ${gridClass}`}>
        {products.map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </div>
    </div>
  );
};

export default AllProductsPage;