// src/pages/MyOrdersPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllOrders, deleteOrder } from '../database/orders';
import { NotificationContext } from '../contexts/NotificationContext';
import Loader from '../components/Loader';
import ImageLoader from '../components/ImageLoader';

/* --------------------------------------------------------------
   Inline helpers – EXACT same parsing as OrderViewPage
   -------------------------------------------------------------- */
const getLocalDateString = (order) => {
  const createTime = order.details?.createTime;
  if (!createTime) return 'unknown';

  const d = new Date(createTime);
  if (isNaN(d.getTime())) return 'unknown';

  return d.toLocaleDateString('en-CA');
};

const formatDateHeader = (dateString, t) => {
  if (dateString === 'unknown') return t('my_orders.unknown_date');
  const [y, m, d] = dateString.split('-');
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/* --------------------------------------------------------------
   Group orders by local date (yyyy-mm-dd) from createTime – newest first
   -------------------------------------------------------------- */
const groupByDate = (orders) => {
  const map = {};
  orders.forEach((o) => {
    const key = getLocalDateString(o);
    if (!map[key]) map[key] = [];
    map[key].push(o);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a)) // newest date first
    .map(([date, list]) => ({
      date,
      orders: list.sort((a, b) => {
        const timeA = a.details?.createTime;
        const timeB = b.details?.createTime;
        return new Date(timeB) - new Date(timeA);
      }),
      totalCount: list.length,
    }));
};

/* --------------------------------------------------------------
   Order Card
   -------------------------------------------------------------- */
const OrderCard = ({ order, onView, onDelete, t }) => {
  let firstImage = null;
  for (const it of order.checkoutItems || []) {
    if (it.product?.imageUrl) {
      firstImage = it.product.imageUrl;
      break;
    }
  }

  return (
    <div className="product-card">
      <div onClick={onView} style={{ cursor: 'pointer' }}>
        <ImageLoader src={firstImage} alt={t('my_orders.order_alt', { id: order.id })} />
      </div>
      <div className="order-card-actions">
        <button onClick={onView} className="action-btn view">
          {t('my_orders.view_details')}
        </button>
        <button onClick={onDelete} className="action-btn delete">
          {t('my_orders.delete')}
        </button>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------
   Main Page
   -------------------------------------------------------------- */
const MyOrdersPage = () => {
  const { t } = useTranslation();
  const [allOrders, setAllOrders] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [visibleCount, setVisibleCount] = useState(25);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const { showNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  /* Load & sort by createTime (newest first) */
  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      const sorted = data.sort((a, b) => {
        const timeA = a.details?.createTime;
        const timeB = b.details?.createTime;
        return new Date(timeB) - new Date(timeA);
      });
      setAllOrders(sorted);
    } catch (err) {
      console.error('Failed to load orders:', err);
      showNotification(t('my_orders.load_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* Filter & group by createTime */
  useEffect(() => {
    let filtered = allOrders;
    if (selectedDate) {
      filtered = allOrders.filter(
        (o) => getLocalDateString(o) === selectedDate
      );
    }
    setFilteredGroups(groupByDate(filtered));
    setVisibleCount(25);
  }, [allOrders, selectedDate]);

  /* Delete */
  const confirmDelete = (id) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);
  const executeDelete = async () => {
    try {
      await deleteOrder(deleteId);
      const remaining = allOrders.filter((o) => o.id !== deleteId);
      setAllOrders(remaining);
      setDeleteId(null);
      showNotification(t('my_orders.delete_success'));
    } catch (err) {
      console.error('Delete error:', err);
      showNotification(t('my_orders.delete_error'), 'error');
      setDeleteId(null);
    }
  };

  const viewOrder = (order) => navigate('/order-view', { state: { order } });

  /* Pagination – flat across groups */
  let cumulative = 0;
  const displayedGroups = filteredGroups.map((g) => {
    const start = cumulative;
    cumulative += g.orders.length;
    const end = Math.min(cumulative, visibleCount);
    const visible = g.orders.slice(0, end - start);
    return { ...g, visible };
  }).filter(g => g.visible.length > 0);
  const hasMore = cumulative > visibleCount;

  /* Unique dates from createTime */
  const uniqueDates = Array.from(
    new Set(allOrders.map(o => getLocalDateString(o)).filter(d => d !== 'unknown'))
  ).sort((a, b) => b.localeCompare(a));

  if (loading) return <Loader />;

  return (
    <div className="my-orders-page">
      <div className="page-header">
        <h2>{t('my_orders.title')}</h2>

        {/* Date filter */}
        <div className="filter-container">
          <label htmlFor="date-filter">
            {t('my_orders.filter_label')}
          </label>
          <select
            id="date-filter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-select"
          >
            <option value="">{t('my_orders.all_dates')}</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="no-results">
          <p>
            {selectedDate
              ? t('my_orders.no_orders_date')
              : t('my_orders.no_orders_yet')}
          </p>
        </div>
      ) : (
        <>
          {displayedGroups.map(({ date, visible, totalCount }) => (
            <div key={date} className="date-group">
              <h3 className="date-header">
                <span className="date-full">
                  {formatDateHeader(date, t)} ({totalCount} {t('my_orders.order', { count: totalCount })})
                </span>
                <span className="date-compact">
                  {new Date(date).toLocaleDateString(undefined, {
                    year: '2-digit',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="count-compact"> ({totalCount})</span>
              </h3>

              <div className="product-grid product-grid-3">
                {visible.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onView={() => viewOrder(order)}
                    onDelete={() => confirmDelete(order.id)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="load-more-container">
              <button
                onClick={() => setVisibleCount(c => c + 25)}
                className="load-more-button"
              >
                {t('my_orders.load_more')}
              </button>
            </div>
          )}
        </>
      )}

      <div className="action-buttons">
        <button className="continue-shopping-btn" onClick={() => navigate('/')}>
          {t('my_orders.continue_shopping')}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t('my_orders.delete_confirm_title')}</h3>
            <p>{t('my_orders.delete_confirm_message')}</p>
            <div className="modal-actions">
              <button onClick={executeDelete} className="modal-btn danger">
                {t('my_orders.delete')}
              </button>
              <button onClick={cancelDelete} className="modal-btn cancel">
                {t('my_orders.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;