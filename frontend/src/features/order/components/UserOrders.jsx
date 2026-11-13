import React, { useContext, useEffect, useState } from 'react'
import { IconShoppingBag, IconTruckDelivery, IconTrash, IconX, IconCheck, IconMapPin, IconPhone, IconCircleCheck, IconClock } from '@tabler/icons-react'
import { AuthContext } from '../../auth/AuthContext'
import useOrder from '../hooks/useOrder'
import Modal from "@/components/Model"

const STATUS_BADGE = {
  pending: 'text-warning border-warning',
  processing: 'text-info border-info',
  shipped: 'text-primary border-primary',
  delivered: 'text-success border-success',
  cancelled: 'text-danger border-danger',
}

// NOTE: "delivered" is intentionally NOT a seller-selectable next status.
// It is only set when the buyer confirms receipt (confirm-receipt endpoint),
// because that's what triggers escrow release / wallet credit for the seller.
// Letting sellers set "delivered" directly would bypass that payment logic.
const ORDER_STATUS_FLOW = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: [],
  delivered: [],
  cancelled: [],
}

const UserOrders = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('buyer') // "buyer" | "seller"
  const [showClearModal, setShowClearModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [confirmReceiptTarget, setConfirmReceiptTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const {
    orderLoading,
    orders,
    handleGetMyOrders,
    handleCancelOrder,
    handleConfirmReceipt,
    handleDeleteMyOrder,
    handleDeleteAllMyOrders,
    handleGetSellerOrders,
    handleUpdateOrderStatus,
    handleDeleteSellerOrder,
    handleDeleteAllSellerOrders,
  } = useOrder()

  useEffect(() => {
    if (activeTab === 'buyer') {
      handleGetMyOrders()
    } else {
      handleGetSellerOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const confirmCancel = async () => {
    await handleCancelOrder(cancelTarget)
    setCancelTarget(null)
    handleGetMyOrders()
  }

  const confirmDeliveryReceipt = async () => {
    await handleConfirmReceipt(confirmReceiptTarget)
    setConfirmReceiptTarget(null)
    handleGetMyOrders()
  }

  // "Remove" now always asks for confirmation first — prevents accidental
  // deletes (e.g. clicking Remove when meaning to click Confirm Receipt)
  const confirmDelete = async () => {
    if (activeTab === 'buyer') {
      await handleDeleteMyOrder(deleteTarget)
      handleGetMyOrders()
    } else {
      await handleDeleteSellerOrder(deleteTarget)
      handleGetSellerOrders()
    }
    setDeleteTarget(null)
  }

  const handleUpdateStatus = async (orderId, orderStatus) => {
    await handleUpdateOrderStatus(orderId, orderStatus)
    handleGetSellerOrders()
  }

  const handleConfirmClearAll = async () => {
    if (activeTab === 'buyer') {
      await handleDeleteAllMyOrders()
      handleGetMyOrders()
    } else {
      await handleDeleteAllSellerOrders()
      handleGetSellerOrders()
    }
    setShowClearModal(false)
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h1 className="fs-5 me-3 mb-0">My Orders</h1>
          <button
            className="btn btn-outline-danger btn-sm rounded-1"
            onClick={() => setShowClearModal(true)}
            disabled={orders.length < 1}>
            <IconTrash size={16} className="me-2" />
            Clear All
          </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'buyer' ? 'active' : ''}`}
            onClick={() => setActiveTab('buyer')}
          >
            <IconShoppingBag size={16} />
            My Purchases
          </button>
        </li>
        {user?.accountType === "seller" && (
          <li className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveTab('seller')}
            >
              <IconTruckDelivery size={16} />
              Orders Received
            </button>
          </li>
        )}
      </ul>

      {/* Order list */}
      {orderLoading && orders.length === 0 ? (
        <div className="text-center py-5 text-muted">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-5">
          <IconShoppingBag size={50} className="text-muted mb-2" />
          <h5 className="fw-semibold mb-2 mt-3">
            {activeTab === 'buyer' ? 'No purchases yet' : 'No orders received yet'}
          </h5>
          <p className="text-muted mb-0">
            {activeTab === 'buyer'
              ? 'Orders you place will show up here'
              : 'Orders for your products will show up here'}
          </p>
        </div>
      ) : (
        orders.map((order) => {
          const badgeClass = STATUS_BADGE[order.orderStatus] || 'text-muted border-secondary'
          const nextStatuses = ORDER_STATUS_FLOW[order.orderStatus] || []

          return (
            <div key={order._id} className="border rounded-3 p-3 p-md-4 mb-3">
              {/* Header */}
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                  <p className="mb-0 fw-medium small">Order #{order._id?.slice(-8).toUpperCase()}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize ${badgeClass}`}>
                  {order.orderStatus}
                </span>
              </div>

              {/* Items */}
              <div className="d-flex flex-column gap-2 mb-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2">
                    <img
                      src={item.image || 'https://via.placeholder.com/60'}
                      alt={item.title}
                      width={50}
                      height={50}
                      className="rounded-2 object-fit-cover border flex-shrink-0"
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="mb-0 small fw-medium text-truncate">{item.title}</p>
                      <p className="mb-0 text-muted small">Qty: {item.quantity}</p>
                    </div>
                    <span className="small fw-medium flex-shrink-0">
                      Rs {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping address */}
              {order.shippingAddress && (
                <div className="border-top pt-3 mb-3">
                  <p className="mb-1 small text-muted d-flex align-items-center gap-2">
                    <IconMapPin size={14} />
                    {order.shippingAddress.fullName}, {order.shippingAddress.addressLine},{' '}
                    {order.shippingAddress.city}, {order.shippingAddress.country}
                  </p>
                  <p className="mb-0 small text-muted d-flex align-items-center gap-2">
                    <IconPhone size={14} />
                    {order.shippingAddress.phoneNumber}
                  </p>
                </div>
              )}

              {/* Footer: total + payment method */}
              <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-3">
                <span className="small text-muted text-uppercase">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                </span>
                <span className="fw-semibold text-primary">Rs {order.totalPrice?.toLocaleString()}</span>
              </div>

              {/* Seller-side status info banners */}
              {activeTab === 'seller' && order.orderStatus === 'shipped' && (
                <div className="alert alert-info d-flex align-items-center gap-2 py-2 px-3 mb-3" style={{ fontSize: '13px' }}>
                  <IconClock size={16} className="flex-shrink-0" />
                  Waiting for buyer to confirm receipt — payment will be released to your wallet automatically once they do.
                </div>
              )}
              {activeTab === 'seller' && order.orderStatus === 'delivered' && (
                <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3" style={{ fontSize: '13px' }}>
                  <IconCircleCheck size={16} className="flex-shrink-0" />
                  Buyer confirmed receipt — payment has been released to your wallet.
                </div>
              )}

              {/* Actions */}
              <div className="d-flex flex-wrap gap-2">
                {activeTab === 'buyer' && (
                  <>
                    {['pending', 'processing'].includes(order.orderStatus) && (
                      <button
                        className="btn btn-outline-danger btn-sm rounded-1"
                        onClick={() => setCancelTarget(order._id)}
                        disabled={orderLoading}
                      >
                        <IconX size={14} className="me-1" />
                        Cancel Order
                      </button>
                    )}
                    {order.orderStatus === 'shipped' && (
                      <button
                        className="btn btn-success btn-sm rounded-1"
                        onClick={() => setConfirmReceiptTarget(order._id)}
                        disabled={orderLoading}
                      >
                        <IconCheck size={14} className="me-1" />
                        Confirm Receipt
                      </button>
                    )}
                    <button
                      className="btn btn-outline-secondary btn-sm rounded-1"
                      onClick={() => setDeleteTarget(order._id)}
                      disabled={orderLoading}
                    >
                      <IconTrash size={14} className="me-1" />
                      Remove
                    </button>
                  </>
                )}

                {activeTab === 'seller' && (
                  <>
                    {nextStatuses.length > 0 && (
                      <div className="d-flex align-items-center gap-2">
                        <IconTruckDelivery size={16} className="text-muted" />
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto' }}
                          value=""
                          onChange={(e) => e.target.value && handleUpdateStatus(order._id, e.target.value)}
                          disabled={orderLoading}
                        >
                          <option value="">Update status</option>
                          {nextStatuses.map((status) => (
                            <option key={status} value={status}>
                              Mark as {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      className="btn btn-outline-secondary btn-sm rounded-1"
                      onClick={() => setDeleteTarget(order._id)}
                      disabled={orderLoading}
                    >
                      <IconTrash size={14} className="me-1" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })
      )}

      {/* Cancel confirm modal */}
      <Modal
        title="Cancel Order"
        show={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setCancelTarget(null)}>
              Keep Order
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={confirmCancel} disabled={orderLoading}>
              Cancel Order
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
      </Modal>

      {/* Confirm receipt modal */}
      <Modal
        title="Confirm Delivery"
        show={!!confirmReceiptTarget}
        onClose={() => setConfirmReceiptTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setConfirmReceiptTarget(null)}>
              Not Yet
            </button>
            <button type="button" className="btn btn-success rounded-2" onClick={confirmDeliveryReceipt} disabled={orderLoading}>
              Confirm Receipt
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          Have you received this order? Confirming will release payment to the seller. This action cannot be undone.
        </p>
      </Modal>

      {/* Remove (single order) confirm modal */}
      <Modal
        title="Remove Order"
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setDeleteTarget(null)}>
              Keep Order
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={confirmDelete} disabled={orderLoading}>
              <IconTrash size={16} className="me-2" />
              Remove
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          Are you sure you want to remove this order from your list? This only removes it from your view — it cannot be undone.
        </p>
      </Modal>

      {/* Clear all confirm modal */}
      <Modal
        title="Clear All Orders"
        show={showClearModal}
        onClose={() => setShowClearModal(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowClearModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={handleConfirmClearAll} disabled={orderLoading}>
              <IconTrash size={16} className="me-2" />
              Clear All
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          Are you sure you want to remove all orders from this list? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default UserOrders