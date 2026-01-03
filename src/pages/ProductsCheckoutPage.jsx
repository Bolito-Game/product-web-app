// src/pages/ProductsCheckoutPage.jsx
import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProductsBySku } from '../api/graphqlService';
import { setProductInCache } from '../utils/productCache';
import { NotificationContext } from '../contexts/NotificationContext';
import Loader from '../components/Loader';
import { FaPaypal, FaCreditCard } from 'react-icons/fa';

/* ---------- Reusable Quantity Selector --------------------------- */
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

/* ---------- Page Component --------------------------------------- */
const ProductsCheckoutPage = () => {
  const { t } = useTranslation();
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const paypalRef = useRef(null);
  const cardRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  const API_ENDPOINT = import.meta.env.VITE_PUBLIC_API_ENDPOINT;
  const API_KEY = import.meta.env.VITE_PUBLIC_API_KEY;
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Load PayPal SDK
  useEffect(() => {
    if (!window.paypal && PAYPAL_CLIENT_ID !== 'placeholder-sandbox-client-id') {
      const script = document.createElement('script');
      script.src = `https://sandbox.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=buttons&enable-funding=card`;
      script.async = true;
      script.onload = () => setPaypalLoaded(true);
      document.body.appendChild(script);
    } else if (window.paypal) {
      setPaypalLoaded(true);
    }
  }, [PAYPAL_CLIENT_ID]);

  // Calculate total
  const { totalDue, currency } = useMemo(() => {
    let total = 0;
    let ccy = 'USD';
    checkoutItems.forEach(item => {
      const loc = item.product.localizations?.[0];
      if (loc) {
        total += (loc.price || 0) * item.orderQuantity;
        ccy = loc.currency || ccy;
      }
    });
    return { totalDue: total, currency: ccy };
  }, [checkoutItems]);

  // Render PayPal buttons when ready
  useEffect(() => {
    if (paypalLoaded && window.paypal && totalDue > 0) {
      const paypalContainer = paypalRef.current;
      const cardContainer = cardRef.current;

      if (!paypalContainer || !cardContainer) return;

      paypalContainer.innerHTML = '';
      cardContainer.innerHTML = '';

      const commonButtonConfig = {
        createOrder: async () => {
          try {
            const products = checkoutItems.map(item => ({
              sku: item.product.sku,
              quantity: item.orderQuantity,
              price: item.product.localizations?.[0]?.price || 0
            }));

            const response = await fetch(`${API_ENDPOINT}/public/paypal/create-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
              },
              body: JSON.stringify({
                amount: totalDue,
                currency,
                details: { amount: totalDue, currency, products }
              })
            });

            const orderData = await response.json();
            if (!response.ok) throw new Error(orderData.error || t('checkout.create_order_error'));
            return orderData.id;
          } catch (err) {
            showNotification(`${t('checkout.create_order_failed')}: ${err.message}`);
          }
        },
        onApprove: async (data) => {
          try {
            const response = await fetch(`${API_ENDPOINT}/public/paypal/capture-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
              },
              body: JSON.stringify({ orderID: data.orderID })
            });
            const captureData = await response.json();
            if (!response.ok) throw new Error(captureData.error || t('checkout.capture_error'));

            showNotification(t('checkout.payment_success'));
            navigate('/order-success', {
              state: {
                details: captureData,
                checkoutItems,
                fromCart: location.state?.fromCart
              }
            });
          } catch (err) {
            showNotification(`${t('checkout.payment_failed')}: ${err.message}`);
          }
        },
        onError: () => {
          showNotification(t('checkout.payment_error'));
        }
      };

      window.paypal.Buttons({
        ...commonButtonConfig,
        style: { shape: 'rect', color: 'blue', layout: 'horizontal', label: 'paypal' }
      }).render(paypalContainer);

      window.paypal.Buttons({
        ...commonButtonConfig,
        fundingSource: 'card',
        style: { shape: 'rect', color: 'white', layout: 'horizontal', label: 'pay' }
      }).render(cardContainer);
    }
  }, [paypalLoaded, totalDue, currency, API_ENDPOINT, API_KEY, showNotification, navigate, checkoutItems, location.state, t]);

  // Fetch products
  useEffect(() => {
    const itemsToFetch = location.state?.items;

    if (!itemsToFetch || itemsToFetch.length === 0) {
      setError(t('checkout.no_items'));
      setTimeout(() => navigate('/'), 2000);
      setLoading(false);
      return;
    }

    const skus = itemsToFetch.map(item => item.sku);
    const requestedQuantities = new Map(itemsToFetch.map(item => [item.sku, item.quantity]));

    const fetchCheckoutData = async () => {
      try {
        const freshProductsData = await getProductsBySku(skus);
        const processedItems = [];
        const freshProductsMap = new Map(freshProductsData.map(p => [p.sku, p]));

        for (const sku of skus) {
          const freshProduct = freshProductsMap.get(sku);
          const requestedQty = requestedQuantities.get(sku);

          if (!freshProduct) {
            showNotification(t('checkout.product_not_found', { sku }));
            continue;
          }

          setProductInCache(sku, freshProduct);

          const availableQty = freshProduct.quantityInStock;
          const productName = freshProduct.localizations?.[0]?.productName || t('checkout.this_product');

          if (availableQty === 0) {
            showNotification(t('checkout.out_of_stock', { name: productName }));
            continue;
          }

          let finalQty = requestedQty;
          if (requestedQty > availableQty) {
            finalQty = availableQty;
            showNotification(t('checkout.quantity_reduced', { name: productName, qty: availableQty }));
          }

          processedItems.push({
            product: freshProduct,
            orderQuantity: finalQty
          });
        }

        if (processedItems.length === 0 && itemsToFetch.length > 0) {
          setError(t('checkout.all_unavailable'));
        }

        setCheckoutItems(processedItems);
      } catch (err) {
        setError(t('checkout.load_error'));
        console.error("Checkout Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [location.state, navigate, showNotification, t]);

  const handleQuantityChange = (sku, newQuantity) => {
    setCheckoutItems(current =>
      current.map(item =>
        item.product.sku === sku ? { ...item, orderQuantity: newQuantity } : item
      )
    );
  };

  const fmtPrice = (value, ccy) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD' }).format(value ?? 0);

  if (loading) return <div className="detail-loader-container"><Loader /></div>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="products-checkout-page">
      <div className="checkout-content">
        <h2>{t('checkout.title')}</h2>

        {totalDue > 0 ? (
          <>
            <div className="payment-buttons-container">
              <div className="payment-button paypal" ref={paypalRef}>
                {!paypalLoaded && <><FaPaypal size="1.2em" /> <span>{t('checkout.paypal')}</span></>}
              </div>
              <div className="payment-button credit-card" ref={cardRef}>
                {!paypalLoaded && <><FaCreditCard size="1.2em" /> <span>{t('checkout.credit_card')}</span></>}
              </div>
            </div>

            <div className="total-due-container">
              <h3>{t('checkout.total_due')}:</h3>
              <span className="total-due-amount">{fmtPrice(totalDue, currency)}</span>
            </div>
          </>
        ) : null}

        <div className="checkout-items-list">
          <h4>{t('checkout.order_summary')}</h4>
          {checkoutItems.length > 0 ? (
            checkoutItems.map(({ product, orderQuantity }) => {
              const loc = product.localizations?.[0] || {};
              return (
                <div key={product.sku} className="checkout-item-row">
                  <img
                    src={product.imageUrl}
                    alt={loc.productName || t('checkout.product')}
                    className="checkout-item-image"
                  />
                  <div className="checkout-item-details">
                    <span className="item-name">{loc.productName || t('checkout.na')}</span>
                    <span className="item-price">{fmtPrice(loc.price, loc.currency)}</span>
                  </div>
                  <div className="checkout-item-quantity">
                    <QuantitySelector
                      max={product.quantityInStock}
                      value={orderQuantity}
                      onChange={(newQty) => handleQuantityChange(product.sku, newQty)}
                    />
                    <small>{t('checkout.in_stock')}: {product.quantityInStock}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <p>{t('checkout.empty')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsCheckoutPage;