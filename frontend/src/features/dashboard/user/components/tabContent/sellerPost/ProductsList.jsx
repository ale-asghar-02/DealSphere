import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconStar, IconEdit, IconCircleCheck, IconCirclePlus, IconTrash, IconRefresh, IconBan, IconInfoCircle } from "@tabler/icons-react";

import useSellerProduct from "../../../hooks/useSellerProduct";
import { useSocket } from "@/contexts/SocketContext";
import FeaturedModal from "../../../../../featureOrder/components/featureModel";

import { PRODUCT_STATUS_BADGE, LOCKED_STATUSES, formatDate } from "./shared/postConstants";
import ConfirmModal from "./shared/ConfirmModal";
import ReasonModal from "./shared/ReasonModal";
import EditProductModal from "./models/EditProductModal";
import StockModal from "./models/StockModal";

const ProductsList = ({ statusFilter }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    productLoading,
    fieldErrors,
    setFieldErrors,
    products = [],
    handleSellerReadProducts,
    refreshProducts,
    handleSellerUpdateProduct,
    handleSellerDeleteProduct,
    handleSellerMarkAsSold,
    handleSellerRenewProduct,
    handleSellerUpdateStock,
  } = useSellerProduct();

  useEffect(() => { handleSellerReadProducts?.() }, []);

  // Admin moderation result (approved / rejected / needs changes) -> update the list instantly.
  // AdsList already did this; ProductsList did not, so products only changed after a page refresh.
  useEffect(() => {
    if (!socket) return;

    const onModerationUpdate = (data) => {
      if (data.type !== "product") return; // use the exact type value your backend sends for products

      refreshProducts?.(); // silent reload of the list + subscription usage

      if (data.status === "active") {
        toast.success("Your product is now live! 🎉");
      } else if (data.status === "rejected") {
        toast.error("Your product was rejected! Check reason");
      } else {
        toast.info("Your product was reviewed and needs some improvements");
      }
    };

    socket.on("moderationUpdate", onModerationUpdate);

    return () => socket.off("moderationUpdate", onModerationUpdate);
  }, [socket]);

  const filteredProducts = statusFilter ? products.filter((p) => p.status === statusFilter) : products;

  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  const handleViewCardDetail = (product) => {
    if (product.status !== "active" || product.isBannedProduct) {
      toast.error("This product is not available");
      return;
    }
    const categorySlug = product.category?.slug;
    const subSlug = product.subCategory?.slug || "all";
    navigate({
      pathname: `/product/${categorySlug}/${subSlug}/${encodeURIComponent(product.title)}-${product._id}`,
      search: window.location.search,
    });
  };

  return (
    <div className="table-responsive border rounded-2">
      <table className="table table-hover rounded-2 align-middle mb-0">
        <thead>
          <tr>
            <th className="rounded-start">No.</th>
            <th className="text-start" style={{ width: "300px" }}>Activity</th>
            <th>Price</th>
            <th>Status</th>
            <th>Date</th>
            <th>Stock</th>
            <th className="rounded-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Only show "Loading..." on the very first load, so edit/delete/sold never flash the table */}
          {productLoading && products.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
          ) : filteredProducts.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-4 text-muted">No products found</td></tr>
          ) : (
            filteredProducts.map((product, idx) => {
              const lowStock = Number(product.stock) < 10;
              const isFeatured = product.featured?.isFeatured;
              const isLocked = LOCKED_STATUSES.includes(product.status);

              return (
                <tr key={product._id} className="border-bottom" onClick={() => handleViewCardDetail(product)} style={{ cursor: "pointer" }}>
                  <td className="px-xl-0">{idx + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={product.productImages?.[0]?.url}
                        className="border rounded-2 me-2"
                        style={{ width: "80px", height: "50px", objectFit: "cover" }}
                        alt={product.title}
                      />
                      <div className="text-start" style={{ width: "250px" }}>
                        <p className="text-truncate mb-0">{product.title}</p>
                        <div className="d-flex align-items-center gap-1 flex-wrap" style={{ width: "fit-content" }}>
                          {isFeatured && (
                            <>
                              <span className="badge rounded-pill text-bg-warning fw-normal d-flex align-items-center">
                                <IconStar className="me-1" stroke={2} size={12} />
                                <span>Featured</span>
                              </span>
                              <span className="text-body-secondary" style={{ fontSize: "12px" }}>
                                Expire : {formatDate(product.featured?.until)}
                              </span>
                            </>
                          )}
                          {product.isBannedProduct && (
                            <span className="badge rounded-pill text-bg-danger fw-normal d-flex align-items-center">
                              <IconBan className="me-1" stroke={2} size={12} />
                              <span>Banned</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>Rs {product.price}{product.isPriceNegotiable && <span className="text-muted small"> (negotiable)</span>}</td>
                  <td>
                    <span className={`badge fw-normal p-2 ${PRODUCT_STATUS_BADGE[product.status] || "text-bg-secondary"}`}>
                      {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(product.createdAt)}</td>
                  <td className={lowStock ? "text-danger fw-semibold" : ""}>{product.stock ?? "-"}</td>
                  <td>
                    {isLocked ? (
                      <span className="text-muted small" onClick={(e) => e.stopPropagation()}>No actions available</span>
                    ) : (
                      <div className="d-flex" onClick={(e) => e.stopPropagation()} style={{ width: "fit-content" }}>

                        {["pending", "active", "rejected"].includes(product.status) && (
                          <>
                            {product.status === "rejected" && product.moderationReason && (
                              <button type="button" title="View Reason" className="btn btn-sm btn-outline-secondary me-1 p-0" onClick={() => setActiveModal({ type: "reason", product })}>
                                <IconInfoCircle stroke={1.5} size={20} />
                              </button>
                            )}
                            <button type="button" title="Edit" className="btn btn-sm btn-outline-primary me-1 p-0" onClick={() => setActiveModal({ type: "edit", product })}>
                              <IconEdit stroke={1.5} size={20} />
                            </button>
                          </>

                        )}
                        {product.status === "active" && !isFeatured && (
                          <button type="button" title="Make Featured" className="btn btn-sm btn-outline-warning me-1 p-0" onClick={() => setActiveModal({ type: "featured", product })}>
                            <IconStar stroke={1.5} size={20} />
                          </button>
                        )}

                        {/* Stock 0 ho ya 5 ho, jab tak product locked (deleted/banned) nahi, option hamesha milna chahiye — is liye status === "active" wali extra shart hata di */}
                        {lowStock && (
                          <button type="button" title="Update Stock" className="btn btn-sm btn-outline-secondary me-1 p-0" onClick={() => setActiveModal({ type: "stock", product })}>
                            <IconCirclePlus stroke={1.5} size={20} />
                          </button>
                        )}

                        {product.status === "active" && (
                          <button type="button" title="Mark as Sold" className="btn btn-sm btn-outline-success me-1 p-0" onClick={() => setActiveModal({ type: "sold", product })}>
                            <IconCircleCheck stroke={1.5} size={20} />
                          </button>
                        )}

                        {product.status === "expired" && (
                          <button type="button" title="Renew" className="btn btn-sm btn-outline-warning me-1 p-0" onClick={() => setActiveModal({ type: "renew", product })}>
                            <IconRefresh stroke={1.5} size={16} />
                          </button>
                        )}

                        <button type="button" title="Delete" className="btn btn-sm btn-outline-danger p-0" onClick={() => setActiveModal({ type: "delete", product })}>
                          <IconTrash stroke={1.5} size={20} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {activeModal?.type === "reason" && (
        <ReasonModal item={activeModal.product} onClose={closeModal} />
      )}
      {activeModal?.type === "edit" && (
        <EditProductModal product={activeModal.product} onClose={closeModal} handleSellerUpdateProduct={handleSellerUpdateProduct} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />
      )}
      {activeModal?.type === "featured" && (
        <FeaturedModal ad={activeModal.product} itemType="product" onClose={closeModal} onFeatured={refreshProducts} />
      )}
      {activeModal?.type === "stock" && (
        <StockModal product={activeModal.product} onClose={closeModal} handleSellerUpdateStock={handleSellerUpdateStock} />
      )}
      {activeModal?.type === "sold" && (
        <ConfirmModal
          title="Mark as Sold"
          message={`Are you sure you want to mark "${activeModal.product.title}" as sold?`}
          confirmText="Yes, Mark as Sold"
          confirmClass="btn-success"
          onConfirm={async () => { await handleSellerMarkAsSold?.(activeModal.product._id); closeModal(); }}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === "renew" && (
        <ConfirmModal
          title="Renew Product"
          message={`Are you sure you want to renew "${activeModal.product.title}"? This will extend the listing period.`}
          confirmText="Yes, Renew"
          confirmClass="btn-warning"
          onConfirm={async () => { await handleSellerRenewProduct?.(activeModal.product._id); closeModal(); }}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === "delete" && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${activeModal.product.title}"? It will be hidden from listings, but you can still see it under the "Deleted" tab.`}
          confirmText="Yes, Delete"
          confirmClass="btn-danger"
          onConfirm={async () => { await handleSellerDeleteProduct?.(activeModal.product._id); closeModal(); }}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ProductsList;