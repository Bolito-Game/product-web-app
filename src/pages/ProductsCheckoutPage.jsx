import React, { useState, useEffect, useMemo, useContext } from 'react';
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

  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  useEffect(() => {
    // Items are passed via navigation state from the previous page
    const itemsToFetch = location.state?.items;

    if (!itemsToFetch || itemsToFetch.length === 0) {
      setError('No items to check out. Redirecting...');
      setTimeout(() => navigate('/'), 2000); // Redirect to home or products page
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

          // Update cache with the latest product data
          if (freshProduct) {
            setProductInCache(sku, freshProduct);
          } else {
            showNotification(`Product with SKU ${sku} could not be found and was removed.`);
            continue; // Skip this item if it no longer exists
          }
          
          const availableQty = freshProduct.quantityInStock;
          const productName = freshProduct.localizations?.[0]?.productName || 'This product';

          // If the API reports 0 quantity, notify the user and remove from checkout
          if (availableQty === 0) {
            showNotification(`${productName} is out of stock and was removed.`);
            continue;
          }

          let finalQty = requestedQty;
          // If requested quantity exceeds available stock, adjust it and notify the user
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
    // The dependency array intentionally omits some values to ensure this runs only once on mount.
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

  const fmtPrice = (value, ccy) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy || 'USD' }).format(value ?? 0);

  if (loading) return <div className="detail-loader-container"><Loader /></div>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="products-checkout-page">
      <div className="checkout-content">
        <h2>Checkout</h2>
        
        <div className="payment-buttons-container">
          <button className="payment-button paypal">
            <FaPaypal size="1.2em" /> <span>PayPal</span>
          </button>
          <button className="payment-button credit-card">
            <FaCreditCard size="1.2em" /> <span>Pay with Credit Card</span>
          </button>
        </div>

        <div className="total-due-container">
          <h3>Total Due:</h3>
          <span className="total-due-amount">{fmtPrice(totalDue, currency)}</span>
        </div>

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