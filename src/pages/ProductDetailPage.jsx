import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductsBySku } from '../api/graphqlService';
import Loader from '../components/Loader';
import ImageLoader from '../components/ImageLoader'; // Import the ImageLoader component
import { useShoppingCart } from '../hooks/useShoppingCart';
import { setProductInCache } from '../utils/productCache';

/* ---------- reusable quantity selector --------------------------- */
const QuantitySelector = ({ max, value, onChange }) => {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="quantity-selector">
      <button onClick={dec} disabled={value <= 1}>-</button>
      <span>{value}</span>
      <button onClick={inc} disabled={value >= max}>+</button>
    </div>
  );
};

/* ---------- page ------------------------------------------------- */
const ProductDetailPage = () => {
  const { sku } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [qty, setQty] = useState(1);

  const { isInCart, handleToggleCart } = useShoppingCart(sku, product);
  const navigate = useNavigate();

  const handlePayNow = () => {
    if (qty > 0) {
      navigate("/checkout", { state: { items: [{ sku, quantity: qty }] } });
    }
  };

  /* ---- fetch product each time the sku changes ------------------ */
  useEffect(() => {
    let alive = true;
    const TTL = 3600 * 1000; // 1 hour in milliseconds

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);

      const itemString = localStorage.getItem(sku);
      let cachedItem = null;
      if (itemString) {
        try {
          cachedItem = JSON.parse(itemString);
        } catch (e) {
          console.error("Failed to parse cached product", e);
        }
      }

      const now = new Date().getTime();
      const isCacheValid = cachedItem && cachedItem.data && cachedItem.timestamp && (now - cachedItem.timestamp < TTL);

      if (isCacheValid) {
        if (alive) {
          setProduct(cachedItem.data);
          setQty(cachedItem.data.quantityInStock > 0 ? 1 : 0);
          setLoading(false);
        }
        return;
      }

      try {
        const products = await getProductsBySku([sku]);
        if (!alive) return;

        const data = products?.[0];
        if (!data) throw new Error('Product not found');

        setProduct(data);
        setQty(data.quantityInStock > 0 ? 1 : 0);
        setProductInCache(sku, data);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load product');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchProductData();

    return () => { alive = false; };
  }, [sku]);

  /* ---- guards ---------------------------------------------------- */
  if (loading) return <div className="detail-loader-container"><Loader /></div>;
  if (error) return <p className="error-message">{error}</p>;
  if (!product) return null;

  /* ---- data ------------------------------------------------------ */
  const {
    imageUrl,
    category,
    productStatus,
    quantityInStock,
    localizations
  } = product;

  const loc = localizations?.[0] || {};
  const inStock = quantityInStock > 0;
  const isProductActive = productStatus === 'ACTIVE';
  const panelClasses = `info-panel${panelOpen ? ' expanded' : ''}`;

  /* ---- helpers --------------------------------------------------- */
  const fmtPrice = (value, ccy) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy || 'USD' }).format(value ?? 0);

  /* ---- JSX ------------------------------------------------------- */
  return (
    <div className="product-detail-page">
      <div className="product-image-container">
        <ImageLoader
          src={imageUrl}
          alt={loc.productName || sku}
          className="product-detail-image"
        />
      </div>
      <div
        className={panelClasses}
        onClick={() => !panelOpen && setPanelOpen(true)}
      >
        <div
          className="panel-handle-bar"
          onClick={(e) => { e.stopPropagation(); setPanelOpen(!panelOpen); }}
        >
          {panelOpen ? '▼' : '▲'} Tap to {panelOpen ? 'close' : 'see details'}
        </div>
        <div className="panel-content">
          <h2 className="product-detail-title">{loc.productName}</h2>
          <p><strong>SKU:</strong> {sku}</p>
          {category && <p><strong>Category:</strong> {category}</p>}
          {isProductActive && (
            <p className="product-detail-price">
              {fmtPrice(loc.price, loc.currency)}
            </p>
          )}
          <div className="panel-expanded-content">
            <p className="product-full-description">
              {loc.description || 'No description available.'}
            </p>
            {isProductActive && (
              <div className="stock-info">
                <strong>Availability:</strong>{' '}
                <span className={inStock ? 'in-stock' : 'out-of-stock'}>
                  {inStock ? `${quantityInStock} in stock` : 'Out of Stock'}
                </span>
              </div>
            )}
            {inStock && isProductActive && (
              <>
                <div className="purchase-controls">
                  <label>Quantity:</label>
                  <QuantitySelector
                    max={quantityInStock}
                    value={qty}
                    onChange={setQty}
                  />
                </div>
                <div className="action-buttons">
                  <button
                    disabled={qty === 0}
                    className="add-to-cart-btn"
                    onClick={handleToggleCart}
                  >
                    {isInCart ? 'Remove from Shopping Cart' : 'Add to Shopping Cart'}
                  </button>
                  <button
                    disabled={qty === 0}
                    className="pay-now-btn"
                    onClick={handlePayNow}
                  >
                    Pay Now
                  </button>
                </div>
              </>
            )}
            {!isProductActive && isInCart && (
              <div className="action-buttons">
                <button
                  className="remove-from-cart-btn"
                  onClick={handleToggleCart}
                >
                  Remove from Shopping Cart
                </button>
              </div>
            )}
            {!isProductActive && !isInCart && (
              <p className="inactive-product-message">
                This product is currently inactive and cannot be purchased.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;