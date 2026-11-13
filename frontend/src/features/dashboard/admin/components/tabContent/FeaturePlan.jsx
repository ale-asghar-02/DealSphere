import { useState, useEffect } from "react";
import useFeaturePlanModeration from "../../hooks/useFeaturePlanModeration";
import Modal from "@/components/Model";
import { IconEdit, IconTag, IconTagOff, IconPower, IconClock } from "@tabler/icons-react";

const FeaturePlan = () => {
  const {
    featurePlans,
    featurePlanLoading,
    handleReadFeaturePlans,
    handleUpdateFeaturePlan,
    handleToggleFeaturePlanActive,
    handleApplyFeatureDiscount,
    handleRemoveFeatureDiscount,
  } = useFeaturePlanModeration();

  const [activeModal, setActiveModal] = useState(null); // { type: "edit" | "discount", plan }
  const [editForm, setEditForm] = useState({ price: "", duration: "" });
  const [discountForm, setDiscountForm] = useState({ discountPercentage: "", durationInHours: "" });

  useEffect(() => {
    handleReadFeaturePlans();
  }, []);

  const openEditModal = (plan) => {
    setEditForm({ price: plan.price, duration: plan.duration });
    setActiveModal({ type: "edit", plan });
  };

  const openDiscountModal = (plan) => {
    setDiscountForm({ discountPercentage: "", durationInHours: "" });
    setActiveModal({ type: "discount", plan });
  };

  const closeModal = () => setActiveModal(null);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await handleUpdateFeaturePlan(activeModal.plan._id, {
      price: Number(editForm.price),
      duration: Number(editForm.duration),
    });
    if (success) {
      closeModal();
      handleReadFeaturePlans();
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    const success = await handleApplyFeatureDiscount(activeModal.plan._id, {
      discountPercentage: Number(discountForm.discountPercentage),
      durationInHours: Number(discountForm.durationInHours),
    });
    if (success) {
      closeModal();
      handleReadFeaturePlans();
    }
  };

  const handleRemoveDiscount = async (plan) => {
    const success = await handleRemoveFeatureDiscount(plan._id);
    if (success) handleReadFeaturePlans();
  };

  const handleToggleActive = async (plan) => {
    const success = await handleToggleFeaturePlanActive(plan._id);
    if (success) handleReadFeaturePlans();
  };

  const isDiscountActive = (plan) =>
    plan.discountPercentage > 0 && plan.discountValidUntil && new Date(plan.discountValidUntil) > new Date();

  return (
    <div>
      <h1 className="fs-5 me-3 mb-3">Feature Plans</h1>

      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="rounded-start">Plan</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Discount</th>
              <th>Status</th>
              <th className="rounded-end text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {featurePlanLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : featurePlans.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-muted">No plans found</td></tr>
            ) : (
              featurePlans.map((plan) => (
                <tr key={plan._id} className="border-bottom">
                  <td className="text-capitalize fw-semibold" style={{ paddingBlock: '15px'}}>{plan.name}</td>
                  <td>{plan.price}</td>
                  <td>{plan.duration} days</td>
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
                      <button className="btn btn-sm btn-outline-warning p-0" style={{ width: 28, height: 28 }} title="Apply Discount" onClick={() => openDiscountModal(plan)}>
                        <IconTag stroke={1.5} size={20} />
                      </button>
                      {isDiscountActive(plan) && (
                        <button className="btn btn-sm btn-outline-danger p-0" style={{ width: 28, height: 28 }} title="Remove Discount" onClick={() => handleRemoveDiscount(plan)}>
                          <IconTagOff stroke={1.5} size={20} />
                        </button>
                      )}
                      <button className={`btn btn-sm p-0 ${plan.isActive ? "btn-outline-secondary" : "btn-secondary"}`} style={{ width: 28, height: 28 }} title={plan.isActive ? "Disable" : "Enable"} onClick={() => handleToggleActive(plan)}>
                        <IconPower stroke={1.5} size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Plan Modal */}
      <Modal show={activeModal?.type === "edit"} onClose={closeModal} title="Edit Plan">
        <form onSubmit={handleEditSubmit}>
          <div className="mb-3">
            <label className="form-label">Price (USD cents)</label>
            <input
              type="number"
              className="form-control"
              value={editForm.price}
              onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
              required
            />
            <small className="text-muted">e.g. 500 = $5.00</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Duration (days)</label>
            <input
              type="number"
              className="form-control"
              value={editForm.duration}
              onChange={(e) => setEditForm((prev) => ({ ...prev, duration: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-dark w-100" disabled={featurePlanLoading}>
            {featurePlanLoading ? "Saving..." : "Save Changes"}
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
          <button type="submit" className="btn btn-dark w-100" disabled={featurePlanLoading}>
            {featurePlanLoading ? "Applying..." : "Apply Discount"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FeaturePlan;