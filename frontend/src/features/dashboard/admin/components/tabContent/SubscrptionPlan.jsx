import { useState, useEffect } from "react";
import useSubscriptionPlanModeration from "../../hooks/useSubscriptionPlanModeration";
import Modal from "@/components/Model";
import { IconEdit, IconTag, IconTagOff, IconClock, IconUsers, IconPower } from "@tabler/icons-react";

const SubscriptionPlan = () => {
  const {
    plans,
    sellerSubscriptions,
    subscriptionAdminLoading,
    handleReadPlans,
    handleUpdatePlan,
    handleToggleActive,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleReadSellerSubscriptions,
  } = useSubscriptionPlanModeration();

  const [activeModal, setActiveModal] = useState(null); // { type: "edit" | "discount", plan }
  const [showSellers, setShowSellers] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [discountForm, setDiscountForm] = useState({ discountPercentage: "", durationInHours: "" });

  useEffect(() => {
    handleReadPlans();
  }, []);

  const openEditModal = (plan) => {
    setEditForm({
      price: plan.price,
      maxAds: plan.maxAds,
      maxAdImages: plan.maxAdImages,
      maxProducts: plan.maxProducts,
      maxProductImages: plan.maxProductImages,
      featuredSlots: plan.featuredSlots,
      featuredDurationDays: plan.featuredDurationDays,
    });
    setActiveModal({ type: "edit", plan });
  };

  const openDiscountModal = (plan) => {
    setDiscountForm({ discountPercentage: "", durationInHours: "" });
    setActiveModal({ type: "discount", plan });
  };

  const closeModal = () => setActiveModal(null);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(editForm).map(([key, val]) => [key, Number(val)])
    );
    const success = await handleUpdatePlan(activeModal.plan._id, payload);
    if (success) {
      closeModal();
      handleReadPlans();
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    const success = await handleApplyDiscount(activeModal.plan._id, {
      discountPercentage: Number(discountForm.discountPercentage),
      durationInHours: Number(discountForm.durationInHours),
    });
    if (success) {
      closeModal();
      handleReadPlans();
    }
  };

  const handleRemoveDiscountClick = async (plan) => {
    const success = await handleRemoveDiscount(plan._id);
    if (success) handleReadPlans();
  };

  const handleToggleActiveClick = async (plan) => {
    await handleToggleActive(plan._id); // proper toggle - flips isActive both ways
  };

  const toggleSellersView = () => {
    if (!showSellers) handleReadSellerSubscriptions();
    setShowSellers((prev) => !prev);
  };

  const isDiscountActive = (plan) =>
    plan.discountPercentage > 0 && plan.discountValidUntil && new Date(plan.discountValidUntil) > new Date();

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <h1 className="fs-5 me-3">Subscription Plans</h1>
        <button className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1" onClick={toggleSellersView}>
          <IconUsers size={16} /> {showSellers ? "Hide Sellers" : "View Sellers"}
        </button>
      </div>

      {!showSellers ? (
        <div className="table-responsive border rounded-2">
          <table className="table table-hover rounded-2 align-middle mb-0">
            <thead>
              <tr>
                <th className="rounded-start">Plan</th>
                <th>Price (PKR)</th>
                <th>Ads / Products</th>
                <th>Featured Slots</th>
                <th>Discount</th>
                <th>Status</th>
                <th className="rounded-end text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionAdminLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No plans found</td></tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan._id} className="border-bottom">
                    <td className="text-capitalize fw-semibold" style={{ paddingBlock: '15px'}}>{plan.name}</td>
                    <td>{plan.price === 0 ? "Free" : `Rs. ${plan.price.toLocaleString()}`}</td>
                    <td>{plan.maxAds === -1 ? "Unlimited" : plan.maxAds} / {plan.maxProducts === -1 ? "Unlimited" : plan.maxProducts}</td>
                    <td>{plan.featuredSlots === -1 ? "Unlimited" : plan.featuredSlots}</td>
                    <td>
                      {isDiscountActive(plan) ? (
                        <span className="badge bg-danger-subtle text-danger fw-medium d-inline-flex align-items-center gap-1 py-2">
                          <IconTag size={14} /> {plan.discountPercentage}% off
                        </span>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge fw-normal p-2 ${plan.isActive ? "bg-success" : "bg-secondary"}`}>
                        {plan.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <button className="btn btn-sm btn-outline-primary p-0" style={{ width: 28, height: 28 }} title="Edit" onClick={() => openEditModal(plan)}>
                          <IconEdit stroke={1.5} size={20} />
                        </button>
                        {plan.name !== "free" && (
                          <button className="btn btn-sm btn-outline-warning p-0" style={{ width: 28, height: 28 }} title="Apply Discount" onClick={() => openDiscountModal(plan)}>
                            <IconTag stroke={1.5} size={20} />
                          </button>
                        )}
                        {isDiscountActive(plan) && (
                          <button className="btn btn-sm btn-outline-danger p-0" style={{ width: 28, height: 28 }} title="Remove Discount" onClick={() => handleRemoveDiscountClick(plan)}>
                            <IconTagOff stroke={1.5} size={20} />
                          </button>
                        )}
                        {plan.name !== "free" && (
                          <button
                            className={`btn btn-sm p-0 ${plan.isActive ? "btn-outline-secondary" : "btn-secondary"}`}
                            style={{ width: 28, height: 28 }}
                            title={plan.isActive ? "Disable" : "Enable"}
                            onClick={() => handleToggleActiveClick(plan)}
                          >
                            <IconPower stroke={1.5} size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-responsive border rounded-2">
          <table className="table table-hover rounded-2 align-middle mb-0">
            <thead>
              <tr>
                <th className="rounded-start">Seller</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="rounded-end">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionAdminLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : sellerSubscriptions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No sellers found</td></tr>
              ) : (
                sellerSubscriptions.map((seller) => (
                  <tr key={seller._id} className="border-bottom">
                    <td style={{ paddingBlock: '15px'}}>{seller.username}</td>
                    <td>{seller.email}</td>
                    <td className="text-capitalize">{seller.subscription?.plan || "free"}</td>
                    <td>
                      <span className="badge bg-secondary fw-normal p-2 text-capitalize">
                        {seller.subscription?.status || "N/A"}
                      </span>
                    </td>
                    <td>{seller.subscription?.expiryDate ? new Date(seller.subscription.expiryDate).toDateString() : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Plan Modal */}
      <Modal show={activeModal?.type === "edit"} onClose={closeModal} title={`Edit ${activeModal?.plan?.name} Plan`} size="lg">
        <form onSubmit={handleEditSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Price (PKR)</label>
              <input type="number" className="form-control" value={editForm.price ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Max Ads (-1 = unlimited)</label>
              <input type="number" className="form-control" value={editForm.maxAds ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, maxAds: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Max Ad Images</label>
              <input type="number" className="form-control" value={editForm.maxAdImages ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, maxAdImages: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Max Products (-1 = unlimited)</label>
              <input type="number" className="form-control" value={editForm.maxProducts ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, maxProducts: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Max Product Images</label>
              <input type="number" className="form-control" value={editForm.maxProductImages ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, maxProductImages: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Featured Slots (-1 = unlimited)</label>
              <input type="number" className="form-control" value={editForm.featuredSlots ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, featuredSlots: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Featured Duration (days)</label>
              <input type="number" className="form-control" value={editForm.featuredDurationDays ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, featuredDurationDays: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="btn btn-dark w-100" disabled={subscriptionAdminLoading}>
            {subscriptionAdminLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Apply Discount Modal */}
      <Modal show={activeModal?.type === "discount"} onClose={closeModal} title="Apply Discount">
        <form onSubmit={handleDiscountSubmit}>
          <div className="mb-3">
            <label className="form-label">Discount Percentage</label>
            <input
              type="number"
              min="1"
              max="100"
              className="form-control"
              value={discountForm.discountPercentage}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
              placeholder="e.g. 20"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-1">
              <IconClock size={14} /> Duration (hours)
            </label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={discountForm.durationInHours}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, durationInHours: e.target.value }))}
              placeholder="e.g. 24 = 1 day, 168 = 7 days, 720 = 1 month"
              required
            />
            <small className="text-muted">Any custom value: 12hr, 24hr, 168hr (7 days), 720hr (1 month), etc.</small>
          </div>
          <button type="submit" className="btn btn-dark w-100" disabled={subscriptionAdminLoading}>
            {subscriptionAdminLoading ? "Applying..." : "Apply Discount"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SubscriptionPlan;