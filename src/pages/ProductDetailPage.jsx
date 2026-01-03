// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProductsBySku } from '../api/graphqlService';
import Loader from '../components/Loader';
import ImageLoader from '../components/ImageLoader';
import { useShoppingCart } from '../hooks/useShoppingCart';
import { setProductInCache } from '../utils/productCache';

/* ---------- Reusable Quantity Selector (matches checkout) ---------- */
const QuantitySelector = ({ max, value, onChange }) => {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="quantity-selector">
      <button onClick={dec} disabled={value <= 1}>−</button>
      <span>{value}</span>
      <button onClick={inc} disabled={value >= max}>+</button>
    </div>
  );
};

/* -------------------------- Product Details Page -------------------------- */
const ProductDetailsPage = () => {
  const { t } = useTranslation();
  const { sku } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);

  const { isInCart, handleToggleCart } = useShoppingCart(sku, product);

  /* ------------------- Fetch Product with Cache ------------------- */
  useEffect(() => {
    let alive = true;
    const TTL = 3600 * 1000; // 1 hour

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      // Check cache
      const cached = localStorage.getItem(sku);
      let cachedData = null;
      if (cached) {
        try { cachedData = JSON.parse(cached); } catch {}
      }
      const now = Date.now();
      const isValid = cachedData?.data && cachedData?.timestamp && (now - cachedData.timestamp < TTL);

      if (isValid && alive) {
        setProduct(cachedData.data);
        setQty(cachedData.data.quantityInStock > 0 ? 1 : 0);
        setLoading(false);
        return;
      }

      // Fetch from API
      try {
        const [data] = await getProductsBySku([sku]);
        if (!alive) return;
        if (!data) throw new Error(t('product_detail.not_found'));

        setProduct(data);
        setQty(data.quantityInStock > 0 ? 1 : 0);
        setProductInCache(sku, data);
      } catch (e) {
        if (alive) setError(e.message || t('product_detail.load_error'));
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchProduct();
    return () => { alive = false; };
  }, [sku, t]);

  /* ------------------- Loading / Error States ------------------- */
  if (loading) {
    return (
      <div className="detail-loader-container">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!product) return null;

  /* ------------------- Product Data ------------------- */
  const {
    imageUrl,
    category,
    productStatus,
    quantityInStock,
    localizations,
  } = product;

  const loc = localizations?.[0] || {};
  const inStock = quantityInStock > 0;
  const isActive = productStatus === 'ACTIVE';

  const formatPrice = (value, currency) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value ?? 0);

  const handlePayNow = () => {
    if (qty > 0) {
      navigate('/checkout', {
        state: { items: [{ sku, quantity: qty }] },
      });
    }
  };

  return (
    <div className="product-detail-page">
      <div className="detail-content">

        {/* Hero Image */}
        <ImageLoader
          src={imageUrl}
          alt={loc.productName || sku}
          className="detail-hero-image"
        />

        {/* Product Title */}
        <h2>{loc.productName || t('product_detail.untitled')}</h2>

        {/* Price (only if active) */}
        {isActive && (
          <div className="detail-price">
            {formatPrice(loc.price, loc.currency)}
          </div>
        )}

        {/* Meta Info */}
        <div className="detail-meta">
          <strong>{t('product_detail.sku')}:</strong> <span>{sku}</span>
          {category && (
            <>
              <strong>{t('product_detail.category')}:</strong> <span>{category}</span>
            </>
          )}
        </div>

        {/* Stock Status */}
        {isActive && (
          <div className="stock-info">
            <strong>{t('product_detail.availability')}:</strong>{' '}
            <span className={inStock ? 'in-stock' : 'out-of-stock'}>
              {inStock
                ? t('product_detail.in_stock', { count: quantityInStock })
                : t('product_detail.out_of_stock')}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="product-full-description">
          {loc.description || t('product_detail.no_description')}
        </p>

        {/* Purchase Controls (only if active and in stock) */}
        {isActive && inStock && (
          <>
            <div className="purchase-controls">
              <label>{t('product_detail.quantity')}:</label>
              <QuantitySelector
                max={quantityInStock}
                value={qty}
                onChange={setQty}
              />
            </div>

            <div className="detail-action-buttons">
              <button
                className="add-to-cart-btn"
                onClick={handleToggleCart}
                disabled={qty === 0}
              >
                {isInCart ? t('product_detail.remove_from_cart') : t('product_detail.add_to_cart')}
              </button>
              <button
                className="pay-now-btn"
                onClick={handlePayNow}
                disabled={qty === 0}
              >
                {t('product_detail.pay_now')}
              </button>
            </div>
          </>
        )}

        {/* Inactive Product */}
        {!isActive && (
          <>
            {isInCart && (
              <div className="detail-action-buttons">
                <button className="add-to-cart-btn" onClick={handleToggleCart}>
                  {t('product_detail.remove_from_cart')}
                </button>
              </div>
            )}
            <p className="inactive-product-message">
              {t('product_detail.inactive_message')}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;