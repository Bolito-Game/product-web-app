// src/pages/OrderSuccessPage.jsx
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import { saveOrder } from '../database/orders';
import Loader from '../components/Loader';
import { deleteFromShoppingCart } from '../hooks/useShoppingCart';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  // Extract order details and checkout items from location.state
  const orderDetails = location.state?.details?.details;
  const checkoutItems = location.state?.checkoutItems;
  const fromCart = location.state?.fromCart === true;

  const { deleteFromCart } = useMemo(() => deleteFromShoppingCart(checkoutItems || []), [checkoutItems]);

  const hasDeletedCart = useRef(false);

  useEffect(() => {
    if (orderDetails && checkoutItems?.length > 0) {
      const orderEntry = {
        id: orderDetails.id,
        savedAt: new Date().toISOString(),
        details: orderDetails,
        checkoutItems,
      };
      saveOrder(orderEntry).catch(() => {
        showNotification('Failed to save order locally.', 'error');
      });
    }

    if (fromCart && !hasDeletedCart.current) {
      deleteFromCart();
      hasDeletedCart.current = true;
    }
  }, [orderDetails, checkoutItems, showNotification, fromCart]);

  // Handle case where no order details are provided
  if (!orderDetails) {
    showNotification('No order details available. Redirecting...');
    setTimeout(() => navigate('/'), 2000);
    return <div className="detail-loader-container"><Loader /></div>;
  }

  // Format currency values
  const fmtPrice = (value, currency) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value ?? 0);

  // Format dates with validation
  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      return 'Date not available';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(date);
  };

  // Extract key information from orderDetails with fallbacks
  const {
    id: orderId = 'N/A',
    createTime = null,
    status = 'N/A',
    payer = {},
    purchaseUnits = [{}],
  } = orderDetails;

  const purchaseUnit = purchaseUnits[0] || {};
  const capture = purchaseUnit.payments?.captures?.[0] || {};
  const amount = capture.amount || purchaseUnit.amount || { value: '0.00', currencyCode: 'USD' };
  const payee = purchaseUnit.payee || { emailAddress: 'N/A' };
  const shipping = purchaseUnit.shipping || { address: {}, name: { fullName: 'N/A' } };

  return (
    <div className="products-checkout-page">
      <div className="checkout-content">
        <h2>Order Confirmation</h2>
        <div className="order-success-container">
          <div className="success-message">
            <h3>Thank You for Your Purchase!</h3>
            <p>Your payment has been successfully processed.</p>
          </div>

          <div className="order-details">
            <h4>Order Details</h4>
            <div className="order-detail-row">
              <span className="detail-label">Order ID:</span>
              <span className="detail-value">{orderId}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Order Status:</span>
              <span className="detail-value status-completed">{status}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Order Date:</span>
              <span className="detail-value">{formatDate(createTime)}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Total Amount:</span>
              <span className="detail-value">{fmtPrice(amount.value, amount.currencyCode)}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Payer:</span>
              <span className="detail-value">
                {payer.name ? `${payer.name.givenName} ${payer.name.surname}` : 'N/A'}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{payer.emailAddress || 'N/A'}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Shipping Address:</span>
              <span className="detail-value">
                {shipping.address?.addressLine1
                  ? `${shipping.address.addressLine1}, ${shipping.address.adminArea2}, ${shipping.address.adminArea1} ${shipping.address.postalCode}, ${shipping.address.countryCode}`
                  : 'N/A'}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">Payee Email:</span>
              <span className="detail-value">{payee.emailAddress}</span>
            </div>
          </div>

          <div className="checkout-items-list">
            <h4>Order Summary</h4>
            {checkoutItems && checkoutItems.length > 0 ? (
              checkoutItems.map(({ product, orderQuantity }) => {
                const loc = product.localizations?.[0] || {};
                return (
                  <div key={product.sku} className="checkout-item-row">
                    <img
                      src={product.imageUrl || '/path/to/placeholder-image.jpg'}
                      alt={loc.productName || 'Product'}
                      className="checkout-item-image"
                    />
                    <div className="checkout-item-details">
                      <span className="item-name">{loc.productName || 'N/A'}</span>
                      <span className="item-price">{fmtPrice(loc.price, loc.currency)}</span>
                    </div>
                    <div className="checkout-item-quantity">
                      <span>Quantity: {orderQuantity}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No items in this order.</p>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="continue-shopping-btn"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;