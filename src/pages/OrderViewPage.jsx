// src/pages/OrderViewPage.jsx
import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';

/* Inline local-date formatter – identical to MyOrdersPage */
const formatOrderDate = (dateString) => {
  if (!dateString) return 'Date not available';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  }).format(d);
};

const OrderViewPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);
  const order = state?.order;

  if (!order) {
    showNotification('Order not found.');
    return null;
  }

  const { details, checkoutItems } = order;

  const fmtPrice = (value, currency) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value ?? 0);

  const {
    id: orderId = 'N/A',
    createTime = null,
    status = 'N/A',
    payer = {},
    purchaseUnits = [{}],
  } = details || {};

  const purchaseUnit = purchaseUnits[0] || {};
  const capture = purchaseUnit.payments?.captures?.[0] || {};
  const amount = capture.amount || purchaseUnit.amount || { value: '0.00', currencyCode: 'USD' };
  const payee = purchaseUnit.payee || { emailAddress: 'N/A' };
  const shipping = purchaseUnit.shipping || { address: {}, name: { fullName: 'N/A' } };

  return (
    <div className="products-checkout-page">
      <div className="checkout-content">
        <div className="order-success-container">
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
              <span className="detail-value">{formatOrderDate(createTime)}</span>
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
            {checkoutItems.map(({ product, orderQuantity }) => {
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
            })}
          </div>

          <div className="action-buttons">
            <button className="continue-shopping-btn" onClick={() => navigate('/my-orders')}>
              Back to My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderViewPage;