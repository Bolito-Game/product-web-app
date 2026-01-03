// src/pages/OrderSuccessPage.jsx
import React, { useContext, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationContext } from '../contexts/NotificationContext';
import { saveOrder } from '../database/orders';
import Loader from '../components/Loader';
import { useDeleteFromCart } from '../hooks/useShoppingCart';

const OrderSuccessPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  // Extract order details and checkout items from location.state
  const orderDetails = location.state?.details?.details;
  const checkoutItems = location.state?.checkoutItems;
  const fromCart = location.state?.fromCart === true;

  const { deleteFromCart } = useDeleteFromCart(checkoutItems || []);

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
        showNotification(t('order_success.save_error'), 'error');
      });
    }

    if (fromCart && !hasDeletedCart.current) {
      deleteFromCart();
      hasDeletedCart.current = true;
    }
  }, [orderDetails, checkoutItems, showNotification, fromCart, t, deleteFromCart]);

  // Handle missing order details
  if (!orderDetails) {
    showNotification(t('order_success.no_details'));
    setTimeout(() => navigate('/'), 2000);
    return (
      <div className="detail-loader-container">
        <Loader />
      </div>
    );
  }

  // Format currency
  const fmtPrice = (value, currency) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value ?? 0);

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      return t('order_success.date_not_available');
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return t('order_success.invalid_date');
    }
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(date);
  };

  // Extract order data with safe fallbacks
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
        <h2>{t('order_success.title')}</h2>

        <div className="order-success-container">
          <div className="success-message">
            <h3>{t('order_success.thank_you')}</h3>
            <p>{t('order_success.payment_success')}</p>
          </div>

          <div className="order-details">
            <h4>{t('order_success.order_details')}</h4>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.order_id')}:</span>
              <span className="detail-value">{orderId}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.status')}:</span>
              <span className="detail-value status-completed">{status}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.order_date')}:</span>
              <span className="detail-value">{formatDate(createTime)}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.total_amount')}:</span>
              <span className="detail-value">
                {fmtPrice(amount.value, amount.currencyCode)}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.payer')}:</span>
              <span className="detail-value">
                {payer.name
                  ? `${payer.name.givenName} ${payer.name.surname}`
                  : t('order_success.na')}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.email')}:</span>
              <span className="detail-value">{payer.emailAddress || t('order_success.na')}</span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.shipping_address')}:</span>
              <span className="detail-value">
                {shipping.address?.addressLine1
                  ? `${shipping.address.addressLine1}, ${shipping.address.adminArea2}, ${shipping.address.adminArea1} ${shipping.address.postalCode}, ${shipping.address.countryCode}`
                  : t('order_success.na')}
              </span>
            </div>
            <div className="order-detail-row">
              <span className="detail-label">{t('order_success.payee_email')}:</span>
              <span className="detail-value">{payee.emailAddress}</span>
            </div>
          </div>

          <div className="checkout-items-list">
            <h4>{t('order_success.order_summary')}</h4>
            {checkoutItems && checkoutItems.length > 0 ? (
              checkoutItems.map(({ product, orderQuantity }) => {
                const loc = product.localizations?.[0] || {};
                return (
                  <div key={product.sku} className="checkout-item-row">
                    <img
                      src={product.imageUrl || '/path/to/placeholder-image.jpg'}
                      alt={loc.productName || t('order_success.product')}
                      className="checkout-item-image"
                    />
                    <div className="checkout-item-details">
                      <span className="item-name">{loc.productName || t('order_success.na')}</span>
                      <span className="item-price">
                        {fmtPrice(loc.price, loc.currency)}
                      </span>
                    </div>
                    <div className="checkout-item-quantity">
                      <span>
                        {t('order_success.quantity')}: {orderQuantity}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>{t('order_success.no_items')}</p>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="continue-shopping-btn"
              onClick={() => navigate('/')}
            >
              {t('order_success.continue_shopping')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;