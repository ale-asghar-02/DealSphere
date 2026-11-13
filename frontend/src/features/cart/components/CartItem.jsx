import React from 'react'
import { IconTrash, IconMinus, IconPlus } from '@tabler/icons-react'

import { NoImage } from '@/components/Shimmer'

const REASON_LABELS = {
  seller_unavailable: "Seller unavailable",
  hidden: "Currently unavailable",
  out_of_stock: "Out of stock",
  insufficient_stock: "Not enough stock",
  sold: "Sold",
  soldout: "Sold out",
  expired: "Expired",
  pending: "Currently unavailable",
  rejected: "Currently unavailable",
  deleted: "Currently unavailable",
}

const CartItem = ({ item, cartLoading, onQuantityChange, onRemove, onViewItem }) => {
  const image = item.product?.productImages?.[0]?.url;

  const reason = item.unavailableReason
  const isUnavailable = !!reason
  // stock kam ho to user quantity ghata sakta hai, baaki sab me lock
  const canDecrease = !isUnavailable || reason === "insufficient_stock"

  return (
    <div className="card border-0 border-bottom rounded-0 py-3">
      <div className="d-flex flex-wrap flex-md-nowrap gap-3 align-items-start">

        {/* Image: image na ho to grey bg + chhota icon */}
        <div className="border rounded-2 overflow-hidden flex-shrink-0"
          style={{ width: '120px', height: '90px', opacity: isUnavailable ? 0.5 : 1 }}>
          {image ? (
            <img
              src={image}
              alt={item.product?.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <NoImage showIcon showText={false} iconSize={28} />
          )}
        </div>

        {/* Details */}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="fw-medium mb-0" style={{ fontSize: '16px', opacity: isUnavailable ? 0.6 : 1 }}>
              {item.product?.title}
            </h6>
            <button className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center ms-2 flex-shrink-0"
              style={{ width: '32px', height: '32px', padding: 0 }}
              onClick={() => onRemove(item.product?._id)}
              disabled={cartLoading}>
              <IconTrash size={16} />
            </button>
          </div>

          <div className='d-flex flex-wrap align-items-center gap-2'>
            <p className="text-primary fw-medium mb-1 pe-2" style={{ opacity: isUnavailable ? 0.6 : 1 }}>
              Rs {item.price?.toLocaleString()}
            </p>

            {isUnavailable && (
              <span className="badge text-bg-danger fw-medium rounded-1 mb-2">
                {REASON_LABELS[reason] || "Unavailable"}
              </span>
            )}
          </div>

          {/* Quantity */}
          <div className="d-flex flex-wrap column-gap-4 row-gap-2 align-items-center">
            <div className="d-flex flex-wrap align-items-center">
              <div className="bg-white border d-flex align-items-center justify-content-center" style={{ width: '25px', height: '25px' }}>
                <button
                  className="btn border-0 p-0 d-flex align-items-center justify-content-center"
                  onClick={() => onQuantityChange(item.product?._id, item.quantity - 1, item.product?.stock)}
                  disabled={cartLoading || !canDecrease}>
                  <IconMinus size={12} />
                </button>
              </div>
              <div className="bg-white border-top border-bottom d-flex align-items-center justify-content-center" style={{ width: '30px', height: '25px', fontSize: '12px', paddingTop: '1px' }}>
                {item.quantity}
              </div>
              <div className="bg-white border d-flex align-items-center justify-content-center" style={{ width: '25px', height: '25px' }}>
                <button
                  className="btn border-0 p-0 d-flex align-items-center justify-content-center"
                  onClick={() => onQuantityChange(item.product?._id, item.quantity + 1, item.product?.stock)}
                  disabled={cartLoading || isUnavailable || item.quantity >= item.product?.stock}>
                  <IconPlus size={12} />
                </button>
              </div>

              <span className="text-muted ms-2" style={{ fontSize: '13px' }}>
                Available Stock:{" "}
                <span
                  className={`border rounded-1 px-2 ${item.product?.stock < 6 ? "text-danger border-danger" : "text-success border-success"}`}
                  style={{
                    backgroundColor: item.product?.stock < 6
                      ? "rgba(220, 53, 70, 0.06)"
                      : "rgba(25, 135, 84, 0.06)"
                  }}>
                  {item.product?.stock}
                </span>
              </span>
            </div>

            <div className='col d-flex align-items-center justify-content-between'>
              <span className="text-muted" style={{ fontSize: '13px' }}>Subtotal:{" "}
                <span className="text-dark fw-medium">Rs {((item.price || 0) * item.quantity).toLocaleString()}</span>
              </span>
              <span
                className="small icon-link icon-link-hover text-primary"
                onClick={() => onViewItem(item)}
                style={{ cursor: 'pointer' }}>
                View Item
                <svg xmlns="http://www.w3.org/2000/svg" className="bi" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CartItem