// src/pages/MyOrdersPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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

const formatDateHeader = (dateString) => {
  if (dateString === 'unknown') return 'Unknown Date';
  const [y, m, d] = dateString.split('-');
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('en-US', {
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
const OrderCard = ({ order, onView, onDelete }) => {
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
        <ImageLoader src={firstImage} alt={`Order ${order.id}`} />
      </div>
      <div className="order-card-actions">
        <button onClick={onView} className="action-btn view">Details</button>
        <button onClick={onDelete} className="action-btn delete">Delete</button>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------
   Main Page
   -------------------------------------------------------------- */
const MyOrdersPage = () => {
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
      showNotification('Failed to load orders.', 'error');
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
      showNotification('Order deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('Failed to delete order.', 'error');
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
    <div>
      <h2>My Orders</h2>

      {/* Date filter */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <label htmlFor="date-filter" style={{ marginRight: '0.5rem', fontWeight: 500 }}>
          Filter by date:
        </label>
        <select
          id="date-filter"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '6px 12px',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
          }}
        >
          <option value="">All Dates</option>
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

      {filteredGroups.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>
          No orders {selectedDate ? 'on this date' : 'saved yet'}.
        </p>
      ) : (
        <>
          {displayedGroups.map(({ date, visible, totalCount }) => (
            <div key={date} className="date-group">
              <h3 className="date-header">
                <span className="date-full">
                  {formatDateHeader(date)} ({totalCount} order{totalCount > 1 ? 's' : ''})
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
                Load More
              </button>
            </div>
          )}
        </>
      )}

      <div className="action-buttons" style={{ marginTop: '2rem' }}>
        <button className="continue-shopping-btn" onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Order?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={executeDelete} className="modal-btn danger">Delete</button>
              <button onClick={cancelDelete} className="modal-btn cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;