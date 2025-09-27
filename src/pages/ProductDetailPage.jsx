// src/pages/ProductDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getProductBySku } from '../api/graphqlService';
import Loader from '../components/Loader';

// --- Reusable Quantity Selector Component ---
const QuantitySelector = ({ maxQuantity, quantity, onQuantityChange }) => {
  const handleDecrement = () => onQuantityChange(Math.max(0, quantity - 1));
  const handleIncrement = () => onQuantityChange(Math.min(maxQuantity, quantity + 1));

  return (
    <div className="quantity-selector">
      <button onClick={handleDecrement} disabled={quantity <= 0}>-</button>
      <span>{quantity}</span>
      <button onClick={handleIncrement} disabled={quantity >= maxQuantity}>+</button>
    </div>
  );
};

// --- Main Detail Page Component ---
const ProductDetailPage = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) {
      const fetchProduct = async () => {
        try {
          const fetchedProduct = await getProductBySku(sku);
          if (!fetchedProduct) throw new Error('Product not found.');
          setProduct(fetchedProduct);
        } catch (err) {
          setError('Could not load the product. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [sku, product]);

  useEffect(() => {
    if (product && product.quantityInStock > 0) {
      setQuantity(1);
    } else if (product) {
      setQuantity(0);
    }
  }, [product]);

  if (loading) return <div className="detail-loader-container"><Loader /></div>;
  if (error) return <p className="error-message">{error}</p>;
  if (!product) return null;

  const localization = product.localizations?.[0] || {};
  const hasStock = product.quantityInStock > 0;
  const panelClasses = `info-panel ${isPanelExpanded ? 'expanded' : ''}`;

  return (
    <div className="product-detail-page">
      <div className="product-image-container">
        <img 
          src={product.imageUrl} 
          alt={localization.productName}
          className="product-detail-image"
        />
      </div>

      <div className={panelClasses} onClick={() => !isPanelExpanded && setIsPanelExpanded(true)}>
        <div className="panel-handle-bar" onClick={(e) => { e.stopPropagation(); setIsPanelExpanded(!isPanelExpanded); }}>
          {isPanelExpanded ? '▼' : '▲'} Tap to {isPanelExpanded ? 'close' : 'see details'}
        </div>
        
        <div className="panel-content">
          <h2 className="product-detail-title">{localization.productName}</h2>
          <p className="product-detail-price">
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: localization.currency || 'USD' 
            }).format(localization.price)}
          </p>

          <div className="panel-expanded-content">
            <p className="product-full-description">{localization.description}</p>
            
            <div className="stock-info">
              <strong>Availability:</strong> 
              <span className={hasStock ? 'in-stock' : 'out-of-stock'}>
                {hasStock ? `${product.quantityInStock} in stock` : 'Out of Stock'}
              </span>
            </div>

            {hasStock && (
              <>
                <div className="purchase-controls">
                  <label>Quantity:</label>
                  <QuantitySelector 
                    maxQuantity={product.quantityInStock}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                  />
                </div>
                <div className="action-buttons">
                  <button disabled={quantity === 0} className="add-to-cart-btn">Add to Shopping Cart</button>
                  <button disabled={quantity === 0} className="pay-now-btn">Pay Now</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;