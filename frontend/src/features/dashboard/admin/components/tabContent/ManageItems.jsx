import { useState, useEffect } from "react";
import { IconBan, IconTrash, IconCheck, IconX, IconLockOpen, IconSpeakerphone, IconPackage, IconAlertTriangle, IconRobot } from "@tabler/icons-react";

import useModeration from "../../../../aiAssistant/hooks/useModeration";
import useAdsModeration from "../../hooks/useAdsModeration";
import useProductModeration from "../../hooks/useProductModeration";
import useAdminSearch from "../../hooks/useAdminSearch";
import AdminSearchBar from "../AdminSearcBar";

import Modal from "@/components/Model";

// "deleted" (non-banned) permanently gone hai — no actions.
// Banned items ka status bhi "deleted" hota hai, unhe alag se isBanned flag se handle karte hain.
const LOCKED_STATUSES = ["deleted"];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "rejected", label: "Rejected" },
  { key: "banned", label: "Banned" },
  { key: "deleted", label: "Deleted" },
];

const STATUS_BADGE = {
  pending: "text-bg-info",
  active: "text-bg-success",
  rejected: "text-bg-warning",
  expired: "text-bg-secondary",
  sold: "text-bg-primary",
  deleted: "text-bg-dark",
  banned: "text-bg-danger",
};

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status, onClick }) {
  if (!status) return <span className="badge fw-normal p-2 text-bg-secondary">Unknown</span>;
  return (
    <span
      role="button"
      onClick={onClick}
      className={`badge fw-normal p-2 ${STATUS_BADGE[status] || "text-bg-secondary"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ManageItems() {
  const [activeTab, setActiveTab] = useState("ads"); // "ads" | "products"
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmModal, setConfirmModal] = useState(null); // { type, item }

  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [listLoading, setListLoading] = useState(false);

  const {
    ads,
    selectedAd,

    handleAdminReadAds,
    handleAdminReadAdById,
    handleAdminApproveAd,
    handleAdminRejectAd,
    handleAdminDeleteAd,
    handleAdminBanAd,
    handleAdminUnbanAd,
  } = useAdsModeration();

  const {
    products,
    selectedProduct,

    handleAdminReadProducts,
    handleAdminReadProductById,
    handleAdminApproveProduct,
    handleAdminRejectProduct,
    handleAdminDeleteProduct,
    handleAdminBanProduct,
    handleAdminUnbanProduct,
  } = useProductModeration();

  const { recheckLoading, handleRecheckModeration } = useModeration();

  const isAds = activeTab === "ads";
  const items = (isAds ? ads : products) || [];

  // Search bar active tab ke hisaab se "ads" ya "products" type search karega
  const {
    results: searchResults,
    searchLoading,
    handleSearch,
    clearSearch,
  } = useAdminSearch(activeTab);

  // Jab tak search active nahi, list normal ads/products se banti hai
  const [isSearching, setIsSearching] = useState(false);

  // Banned check flag se hota hai, status field se nahi
  const isItemBanned = (item) => (isAds ? item.isBannedAdvertisement : item.isBannedProduct);

  // search active ho to searchResults base list banti hai, warna normal ads/products
  const baseItems = isSearching ? searchResults : items;

  const filteredItems = baseItems.filter(Boolean).filter((item) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "banned") return isItemBanned(item);
    return item.status === statusFilter;
  });

  const listIsLoading = isSearching ? searchLoading : listLoading;

  useEffect(() => {
    const fetchList = async () => {
      setListLoading(true);
      try {
        if (isAds) {
          await handleAdminReadAds();
        } else {
          await handleAdminReadProducts();
        }
      } finally {
        setListLoading(false);
      }
    };
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setStatusFilter("all");
    setIsSearching(false);
    clearSearch();
  };

  const onSearch = (query) => {
    setIsSearching(true);
    handleSearch(query);
  };

  const onClearSearch = () => {
    setIsSearching(false);
    clearSearch();
  };

  const openConfirmModal = (type, item) => setConfirmModal({ type, item });
  const closeConfirmModal = () => setConfirmModal(null);

  const adsActions = {
    approve: handleAdminApproveAd,
    reject: handleAdminRejectAd,
    delete: handleAdminDeleteAd,
    ban: handleAdminBanAd,
    unban: handleAdminUnbanAd,
  };

  const productActions = {
    approve: handleAdminApproveProduct,
    reject: handleAdminRejectProduct,
    delete: handleAdminDeleteProduct,
    ban: handleAdminBanProduct,
    unban: handleAdminUnbanProduct,
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, item } = confirmModal;
    const action = isAds ? adsActions[type] : productActions[type];
    try {
      if (action) await action(item._id);
    } finally {
      closeConfirmModal();
    }
  };

  const openDetailModal = async (item) => {
    setDetailItem(item);
    setDetailLoading(true);
    try {
      if (isAds) {
        await handleAdminReadAdById?.(item._id);
      } else {
        await handleAdminReadProductById?.(item._id);
      }
    } finally {
      setDetailLoading(false);
    }
  };
  const closeDetailModal = () => setDetailItem(null);

  const detailData = isAds ? selectedAd || detailItem : selectedProduct || detailItem;

  const onRecheck = async (item) => {
    const type = isAds ? "ad" : "product";
    const result = await handleRecheckModeration(type, item._id);
    if (result) {
      // List ko refresh karo taake naya status/reason turant dikhe
      if (isAds) {
        await handleAdminReadAds();
      } else {
        await handleAdminReadProducts();
      }
      // Agar detail modal khula hai isi item ka, usko bhi refresh kar do
      if (detailItem?._id === item._id) {
        setDetailItem(result.data.item);
      }
    }
  };

  const modalCopy = {
    approve: { title: "Approve this item?", text: "The item will become visible to everyone.", confirmClass: "btn-success", confirmLabel: "Approve" },
    reject: { title: "Reject this item?", text: "The seller will be notified that this item was rejected.", confirmClass: "btn-danger", confirmLabel: "Reject" },
    delete: { title: "Delete this item?", text: "This action cannot be undone.", confirmClass: "btn-danger", confirmLabel: "Delete" },
    ban: { title: "Ban this item?", text: "This item will be hidden and marked as banned.", confirmClass: "btn-dark", confirmLabel: "Ban" },
    unban: { title: "Unban this item?", text: "This item will be sent back for review as pending.", confirmClass: "btn-success", confirmLabel: "Unban" },
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <h1 className="fs-5 me-3 mb-0">Manage Items</h1>

        <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap">
          <AdminSearchBar
            type={activeTab}
            placeholder={isAds ? "Search ads..." : "Search products..."}
            onSearch={onSearch}
            onClear={onClearSearch}
          />
          <div className="btn-group flex-shrink-0" role="group" aria-label="Item type">
            <button
              type="button"
              className={`btn btn-sm ${isAds ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-1`}
              onClick={() => switchTab("ads")}
            >
              <IconSpeakerphone size={16} stroke={1.5} />
              Ads
            </button>
            <button
              type="button"
              className={`btn btn-sm ${!isAds ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-1`}
              onClick={() => switchTab("products")}
            >
              <IconPackage size={16} stroke={1.5} />
              Products
            </button>
          </div>
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`btn btn-sm ${statusFilter === f.key ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="rounded-start">No.</th>
              <th className="text-start" style={{ minWidth: "260px" }}>{isAds ? "Advertisements" : "Product"}</th>
              <th>Price</th>
              <th>Status</th>
              <th className="d-none d-md-table-cell">Date</th>
              {!isAds && <th className="d-none d-lg-table-cell">Stock</th>}
              <th className="rounded-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {listIsLoading ? (
              <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-muted">No {isAds ? "advertisement" : "products"} found</td></tr>
            ) : (
              filteredItems.map((item, idx) => {
                const images = isAds ? item.adsImages : item.productImages;
                const banned = isItemBanned(item);
                const isLocked = LOCKED_STATUSES.includes(item.status) && !banned;
                const lowStock = !isAds && Number(item.stock) < 10;

                return (
                  <tr
                    key={item._id}
                    className="border-bottom"
                    style={{ cursor: "pointer" }}
                    onClick={() => openDetailModal(item)}
                  >
                    <td className="px-xl-0">{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={images?.[0]?.url}
                          className="border rounded-2 me-2 flex-shrink-0"
                          style={{ width: "70px", height: "46px", objectFit: "cover" }}
                          alt={item.title}
                        />
                        <div className="text-start" style={{ width: "250px" }}>
                          <p className="text-truncate mb-0">{item.title}</p>
                          <div className="d-flex align-items-center gap-1 flex-wrap">
                            <span className="border rounded-1 text-body-secondary px-2" style={{ fontSize: '12px'}}>Code : {isAds ? item.adCode : item.productCode }</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      Rs {item.price}
                      {item.isPriceNegotiable && <span className="text-muted small"> (N)</span>}
                    </td>
                    <td>
                      <StatusBadge
                        status={banned ? "banned" : item.status}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(item);
                        }}
                      />
                    </td>
                    <td className="d-none d-md-table-cell">{formatDate(item.createdAt)}</td>
                    {!isAds && (
                      <td className={`d-none d-lg-table-cell ${lowStock ? "text-danger fw-semibold" : ""}`}>
                        {item.stock ?? "-"}
                      </td>
                    )}
                    <td>
                      {isLocked ? (
                        <span className="text-muted small d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <IconAlertTriangle size={14} stroke={1.5} />
                          No actions
                        </span>
                      ) : (
                        <div className="d-flex flex-wrap" style={{ width: "fit-content" }} onClick={(e) => e.stopPropagation()}>
                          {["pending", "rejected"].includes(item.status) && (
                              <button
                                type="button"
                                title="Approve"
                                className="btn btn-sm btn-outline-success me-1 p-0"
                                onClick={() => openConfirmModal("approve", item)}
                              >
                                <IconCheck stroke={1.5} size={20} />
                              </button>
                            )}

                            {item.status === "pending" && (
                              <button
                                type="button"
                                title="Reject"
                                className="btn btn-sm btn-outline-danger me-1 p-0"
                                onClick={() => openConfirmModal("reject", item)}
                              >
                                <IconX stroke={1.5} size={20} />
                              </button>
                          )}

                          {["pending", "rejected"].includes(item.status) && (
                            <button
                              type="button"
                              title="Recheck with AI"
                              className="btn btn-sm btn-outline-info me-1 p-0"
                              disabled={recheckLoading}
                              onClick={() => onRecheck(item)}
                            >
                             {recheckLoading ? (
                               <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                             ) : (
                               <IconRobot stroke={1.5} size={20} />
                             )}
                            </button>
                          )}

                          {item.status === "active" && (
                            <button
                              type="button"
                              title="Ban"
                              className="btn btn-sm btn-outline-dark me-1 p-0"
                              onClick={() => openConfirmModal("ban", item)}
                            >
                              <IconBan stroke={1.5} size={20} />
                            </button>
                          )}

                          {banned && (
                            <button
                              type="button"
                              title="Unban"
                              className="btn btn-sm btn-outline-success me-1 p-0"
                              onClick={() => openConfirmModal("unban", item)}
                            >
                              <IconLockOpen stroke={1.5} size={20} />
                            </button>
                          )}

                          <button
                            type="button"
                            title="Delete"
                            className="btn btn-sm btn-outline-danger p-0"
                            onClick={() => openConfirmModal("delete", item)}
                          >
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
      </div>

      {/* Detail modal */}
      <Modal
        show={!!detailItem}
        onClose={closeDetailModal}
        title={detailData?.title || (isAds ? "Ad details" : "Product details")}
        size="lg"
      >
        {detailData && (
          <div>
            {detailLoading && (
              <div className="text-muted small mb-2">Refreshing details...</div>
            )}

            <div className="d-flex gap-2 mb-3 flex-wrap">
              {(isAds ? detailData.adsImages : detailData.productImages)?.map((img, i) => (
                <img
                  key={img.public_id || i}
                  src={img.url}
                  alt={`${detailData.title}-${i}`}
                  className="border rounded-2"
                  style={{ width: "100px", height: "70px", objectFit: "cover" }}
                />
              ))}
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <p className="mb-0 text-muted small">Code</p>
                <p className="mb-0">{isAds ? detailData.adCode : detailData.productCode}</p>
              </div>
              <div className="col-6">
                <p className="mb-0 text-muted small">Status</p>
                <StatusBadge status={isItemBanned(detailData) ? "banned" : detailData.status} />
              </div>
              <div className="col-6">
                <p className="mb-0 text-muted small">Price</p>
                <p className="mb-0">
                  Rs {detailData.price}
                  {detailData.isPriceNegotiable && <span className="text-muted small"> (Negotiable)</span>}
                </p>
              </div>
              {!isAds && (
                <div className="col-6">
                  <p className="mb-0 text-muted small">Stock</p>
                  <p className="mb-0">{detailData.stock ?? "-"}</p>
                </div>
              )}
              <div className="col-6">
                <p className="mb-0 text-muted small">City / Country</p>
                <p className="mb-0">{detailData.city}, {detailData.country}</p>
              </div>
              <div className="col-6">
                <p className="mb-0 text-muted small">Posted on</p>
                <p className="mb-0">{formatDate(detailData.createdAt)}</p>
              </div>
            </div>

            <p className="mb-0 text-muted small">Description</p>
            <p className="mb-0">{detailData.description || "No description provided."}</p>

            {detailData.moderationReason && (
              <div className="mt-3 p-2 border rounded-2 bg-light-subtle">
                <p className="mb-1 text-muted small fw-semibold">AI Moderation Reason</p>
                <p className="mb-0 small">{detailData.moderationReason}</p>

                {detailData.moderationSuggestions?.length > 0 && (
                  <>
                    <p className="mb-1 mt-2 text-muted small fw-semibold">Suggestions</p>
                    <ul className="mb-0 ps-3 small">
                      {detailData.moderationSuggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm modal */}
      <Modal
        show={!!confirmModal}
        onClose={closeConfirmModal}
        title={confirmModal ? modalCopy[confirmModal.type].title : ""}
        footer={
          confirmModal && (
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeConfirmModal}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${modalCopy[confirmModal.type].confirmClass}`}
                onClick={handleConfirmAction}
              >
                {modalCopy[confirmModal.type].confirmLabel}
              </button>
            </>
          )
        }
      >
        {confirmModal && <p className="mb-0 text-muted">{modalCopy[confirmModal.type].text}</p>}
      </Modal>
    </div>
  );
}