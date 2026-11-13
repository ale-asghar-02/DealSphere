import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck, IconCrown, IconX } from "@tabler/icons-react";
import "../design.scss";

import { useAuth } from "@/features/auth/hooks/useAuth";
import useDesign from "../hooks/useDesign";

import Navbar from "@/components/Navbar/Navbar";
import Loading from "@/components/Loading";

const PLAN_TITLE = { free: "Free", monthly: "Monthly", yearly: "Yearly" };
const PLAN_TAGLINE = {
  free: "Try Design Studio at no cost",
  monthly: "For regular posters and ads",
  yearly: "Best for busy businesses",
};

const formatRs = (value) => `Rs ${Number(value || 0).toLocaleString()}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

// Plan ke fields se features ki list banana
const buildFeatures = (plan) => {
  const list = [];

  if (plan.unlimitedDisplay) {
    list.push({ text: "Unlimited designs", ok: true });
    if (plan.dailyLimit) list.push({ text: `Fair use: up to ${plan.dailyLimit} designs per day`, ok: true, muted: true });
  } else if (plan.monthlyLimit) {
    list.push({ text: `${plan.monthlyLimit} designs per month`, ok: true });
  } else if (plan.dailyLimit) {
    list.push({ text: `${plan.dailyLimit} designs per day`, ok: true });
  }

  list.push({ text: `${plan.editsPerDesign} edits for every design`, ok: true });
  list.push({ text: plan.watermark ? "Watermark on designs" : "No watermark", ok: !plan.watermark });
  list.push({ text: "5 sizes: poster, ad, social post, story, banner", ok: true });
  list.push({ text: "Download in high quality", ok: true });
  return list;
};

const DesignPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { designLoading, plans, subscription, purchasing, loadPlans, loadSubscription, buyPlan } = useDesign(null, {
    skipAutoLoad: true,
  });

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (user) loadSubscription({ silent: true });
  }, [user, loadSubscription]);

  const currentPlan = user ? subscription?.plan || "free" : null;
  const locked = Boolean(user && subscription && subscription.canPurchase === false);
  const monthly = plans.find((p) => p.name === "monthly");

  const handleBuy = async (planName) => {
    if (!user) {
      navigate("/login", { state: { from: "/design/pricing" } });
      return;
    }
    await buyPlan(planName);
  };

  // Yearly plan monthly ke muqable mein kitna sasta hai
  const yearlySaving = (plan) => {
    if (plan.name !== "yearly" || !monthly) return 0;
    const full = monthly.effectivePrice * 12;
    if (full <= plan.effectivePrice) return 0;
    return Math.round(((full - plan.effectivePrice) / full) * 100);
  };

  return (
    <div>
      <Navbar />

      <div className="container py-md-5 my-5">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 640 }}>
          <span className="ds-eyebrow mb-2">
            <IconCrown size={14} /> Design Studio plans
          </span>
          <h1 className="ds-title mb-2">Pick the plan that fits your business</h1>
          <p className="text-muted mb-0">Create professional posters and ads with AI. Pay once per period, no auto-renewal.</p>
        </div>

        {locked && (
          <div className="alert alert-info rounded-2 text-center mx-auto" style={{ maxWidth: 720 }}>
            Your <strong>{PLAN_TITLE[currentPlan]}</strong> plan is active until <strong>{formatDate(subscription.availableAfter)}</strong>.
            You can buy a new plan after it ends.
          </div>
        )}

        {designLoading && plans.length === 0 ? (
          <Loading />
        ) : (
          <div className="row g-4 justify-content-center align-items-stretch">
            {plans.map((plan) => {
              const isFree = plan.name === "free";
              const isCurrent = currentPlan === plan.name;
              const popular = plan.name === "yearly";
              const saving = yearlySaving(plan);
              const busy = purchasing === plan.name;

              return (
                <div key={plan.name} className="col-12 col-md-6 col-lg-4">
                  <div className={`ds-plan ${popular ? "is-popular" : ""} ${isCurrent ? "is-current" : ""}`}>
                    {popular && <span className="ds-plan-flag">Best value</span>}

                    <h4 className="fw-semibold mb-1">{PLAN_TITLE[plan.name] || plan.name}</h4>
                    <p className="text-muted small mb-3">{PLAN_TAGLINE[plan.name]}</p>

                    <div className="mb-1">
                      {plan.hasActiveDiscount && <span className="text-muted text-decoration-line-through me-2">{formatRs(plan.price)}</span>}
                      <span className="ds-plan-price">{isFree ? "Rs 0" : formatRs(plan.effectivePrice)}</span>
                    </div>
                    <div className="small text-muted mb-3" style={{ minHeight: 22 }}>
                      {isFree ? "Free forever" : `for ${plan.durationInDays} days`}
                      {plan.hasActiveDiscount && (
                        <span className="badge bg-success-subtle text-success-emphasis rounded-pill ms-2">
                          {plan.discountPercentage}% off
                        </span>
                      )}
                      {saving > 0 && (
                        <span className="badge bg-success-subtle text-success-emphasis rounded-pill ms-2">Save {saving}%</span>
                      )}
                    </div>

                    <ul className="ds-plan-features">
                      {buildFeatures(plan).map((feature) => (
                        <li key={feature.text} className={feature.muted ? "is-muted" : ""}>
                          {feature.ok ? <IconCheck size={18} className="text-primary" /> : <IconX size={18} className="text-muted" />}
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-3">
                      {isFree ? (
                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100 rounded-2"
                          style={{ paddingBlock: "12px" }}
                          onClick={() => navigate("/design")}
                        >
                          {isCurrent ? "Your current plan" : "Start for free"}
                        </button>
                      ) : isCurrent && locked ? (
                        <button type="button" className="btn btn-outline-primary w-100 rounded-2" style={{ paddingBlock: "12px" }} disabled>
                          Your current plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary w-100 rounded-2"
                          style={{ paddingBlock: "12px" }}
                          disabled={locked || Boolean(purchasing)}
                          onClick={() => handleBuy(plan.name)}
                        >
                          {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
                          {locked ? `Available after ${formatDate(subscription.availableAfter)}` : `Get ${PLAN_TITLE[plan.name]}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-muted small mt-4 mb-0">
          Prices are in Pakistani Rupees. Payment is processed securely by Stripe.
        </p>
      </div>
    </div>
  );
};

export default DesignPricing;