import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      <button onClick={dec} disabled={value <= 1}>-</button>
      <span>{value}</span>
      <button onClick={inc} disabled={value >= max}>+</button>
    </div>
  );
};

/* ---------- Page Component --------------------------------------- */
const ProductsCheckoutPage = () => {
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

  // Effect to load the PayPal SDK script
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

  // Memoize total calculation
  const { totalDue, currency } = useMemo(() => {
    let total = 0;
    let ccy = 'USD'; // Default currency
    checkoutItems.forEach(item => {
      const loc = item.product.localizations?.[0];
      if (loc) {
        total += (loc.price || 0) * item.orderQuantity;
        ccy = loc.currency || ccy;
      }
    });
    return { totalDue: total, currency: ccy };
  }, [checkoutItems]);

  useEffect(() => {
    // Wait until the PayPal SDK is loaded, window.paypal is available, and there's a total due
    if (paypalLoaded && window.paypal && totalDue > 0) {
      const paypalContainer = paypalRef.current;
      const cardContainer = cardRef.current;

      // Ensure the container elements have been rendered
      if (!paypalContainer || !cardContainer) return;

      // Clear previous buttons before rendering new ones (important for when totalDue changes)
      paypalContainer.innerHTML = '';
      cardContainer.innerHTML = '';

      // Common configuration for both buttons to avoid repetition
      const commonButtonConfig = {
        createOrder: async (data, actions) => {
          try {
            const response = await fetch(`${API_ENDPOINT}/public/paypal/create-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
              },
              body: JSON.stringify({ amount: totalDue, currency })
            });
            const orderData = await response.json();
            if (!response.ok) {
              throw new Error(orderData.error || 'Failed to create order');
            }
            return orderData.id;
          } catch (err) {
            showNotification(`Failed to create order: ${err.message}`);
          }
        },
        onApprove: async (data, actions) => {
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
            if (!response.ok) {
              throw new Error(captureData.error || 'Failed to capture order');
            }
            showNotification('Payment successful!');
            navigate('/order-success'); // Adjust route as needed
          } catch (err) {
            showNotification(`Payment failed: ${err.message}`);
          }
        },
        onError: (err) => {
          showNotification('An error occurred during payment.');
          console.error('PayPal error:', err);
        }
      };

      // Render the standard PayPal Button
      window.paypal.Buttons({
        ...commonButtonConfig,
        style: { shape: 'rect', color: 'blue', layout: 'horizontal', label: 'paypal' }
      }).render(paypalContainer);

      // Render the Credit Card Button
      window.paypal.Buttons({
        ...commonButtonConfig,
        fundingSource: 'card',
        style: { shape: 'rect', color: 'white', layout: 'horizontal', label: 'pay' }
      }).render(cardContainer);
    }
    // This effect re-runs when the total changes, re-rendering the buttons with the new amount.
  }, [paypalLoaded, totalDue, currency, API_ENDPOINT, API_KEY, showNotification, navigate]);

  // Effect to fetch product data on component mount
  useEffect(() => {
    const itemsToFetch = location.state?.items;

    if (!itemsToFetch || itemsToFetch.length === 0) {
      setError('No items to check out. Redirecting...');
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
            showNotification(`Product with SKU ${sku} could not be found and was removed.`);
            continue;
          }

          setProductInCache(sku, freshProduct);

          const availableQty = freshProduct.quantityInStock;
          const productName = freshProduct.localizations?.[0]?.productName || 'This product';

          if (availableQty === 0) {
            showNotification(`${productName} is out of stock and was removed.`);
            continue;
          }

          let finalQty = requestedQty;
          if (requestedQty > availableQty) {
            finalQty = availableQty;
            showNotification(`Quantity for ${productName} was reduced to ${availableQty} to match stock.`);
          }

          processedItems.push({
            product: freshProduct,
            orderQuantity: finalQty
          });
        }
        
        if (processedItems.length === 0 && itemsToFetch.length > 0) {
            setError('All selected products are currently unavailable.');
        }

        setCheckoutItems(processedItems);
      } catch (err) {
        setError('Failed to load checkout data. Please try again.');
        console.error("Checkout Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);
  
  const handleQuantityChange = (sku, newQuantity) => {
    setCheckoutItems(currentItems =>
      currentItems.map(item =>
        item.product.sku === sku
          ? { ...item, orderQuantity: newQuantity }
          : item
      )
    );
  };

  const fmtPrice = (value, ccy) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy || 'USD' }).format(value ?? 0);

  if (loading) return <div className="detail-loader-container"><Loader /></div>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="products-checkout-page">
      <div className="checkout-content">
        <h2>Checkout</h2>
        
        {totalDue > 0 ? (
          <>
            <div className="payment-buttons-container">
              {/* These containers are targeted by the useEffect to render the buttons */}
              <div className="payment-button paypal" ref={paypalRef}>
                {/* Fallback content shown only if SDK fails to load or render */}
                {!paypalLoaded && <><FaPaypal size="1.2em" /> <span>PayPal</span></>}
              </div>
              <div className="payment-button credit-card" ref={cardRef}>
                {!paypalLoaded && <><FaCreditCard size="1.2em" /> <span>Credit Card</span></>}
              </div>
            </div>

            <div className="total-due-container">
              <h3>Total Due:</h3>
              <span className="total-due-amount">{fmtPrice(totalDue, currency)}</span>
            </div>
          </>
        ) : null}

        <div className="checkout-items-list">
          <h4>Order Summary</h4>
          {checkoutItems.length > 0 ? (
            checkoutItems.map(({ product, orderQuantity }) => {
              const loc = product.localizations?.[0] || {};
              return (
                <div key={product.sku} className="checkout-item-row">
                  <img src={product.imageUrl} alt={loc.productName} className="checkout-item-image" />
                  <div className="checkout-item-details">
                    <span className="item-name">{loc.productName}</span>
                    <span className="item-price">{fmtPrice(loc.price, loc.currency)}</span>
                  </div>
                  <div className="checkout-item-quantity">
                      <QuantitySelector
                        max={product.quantityInStock}
                        value={orderQuantity}
                        onChange={(newQty) => handleQuantityChange(product.sku, newQty)}
                      />
                      <small>In Stock: {product.quantityInStock}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <p>Your checkout is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsCheckoutPage;