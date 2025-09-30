import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductBySku } from '../api/graphqlService';
import Loader from '../components/Loader';
import { useShoppingCart } from '../hooks/useShoppingCart'; 

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
  const { sku } = useParams(); // ← SKU comes from the URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [qty, setQty] = useState(1); // Manages quantity for adding to cart (though useShoppingCart doesn't use it directly yet)

  // useShoppingCart hooks takes sku and product, which it uses internally
  // for local storage management (cart SKUs + full product details by SKU).
  const { isInCart, handleToggleCart } = useShoppingCart(sku, product);

  /* ---- fetch product each time the sku changes ------------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductBySku(sku); 
        if (!alive) return;
        if (!data) throw new Error('Product not found');
        
        setProduct(data);
        setQty(data.quantityInStock > 0 ? 1 : 0);

        if (data) {
            localStorage.setItem(sku, JSON.stringify(data));
        }
        // -----------------------------------------------------------------

      } catch (e) {
        if (alive) setError(e.message || 'Failed to load product');
      } finally {
        if (alive) setLoading(false);
      }
    })();
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
  const isProductActive = productStatus === 'ACTIVE'; // Explicitly check for 'ACTIVE'

  const panelClasses = `info-panel${panelOpen ? ' expanded' : ''}`;

  /* ---- helpers --------------------------------------------------- */
  const fmtPrice = (value, ccy) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy || 'USD' }).format(value ?? 0);

  /* ---- JSX ------------------------------------------------------- */
  return (
    <div className="product-detail-page">
      {/* IMAGE (fixed – never moves) */}
      <div className="product-image-container">
        <img
          className="product-detail-image"
          src={imageUrl}
          alt={loc.productName || sku}
        />
      </div>

      {/* INFO PANEL */}
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

          {/* --- HIDE PRICE IF INACTIVE --- */}
          {isProductActive && (
            <p className="product-detail-price">
              {fmtPrice(loc.price, loc.currency)}
            </p>
          )}

          {/* EXPANDED SECTION */}
          <div className="panel-expanded-content">
            <p className="product-full-description">{loc.description}</p>

            {/* --- HIDE AVAILABILITY IF INACTIVE --- */}
            {isProductActive && (
              <div className="stock-info">
                <strong>Availability:</strong>{' '}
                <span className={inStock ? 'in-stock' : 'out-of-stock'}>
                  {inStock ? `${quantityInStock} in stock` : 'Out of Stock'}
                </span>
              </div>
            )}

            {/* Display purchase controls only if product is ACTIVE and in stock */}
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
                  {/* Corrected: handleToggleCart does not take qty argument */}
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
                  >
                    Pay Now
                  </button>
                </div>
              </>
            )}

            {/* Display remove button only if product is INACTIVE but is in the cart */}
            {!isProductActive && isInCart && (
                <div className="action-buttons">
                    {/* Corrected: handleToggleCart does not take qty argument */}
                    <button
                        className="remove-from-cart-btn"
                        onClick={handleToggleCart}
                    >
                        Remove from Shopping Cart
                    </button>
                </div>
            )}
            
            {/* Optional: If product is inactive and not in cart, you might want a message */}
            {!isProductActive && !isInCart && (
                <p className="inactive-product-message">This product is currently inactive and cannot be purchased.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;