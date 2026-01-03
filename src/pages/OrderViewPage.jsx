// src/pages/OrderViewPage.jsx
import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationContext } from '../contexts/NotificationContext';

const OrderViewPage = () => {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);
  const order = state?.order;

  if (!order) {
    showNotification(t('order_view.not_found'), 'error');
    // Optionally redirect after a delay
    setTimeout(() => navigate('/my-orders'), 2000);
    return null;
  }

  const { details, checkoutItems } = order;

  // Format currency respecting current locale
  const fmtPrice = (value, currency) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value ?? 0);

  // Safe date formatting
  const formatOrderDate = (dateString) => {
    if (!dateString) return t('order_view.date_not_available');
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return t('order_view.invalid_date');
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(d);
  };

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
        <h2>{t('order_view.title')}</h2>

        <div className="order-success-container">
          <div className="order-details">
            <h4>{t('order_view.order_details')}</h4>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.order_id')}:</span>
              <span className="detail-value">{orderId}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.status')}:</span>
              <span className="detail-value status-completed">{status}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.order_date')}:</span>
              <span className="detail-value">{formatOrderDate(createTime)}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.total_amount')}:</span>
              <span className="detail-value">
                {fmtPrice(amount.value, amount.currencyCode)}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.payer')}:</span>
              <span className="detail-value">
                {payer.name
                  ? `${payer.name.givenName} ${payer.name.surname}`
                  : t('order_view.na')}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.email')}:</span>
              <span className="detail-value">{payer.emailAddress || t('order_view.na')}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.shipping_address')}:</span>
              <span className="detail-value">
                {shipping.address?.addressLine1
                  ? `${shipping.address.addressLine1}, ${shipping.address.adminArea2}, ${shipping.address.adminArea1} ${shipping.address.postalCode}, ${shipping.address.countryCode}`
                  : t('order_view.na')}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_view.payee_email')}:</span>
              <span className="detail-value">{payee.emailAddress}</span>
            </div>
          </div>

          <div className="checkout-items-list">
            <h4>{t('order_view.order_summary')}</h4>
            {checkoutItems && checkoutItems.length > 0 ? (
              checkoutItems.map(({ product, orderQuantity }) => {
                const loc = product.localizations?.[0] || {};
                return (
                  <div key={product.sku} className="checkout-item-row">
                    <img
                      src={product.imageUrl || '/path/to/placeholder-image.jpg'}
                      alt={loc.productName || t('order_view.product')}
                      className="checkout-item-image"
                    />
                    <div className="checkout-item-details">
                      <span className="item-name">{loc.productName || t('order_view.na')}</span>
                      <span className="item-price">
                        {fmtPrice(loc.price, loc.currency)}
                      </span>
                    </div>
                    <div className="checkout-item-quantity">
                      <span>
                        {t('order_view.quantity')}: {orderQuantity}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>{t('order_view.no_items')}</p>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="continue-shopping-btn"
              onClick={() => navigate('/my-orders')}
            >
              {t('order_view.back_to_orders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderViewPage;