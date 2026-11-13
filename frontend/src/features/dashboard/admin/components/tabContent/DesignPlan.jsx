import { useState, useEffect } from "react";
import useDesignPlanModeration from "../../hooks/useDesignPlanModeration";
import Modal from "@/components/Model";
import { IconEdit, IconTag, IconTagOff, IconClock, IconUsers, IconPower } from "@tabler/icons-react";

const DesignPlan = () => {
  const {
    designPlans,
    designSubscribers,
    designAdminLoading,
    handleReadDesignPlans,
    handleUpdateDesignPlan,
    handleToggleDesignPlanActive,
    handleApplyDesignDiscount,
    handleRemoveDesignDiscount,
    handleReadDesignSubscribers,
  } = useDesignPlanModeration();

  const [activeModal, setActiveModal] = useState(null); // { type: "edit" | "discount", plan }
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [discountForm, setDiscountForm] = useState({ discountPercentage: "", durationInHours: "" });

  useEffect(() => {
    handleReadDesignPlans();
  }, []);

  const openEditModal = (plan) => {
    setEditForm({
      price: plan.price,
      dailyLimit: plan.dailyLimit ?? "", // khali = unlimited
      monthlyLimit: plan.monthlyLimit ?? "", // khali = unlimited
      editsPerDesign: plan.editsPerDesign,
      watermark: plan.watermark,
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
    const payload = {
      price: Number(editForm.price),
      dailyLimit: editForm.dailyLimit === "" ? null : Number(editForm.dailyLimit),
      monthlyLimit: editForm.monthlyLimit === "" ? null : Number(editForm.monthlyLimit),
      editsPerDesign: Number(editForm.editsPerDesign),
      watermark: editForm.watermark,
    };
    const success = await handleUpdateDesignPlan(activeModal.plan._id, payload);
    if (success) {
      closeModal();
      handleReadDesignPlans();
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    const success = await handleApplyDesignDiscount(activeModal.plan._id, {
      discountPercentage: Number(discountForm.discountPercentage),
      durationInHours: Number(discountForm.durationInHours),
    });
    if (success) {
      closeModal();
      handleReadDesignPlans();
    }
  };

  const handleRemoveDiscountClick = async (plan) => {
    const success = await handleRemoveDesignDiscount(plan._id);
    if (success) handleReadDesignPlans();
  };

  const handleToggleActiveClick = async (plan) => {
    await handleToggleDesignPlanActive(plan._id);
  };

  const toggleSubscribersView = () => {
    if (!showSubscribers) handleReadDesignSubscribers();
    setShowSubscribers((prev) => !prev);
  };

  const isDiscountActive = (plan) =>
    plan.discountPercentage > 0 && plan.discountValidUntil && new Date(plan.discountValidUntil) > new Date();

  const formatLimit = (limit) => (limit === null || limit === undefined ? "Unlimited" : limit);

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <h1 className="fs-5 me-3">Design Plans</h1>
        <button className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1" onClick={toggleSubscribersView}>
          <IconUsers size={16} /> {showSubscribers ? "Hide Users" : "View Users"}
        </button>
      </div>

      {!showSubscribers ? (
        <div className="table-responsive border rounded-2">
          <table className="table table-hover rounded-2 align-middle mb-0">
            <thead>
              <tr>
                <th className="rounded-start">Plan</th>
                <th>Price (PKR)</th>
                <th>Daily / Monthly</th>
                <th>Edits / Design</th>
                <th>Watermark</th>
                <th>Discount</th>
                <th>Status</th>
                <th className="rounded-end text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {designAdminLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : designPlans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">No design plans found</td></tr>
              ) : (
                designPlans.map((plan) => (
                  <tr key={plan._id} className="border-bottom">
                    <td className="text-capitalize fw-semibold" style={{ paddingBlock: '15px' }}>{plan.name}</td>
                    <td>{plan.price === 0 ? "Free" : `Rs. ${plan.price.toLocaleString()}`}</td>
                    <td>{formatLimit(plan.dailyLimit)} / {formatLimit(plan.monthlyLimit)}</td>
                    <td>{plan.editsPerDesign}</td>
                    <td>
                      <span className={`badge fw-normal p-2 ${plan.watermark ? "bg-warning text-dark" : "bg-success text-white"}`}>
                        {plan.watermark ? "Yes" : "No"}
                      </span>
                    </td>
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
                <th className="rounded-start">User</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="rounded-end">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {designAdminLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : designSubscribers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No users found</td></tr>
              ) : (
                designSubscribers.map((user) => (
                  <tr key={user._id} className="border-bottom">
                    <td style={{ paddingBlock: '15px' }}>{user.username}</td>
                    <td>{user.email}</td>
                    <td className="text-capitalize">{user.designSubscription?.plan || "free"}</td>
                    <td>
                      <span className="badge bg-secondary fw-normal p-2 text-capitalize">
                        {user.designSubscription?.status || "N/A"}
                      </span>
                    </td>
                    <td>{user.designSubscription?.expiryDate ? new Date(user.designSubscription.expiryDate).toDateString() : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Design Plan Modal */}
      <Modal show={activeModal?.type === "edit"} onClose={closeModal} title={`Edit ${activeModal?.plan?.name} Plan`} size="lg">
        <form onSubmit={handleEditSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Price (PKR)</label>
              <input type="number" min="0" className="form-control" value={editForm.price ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Edits per Design</label>
              <input type="number" min="0" className="form-control" value={editForm.editsPerDesign ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, editsPerDesign: e.target.value }))} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Daily Limit (khali = unlimited)</label>
              <input type="number" min="0" className="form-control" value={editForm.dailyLimit ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, dailyLimit: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Monthly Limit (khali = unlimited)</label>
              <input type="number" min="0" className="form-control" value={editForm.monthlyLimit ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, monthlyLimit: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className="col-12 mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="watermarkSwitch"
                  checked={!!editForm.watermark}
                  onChange={(e) => setEditForm((p) => ({ ...p, watermark: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="watermarkSwitch">Watermark on designs</label>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-dark w-100" disabled={designAdminLoading}>
            {designAdminLoading ? "Saving..." : "Save Changes"}
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
          <button type="submit" className="btn btn-dark w-100" disabled={designAdminLoading}>
            {designAdminLoading ? "Applying..." : "Apply Discount"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default DesignPlan;