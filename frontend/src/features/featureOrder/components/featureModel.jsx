import { useEffect, useState } from "react";
import { IconCreditCard, IconCircleCheckFilled, IconLoader2, IconSparkles, IconTag } from "@tabler/icons-react";
import useFeatureOrder from "../hooks/useFeatureOrder";
import useSubscription from "../../subscription/hooks/useSubscription";
import Modal from "@/components/Model";
import "../featureOrder.scss";

// onFeatured: called after a successful "use my subscription" feature, so the list can refresh instantly
const FeaturedModal = ({ ad, itemType, onClose, onFeatured }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { plans, featureLoading, handleFeaturePlans, handleFeatureCheckout, handleFeatureWithSubscription } = useFeatureOrder();
  const { limits, loaded, refreshSubscription } = useSubscription();

  useEffect(() => {
    handleFeaturePlans();
    refreshSubscription(); // always show fresh slot numbers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slots = limits?.featured;
  const notIncluded = loaded && slots && !slots.unlimited && slots.limit === 0;
  const allUsed = loaded && slots && !slots.unlimited && slots.limit > 0 && slots.remaining === 0;
  const canUseSlot = loaded && slots && !notIncluded && !allUsed;

  let slotHint = "Checking your featured slots...";
  if (loaded && slots) {
    if (notIncluded) slotHint = "Your plan has no featured slots. Upgrade, or pay for a featured plan below.";
    else if (allUsed) slotHint = `All ${slots.limit} featured slots are used. Pay for a featured plan below.`;
    else if (slots.unlimited) slotHint = "Unlimited featured slots on your plan.";
    else slotHint = `${slots.remaining} of ${slots.limit} featured slots left (shared by ads and products).`;
  }

  const handlePayment = async () => {
    if (!selectedPlan) return;
    await handleFeatureCheckout(itemType, ad._id, selectedPlan);
  };

  const handleUseSubscription = async () => {
    const success = await handleFeatureWithSubscription(itemType, ad._id);
    if (success) {
      await onFeatured?.();
      onClose();
    } else {
      refreshSubscription();
    }
  };

  return (
    <Modal
      show={true}
      onClose={onClose}
      title={"Choose Featured Plan"}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-warning fw-medium"
            onClick={handlePayment}
            disabled={!selectedPlan || featureLoading}
          >
            {featureLoading ? (
              <><IconLoader2 size={18} className="me-2 spin" />Loading...</>
            ) : (
              <><IconCreditCard size={18} className="me-2" />Make Payment</>
            )}
          </button>
        </>
      }
    >
      <p className="text-muted small mb-3">Make your item featured to reach more customers</p>

      {/* Subscription-based featuring option */}
      <div
        className="d-flex align-items-center justify-content-between p-3 mb-3 rounded"
        style={{ border: "2px dashed #adb5bd", backgroundColor: "#f8f9fa", opacity: canUseSlot || !loaded ? 1 : 0.8 }}
      >
        <div className="d-flex align-items-center gap-2">
          <IconSparkles size={20} className="text-warning" />
          <div>
            <div className="fw-semibold small">Use my subscription</div>
            <div className={allUsed ? "text-danger" : "text-muted"} style={{ fontSize: "12px" }}>
              {slotHint}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-dark"
          onClick={handleUseSubscription}
          disabled={featureLoading || !canUseSlot}
        >
          {featureLoading ? <IconLoader2 size={16} className="spin" /> : "Use Slot"}
        </button>
      </div>

      <div className="text-center text-muted small mb-3">— or pay for a plan —</div>

      {!plans ? (
        <div className="text-center py-3">
          <IconLoader2 size={20} className="spin" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {Object.entries(plans).map(([planId, planData]) => {
            const hasDiscount = planData.discountPercentage > 0;

            return (
              <div
                key={planId}
                onClick={() => setSelectedPlan(planId)}
                style={{
                  border: selectedPlan === planId ? "2px solid #0d6efd" : "2px solid #e9ecef",
                  borderRadius: "6px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  backgroundColor: selectedPlan === planId ? "#f0f6ff" : "#fff",
                  transition: "all 0.2s",
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-semibold text-capitalize">{planId}</span>
                      {hasDiscount && (
                        <span className="badge bg-danger fw-medium d-flex align-items-center gap-1">
                          <IconTag size={12} /> {planData.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                    <div className="text-muted small">
                      {planData.duration} days featured
                    </div>
                  </div>

                  <div className="text-end">
                    {hasDiscount ? (
                      <>
                        <div className="text-muted text-decoration-line-through" style={{ fontSize: "12px" }}>
                          Rs {planData.pkr?.toLocaleString()}
                        </div>
                        <div className="fw-semibold text-success">
                          Rs {planData.effectivePkr?.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="fw-semibold text-primary">
                        Rs {planData.pkr?.toLocaleString()}
                      </div>
                    )}
                    <div className="text-muted" style={{ fontSize: "11px" }}>
                      ${(planData.effectivePriceUsdCents / 100).toFixed(2)} USD
                    </div>
                  </div>

                  {selectedPlan === planId && (
                    <IconCircleCheckFilled size={20} className="text-primary ms-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default FeaturedModal;