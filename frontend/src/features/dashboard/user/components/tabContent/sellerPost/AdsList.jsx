import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconStar, IconEdit, IconCircleCheck, IconTrash, IconRefresh, IconBan, IconInfoCircle } from "@tabler/icons-react";

import useSellerAds from "../../../hooks/useSellerAds";
import { useSocket } from "@/contexts/SocketContext";
import FeaturedModal from "../../../../../featureOrder/components/featureModel";

import { AD_STATUS_BADGE, LOCKED_STATUSES, formatDate } from "./shared/postConstants";
import ConfirmModal from "./shared/ConfirmModal";
import ReasonModal from "./shared/ReasonModal";
import EditAdModal from "./models/EditAdModal";

const AdsList = ({ statusFilter }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    adsLoading,
    fieldErrors,
    setFieldErrors,
    ads = [],
    handleSellerReadAds,
    refreshAds,
    handleSellerUpdateAd,
    handleSellerDeleteAd,
    handleSellerMarkAsSold,
    handleSellerRenewAd,
  } = useSellerAds();

  useEffect(() => { handleSellerReadAds?.() }, []);

  // Admin moderation result (approved / rejected / needs changes) -> update the list instantly
  useEffect(() => {
    if (!socket) return;

    const onModerationUpdate = (data) => {
      if (data.type !== "ad") return;

      refreshAds?.(); // silent reload of the list + subscription usage

      if (data.status === "active") {
        toast.success("Your ad is now live! 🎉");
      } else if (data.status === "rejected") {
        toast.error(`Your ad rejected! Check reason`);
      } else {
        toast.info("Your ad was reviewed and needs some improvements");
      }
    };

    socket.on("moderationUpdate", onModerationUpdate);

    return () => socket.off("moderationUpdate", onModerationUpdate);
  }, [socket]);

  const filteredAds = statusFilter ? ads.filter((ad) => ad.status === statusFilter) : ads;

  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  const handleViewCardDetail = (ad) => {
    if (ad.status !== "active" || ad.isBannedAdvertisement) {
      toast.error("This advertisement is not available");
      return;
    }
    const categorySlug = ad.category?.slug;
    const subSlug = ad.subCategory?.slug || "all";
    navigate({
      pathname: `/advertisement/${categorySlug}/${subSlug}/${encodeURIComponent(ad.title)}-${ad._id}`,
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
            <th className="rounded-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Only show "Loading..." on the very first load, so edit/delete/sold never flash the table */}
          {adsLoading && ads.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
          ) : filteredAds.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-4 text-muted">No ads found</td></tr>
          ) : (
            filteredAds.map((ad, idx) => {
              const isLocked = LOCKED_STATUSES.includes(ad.status);

              return (
                <tr key={ad._id} className="border-bottom" onClick={() => handleViewCardDetail(ad)} style={{ cursor: "pointer" }}>
                  <td className="px-xl-0">{idx + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={ad.adsImages?.[0]?.url}
                        className="border rounded-2 me-2"
                        style={{ width: "80px", height: "50px", objectFit: "cover" }}
                        alt={ad.title}
                      />
                      <div className="text-start" style={{ width: "250px" }}>
                        <p className="text-truncate mb-0">{ad.title}</p>
                        <div className="d-flex align-items-center gap-1 flex-wrap" style={{ width: "fit-content" }}>
                          {ad.isFeatured && (
                            <>
                              <span className="badge rounded-pill text-bg-warning fw-normal d-flex align-items-center">
                                <IconStar className="me-1" stroke={2} size={12} />
                                <span>Featured</span>
                              </span>
                              <span className="text-body-secondary" style={{ fontSize: "12px" }}>
                                Expire : {formatDate(ad.featuredUntil)}
                              </span>
                            </>
                          )}
                          {ad.isBannedAdvertisement && (
                            <span className="badge rounded-pill text-bg-danger fw-normal d-flex align-items-center">
                              <IconBan className="me-1" stroke={2} size={12} />
                              <span>Banned</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>Rs {ad.price}</td>
                  <td>
                    <span className={`badge fw-normal p-2 ${AD_STATUS_BADGE[ad.status] || "text-bg-secondary"}`}>
                      {ad.status?.charAt(0).toUpperCase() + ad.status?.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(ad.createdAt)}</td>
                  <td>
                    {isLocked ? (
                      <span className="text-muted small" onClick={(e) => e.stopPropagation()}>
                        No actions available
                      </span>
                    ) : (
                      <div className="d-flex" onClick={(e) => e.stopPropagation()} style={{ width: "fit-content" }}>

                        {["pending", "active", "rejected"].includes(ad.status) && (
                          <>
                            {ad.status === "rejected" && ad.moderationReason && (
                              <button type="button" title="View Reason" className="btn btn-sm btn-outline-secondary me-1 p-0" onClick={() => setActiveModal({ type: "reason", ad })}>
                                <IconInfoCircle stroke={1.5} size={20} />
                              </button>
                            )}
                            <button type="button" title="Edit" className="btn btn-sm btn-outline-primary me-1 p-0" onClick={() => setActiveModal({ type: "edit", ad })}>
                              <IconEdit stroke={1.5} size={20} />
                            </button>
                          </>
                        )}

                        {ad.status === "active" && !ad.isFeatured && (
                          <button type="button" title="Make Featured" className="btn btn-sm btn-outline-warning me-1 p-0" onClick={() => setActiveModal({ type: "featured", ad })}>
                            <IconStar stroke={1.5} size={20} />
                          </button>
                        )}

                        {ad.status === "active" && (
                          <button type="button" title="Mark as Sold" className="btn btn-sm btn-outline-success me-1 p-0" onClick={() => setActiveModal({ type: "sold", ad })}>
                            <IconCircleCheck stroke={1.5} size={20} />
                          </button>
                        )}

                        {ad.status === "expired" && (
                          <button type="button" title="Renew" className="btn btn-sm btn-outline-warning me-1 p-0" onClick={() => setActiveModal({ type: "renew", ad })}>
                            <IconRefresh stroke={1.5} size={16} />
                          </button>
                        )}

                        <button type="button" title="Delete" className="btn btn-sm btn-outline-danger p-0" onClick={() => setActiveModal({ type: "delete", ad })}>
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
        <ReasonModal item={activeModal.ad} onClose={closeModal} />
      )}
      {activeModal?.type === "edit" && (
        <EditAdModal ad={activeModal.ad} onClose={closeModal} handleSellerUpdateAd={handleSellerUpdateAd} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />
      )}
      {activeModal?.type === "featured" && (
        <FeaturedModal ad={activeModal.ad} itemType="advertisement" onClose={closeModal} onFeatured={refreshAds} />
      )}
      {activeModal?.type === "sold" && (
        <ConfirmModal
          title="Mark as Sold"
          message={`Are you sure you want to mark "${activeModal.ad.title}" as sold?`}
          confirmText="Yes, Mark as Sold"
          confirmClass="btn-success"
          onConfirm={async () => { await handleSellerMarkAsSold?.(activeModal.ad._id); closeModal(); }}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === "renew" && (
        <ConfirmModal
          title="Renew Ad"
          message={`Are you sure you want to renew "${activeModal.ad.title}"? This will extend the listing period.`}
          confirmText="Yes, Renew"
          confirmClass="btn-warning"
          onConfirm={async () => { await handleSellerRenewAd?.(activeModal.ad._id); closeModal(); }}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === "delete" && (
        <ConfirmModal
          title="Delete Ad"
          message={`Are you sure you want to delete "${activeModal.ad.title}"? It will be hidden from listings, but you can still see it under the "Deleted" tab.`}
          confirmText="Yes, Delete"
          confirmClass="btn-danger"
          onConfirm={async () => { await handleSellerDeleteAd?.(activeModal.ad._id); closeModal(); }}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AdsList;