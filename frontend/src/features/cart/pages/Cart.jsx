import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconTrash, IconShoppingBag } from '@tabler/icons-react'
import { toast } from 'react-toastify' // apni toast library ke hisab se badlo

import { useCartContext } from '../CartContext'

import Navbar from "@/components/Navbar/Navbar"
import Modal from "@/components/Model"
import CartItem from '../components/CartItem'
import { Shimmer, NoImage } from '@/components/Shimmer'

// CartItem ka loading skeleton (same layout, same sizes)
const CartItemSkeleton = () => (
  <div className="card border-0 border-bottom rounded-0 py-3">
    <div className="d-flex flex-wrap flex-md-nowrap gap-3 align-items-start">

      {/* Image: shimmer bg + chhota icon */}
      <div className="border rounded-2 overflow-hidden flex-shrink-0" style={{ width: '120px', height: '90px' }}>
        <NoImage loading showIcon showText={false} iconSize={28} />
      </div>

      <div className="flex-grow-1">
        {/* Title + remove button */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Shimmer width="60%" height="18px" />
          <Shimmer width="32px" height="32px" rounded="rounded-circle" className="ms-2 flex-shrink-0" />
        </div>

        {/* Price */}
        <Shimmer width="90px" height="16px" className="mb-2" />

        {/* Quantity + stock + subtotal */}
        <div className="d-flex flex-wrap column-gap-4 row-gap-2 align-items-center">
          <Shimmer width="80px" height="25px" />
          <Shimmer width="110px" height="16px" />
          <Shimmer width="100px" height="16px" className="ms-auto" />
        </div>
      </div>

    </div>
  </div>
)

// Order Summary ka loading skeleton
const OrderSummarySkeleton = () => (
  <div className="card border rounded-2 p-4">
    <Shimmer width="50%" height="22px" className="mb-4" />

    <div className="d-flex justify-content-between mb-3">
      <Shimmer width="90px" height="16px" />
      <Shimmer width="70px" height="16px" />
    </div>
    <div className="d-flex justify-content-between">
      <Shimmer width="70px" height="16px" />
      <Shimmer width="40px" height="16px" />
    </div>

    <hr />

    <div className="d-flex justify-content-between mb-3 mt-1">
      <Shimmer width="50px" height="18px" />
      <Shimmer width="90px" height="22px" />
    </div>

    <Shimmer width="100%" height="48px" rounded="rounded-2" className="mb-2" />
    <Shimmer width="100%" height="48px" rounded="rounded-2" />
  </div>
)

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartLoading, handleGetCart, handleUpdateCartItem, handleRemoveFromCart, handleClearCart } = useCartContext()

  const [showClearModal, setShowClearModal] = useState(false)
  // pehli fetch complete hone tak true (taake "empty cart" ek second ke liye flash na ho)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const loadCart = async () => {
      await handleGetCart()
      setInitialLoading(false)
    }
    loadCart()
  }, [])

  const items = cart?.items || []
  const availableItems = items.filter((i) => !i.unavailableReason)
  const unavailableCount = items.length - availableItems.length
  // total sirf available items ka (backend se payableTotal aata hai)
  const total = cart?.payableTotal ?? cart?.totalPrice ?? 0

  // skeleton sirf tab jab abhi items nahi hain (quantity update par items hide nahi honge)
  const isLoading = items.length === 0 && (initialLoading || cartLoading)

  const handleQuantity = async (productId, newQuantity, stock) => {
    if (newQuantity < 1 || newQuantity > stock) return
    await handleUpdateCartItem({ productId, quantity: newQuantity })
  }

  const handleRemove = async (productId) => {
    await handleRemoveFromCart({ productId })
  }

  const handleConfirmClear = async () => {
    await handleClearCart()
    setShowClearModal(false)
  }

  const handleNavigateToProduct = (item) => {
    const product = item.product

    // stock kam ho to product page khul sakta hai, baaki unavailable par toast
    if (item.unavailableReason && item.unavailableReason !== "insufficient_stock") {
      toast.error("This product is currently unavailable")
      return
    }

    const categorySlug = product.category?.slug;
    const subSlug = product.subCategory?.slug || "all";

    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(product.title)}-${product._id}`,
      search: location.search,
    });
  };

  const handleCheckout = () => {
    if (availableItems.length === 0) {
      toast.error("No available items to checkout")
      return
    }
    navigate("/checkout", { state: { items: availableItems, source: "cart" } });
  };

  return (
    <div>
      <Navbar />

      <div className="container py-4" style={{ marginBottom: '120px' }}>
        <div className="d-flex align-items-center justify-content-between mb-md-4">
          <h4 className="fw-semibold mb-0" style={{ fontSize: 'calc(1rem + 0.5vw)' }}>
            {isLoading ? "My Cart" : `My Cart (${items.length} items)`}
          </h4>
          {!isLoading && items.length > 0 && (
            <button className="btn btn-outline-danger btn-sm rounded-2 py-2 px-2 px-md-3" onClick={() => setShowClearModal(true)}>
              <IconTrash size={16} className="me-2" />Clear All
            </button>
          )}
        </div>

        {isLoading ? (
          // loading: 1 skeleton card + summary skeleton
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <CartItemSkeleton />
            </div>
            <div className="col-12 col-lg-4">
              <OrderSummarySkeleton />
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" className="bi bi-cart-x mb-2" viewBox="0 0 16 16">
              <path d="M7.354 5.646a.5.5 0 1 0-.708.708L7.793 7.5 6.646 8.646a.5.5 0 1 0 .708.708L8.5 8.207l1.146 1.147a.5.5 0 0 0 .708-.708L9.207 7.5l1.147-1.146a.5.5 0 0 0-.708-.708L8.5 6.793z"/>
              <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
            </svg>
            <h5 className="fw-semibold mb-2 mt-3">Your cart is empty</h5>
            <p className="text-muted mb-3">Browse products and add them to your cart</p>
            <button className="btn btn-primary rounded-2 px-4" style={{ paddingBlock: '12px' }} onClick={() => navigate('/products')}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="row g-4">

            {/* Cart Items */}
            <div className="col-12 col-lg-8">
              {items.map((item) => (
                <CartItem
                  key={item.product?._id}
                  item={item}
                  cartLoading={cartLoading}
                  onQuantityChange={handleQuantity}
                  onRemove={handleRemove}
                  onViewItem={handleNavigateToProduct}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="col-12 col-lg-4">
              <div className="card border rounded-2 p-4">
                <h5 className="fw-semibold mb-3">Order Summary</h5>

                {unavailableCount > 0 && (
                  <div className="alert alert-warning py-2 small">
                    {unavailableCount} item(s) are unavailable and won't be included in checkout.
                  </div>
                )}

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Items ({availableItems.length})</span>
                  <span>Rs {total.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Delivery</span>
                  <span className="text-success">Free</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-3 mt-1">
                  <span className="fw-medium">Total</span>
                  <span className="fw-semibold text-primary fs-5">Rs {total.toLocaleString()}</span>
                </div>

                <button
                  className="btn btn-primary w-100 rounded-2 mb-2"
                  onClick={handleCheckout}
                  disabled={cartLoading || availableItems.length === 0}
                  style={{ paddingBlock: '12px' }}
                >
                  <IconShoppingBag size={18} className="me-2" />Checkout
                </button>
                <button className="btn btn-outline-secondary w-100 rounded-2" style={{ paddingBlock: '12px' }}
                  onClick={() => navigate('/products')}>
                  Continue Shopping
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Clear Cart Confirm Modal */}
      <Modal
        title="Clear Cart"
        show={showClearModal}
        onClose={() => setShowClearModal(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowClearModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={handleConfirmClear} disabled={cartLoading}>
              <IconTrash size={16} className="me-2" />Clear All
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          Are you sure you want to remove all items from your cart? This action cannot be undone.
        </p>
      </Modal>

    </div>
  )
}

export default Cart