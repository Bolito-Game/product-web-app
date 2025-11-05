// src/pages/MyOrdersPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, deleteOrder } from '../utils/indexedDB';
import { NotificationContext } from '../contexts/NotificationContext';
import Loader from '../components/Loader';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [sortColumn, setSortColumn] = useState('id'); // Default sort by Order ID
  const [sortDirection, setSortDirection] = useState('asc'); // Default ascending
  const { showNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      showNotification('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const confirmDelete = (id) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);

  const executeDelete = async () => {
    try {
      await deleteOrder(deleteId);
      setOrders((prevOrders) => prevOrders.filter((o) => o.id !== deleteId));
      setDeleteId(null);
      showNotification('Order deleted successfully.');
    } catch (error) {
      showNotification('Failed to delete order.', 'error');
      setDeleteId(null);
    }
  };

  const viewOrder = (order) => {
    navigate('/order-view', { state: { order } });
  };

  const fmt = (v, c) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c || 'USD' }).format(v);
  const formatDate = (d) => new Date(d).toLocaleString();

  // Handle column header click to sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Memoized sorted orders
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortColumn === 'id') {
        return multiplier * a.id.localeCompare(b.id);
      } else if (sortColumn === 'savedAt') {
        return multiplier * (new Date(b.savedAt) - new Date(a.savedAt));
      }
      return 0;
    });
  }, [orders, sortColumn, sortDirection]);

  if (loading) return <div className="detail-loader-container"><Loader /></div>;

  return (
    <div className="products-checkout-page">
      <div className="checkout-content">
        <h2>My Orders</h2>

        {sortedOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            No orders saved yet. Complete a purchase to see it here.
          </p>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th className="table-th" onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                    Order ID
                    {sortColumn === 'id' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </th>
                  <th className="table-th" onClick={() => handleSort('savedAt')} style={{ cursor: 'pointer' }}>
                    Date
                    {sortColumn === 'savedAt' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => {
                  const amount = order.details.purchaseUnits?.[0]?.amount || order.details.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount;
                  return (
                    <tr key={order.id}>
                      <td className="table-td">{order.id}</td>
                      <td className="table-td">{formatDate(order.savedAt)}</td>
                      <td className="table-td">{fmt(amount?.value || 0, amount?.currencyCode)}</td>
                      <td className="table-td">{order.checkoutItems.length}</td>
                      <td className="table-td">
                        <div className="table-action-buttons">
                          <button onClick={() => viewOrder(order)} className="action-btn view">
                            View
                          </button>
                          <button onClick={() => confirmDelete(order.id)} className="action-btn delete">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="action-buttons" style={{ marginTop: '2rem' }}>
          <button className="continue-shopping-btn" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Order?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={executeDelete} className="modal-btn danger">
                Delete
              </button>
              <button onClick={cancelDelete} className="modal-btn cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;