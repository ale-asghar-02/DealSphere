import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSubscription from "../hooks/useSubscription";
import { getLimitLevel, getExpiryLevel } from "../store/SubscriptionStore";
import {
  IconCrown,
  IconStar,
  IconRocket,
  IconCalendarEvent,
  IconCalendarTime,
  IconAlertTriangle,
  IconAlertOctagon,
  IconCircleCheck,
  IconArrowUpRight,
  IconAd2,
  IconShoppingBag,
  IconPhoto,
  IconSparkles,
  IconTag,
  IconClockHour4,
} from "@tabler/icons-react";

const PLAN_META = {
  free: { icon: IconRocket, accent: "text-secondary" },
  monthly: { icon: IconStar, accent: "text-primary" },
  yearly: { icon: IconCrown, accent: "text-warning" },
};

const STATUS_ORDER = ["active", "pending", "sold", "expired", "rejected", "deleted"];
const STATUS_BADGE = {
  active: "text-bg-success",
  pending: "text-bg-warning",
  sold: "text-bg-primary",
  expired: "text-bg-secondary",
  rejected: "text-bg-danger",
  deleted: "text-bg-dark",
};

const BAR_CLASS = { ok: "bg-success", warning: "bg-warning", danger: "bg-danger" };
const TEXT_CLASS = { ok: "text-success", warning: "text-warning-emphasis", danger: "text-danger" };

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "-";

// ─────────────────────────────────────────────
// One usage card (Ads / Products)
// ─────────────────────────────────────────────
const UsageCard = ({ icon, title, label, limit, onUpgrade }) => {
  if (!limit) return null;
  const level = getLimitLevel(limit);
  const percent = limit.unlimited || !limit.limit ? 0 : Math.min((limit.used / limit.limit) * 100, 100);
  const statuses = STATUS_ORDER.filter((status) => limit.byStatus?.[status] > 0);

  return (
    <div className="col-12 col-lg-6">
      <div className={`card h-100 ${level === "danger" ? "border-danger" : level === "warning" ? "border-warning" : ""}`}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 text-secondary mb-2">
            {icon}
            <span className="fw-medium">{title}</span>
          </div>

          <div className="d-flex align-items-baseline gap-2 mb-2">
            <span className={`display-6 fw-bold ${TEXT_CLASS[level]}`}>{limit.used}</span>
            <span className="text-secondary">/ {limit.unlimited ? "Unlimited" : limit.limit} live now</span>
          </div>

          {!limit.unlimited && (
            <div className="progress mb-3" style={{ height: 8 }}>
              <div className={`progress-bar ${BAR_CLASS[level]}`} style={{ width: `${percent}%` }} />
            </div>
          )}

          <div className="row g-2 mb-3">
            <div className="col-6">
              <p className="small text-secondary mb-0">Slots left</p>
              <p className="fw-semibold mb-0">{limit.unlimited ? "Unlimited" : limit.remaining}</p>
            </div>
            <div className="col-6">
              <p className="small text-secondary mb-0">Created so far (all time)</p>
              <p className="fw-semibold mb-0">{limit.total}</p>
            </div>
          </div>

          {statuses.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mb-3">
              {statuses.map((status) => (
                <span key={status} className={`badge rounded-1 fw-normal text-capitalize ${STATUS_BADGE[status]} p-2`}>
                  {status}: {limit.byStatus[status]}
                </span>
              ))}
            </div>
          )}

          {limit.overLimit && (
            <div className="alert alert-danger d-flex gap-2 small mb-0">
              <IconAlertOctagon size={18} className="flex-shrink-0" />
              <span>
                You have {limit.used - limit.limit} more live {label} than your plan allows. Your existing {label} stay
                online, but you cannot add new ones until you are under the limit or upgrade.
              </span>
            </div>
          )}

          {!limit.overLimit && level === "danger" && (
            <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 small mb-0">
              <span className="d-flex gap-2">
                <IconAlertOctagon size={18} className="flex-shrink-0" />
                Limit reached. Mark {label} as sold, delete old ones, or upgrade to add more.
              </span>
              <button type="button" className="btn btn-sm btn-danger" onClick={onUpgrade}>
                Upgrade
              </button>
            </div>
          )}

          {level === "warning" && (
            <div className="alert alert-warning d-flex gap-2 small mb-0">
              <IconAlertTriangle size={18} className="flex-shrink-0" />
              <span>
                Almost full. Only {limit.remaining} {label} slot{limit.remaining === 1 ? "" : "s"} left.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Featured slots card (shared between ads and products)
// ─────────────────────────────────────────────
const FeaturedCard = ({ limit, onUpgrade }) => {
  if (!limit) return null;
  const level = getLimitLevel(limit);
  const notIncluded = !limit.unlimited && limit.limit === 0;
  const percent = limit.unlimited || !limit.limit ? 0 : Math.min((limit.used / limit.limit) * 100, 100);

  return (
    <div className="col-12">
      <div className={`card ${level === "danger" ? "border-danger" : level === "warning" ? "border-warning" : ""}`}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 text-secondary mb-2">
            <IconSparkles size={16} />
            <span className="fw-medium">Featured Slots</span>
            <span className="small">(shared between ads and products)</span>
          </div>

          {notIncluded ? (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <p className="mb-0 text-secondary">Featured listings are not included in your current plan.</p>
              <button type="button" className="btn btn-sm btn-primary" onClick={onUpgrade}>
                Upgrade to get featured slots
              </button>
            </div>
          ) : (
            <>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className={`display-6 fw-bold ${TEXT_CLASS[level]}`}>{limit.used}</span>
                <span className="text-secondary">/ {limit.unlimited ? "Unlimited" : limit.limit} featured now</span>
              </div>

              {!limit.unlimited && (
                <div className="progress mb-3" style={{ height: 8 }}>
                  <div className={`progress-bar ${BAR_CLASS[level]}`} style={{ width: `${percent}%` }} />
                </div>
              )}

              <div className="row g-2">
                <div className="col-6 col-md-3">
                  <p className="small text-secondary mb-0">Slots left</p>
                  <p className="fw-semibold mb-0">{limit.unlimited ? "Unlimited" : limit.remaining}</p>
                </div>
                <div className="col-6 col-md-3">
                  <p className="small text-secondary mb-0">Featured ads</p>
                  <p className="fw-semibold mb-0">{limit.ads}</p>
                </div>
                <div className="col-6 col-md-3">
                  <p className="small text-secondary mb-0">Featured products</p>
                  <p className="fw-semibold mb-0">{limit.products}</p>
                </div>
                {limit.unlimited && (
                  <div className="col-12 col-md-3">
                    <p className="small text-secondary mb-0">Auto-featured</p>
                    <p className="fw-semibold mb-0">Every new listing</p>
                  </div>
                )}
              </div>

              {level === "danger" && (
                <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 small mt-3 mb-0">
                  <span className="d-flex gap-2">
                    <IconAlertOctagon size={18} className="flex-shrink-0" />
                    All featured slots are used. A slot frees up when a featured listing expires, is sold or deleted.
                  </span>
                  <button type="button" className="btn btn-sm btn-danger" onClick={onUpgrade}>
                    Upgrade
                  </button>
                </div>
              )}

              {level === "warning" && (
                <div className="alert alert-warning d-flex gap-2 small mt-3 mb-0">
                  <IconAlertTriangle size={18} className="flex-shrink-0" />
                  <span>
                    Almost full. Only {limit.remaining} featured slot{limit.remaining === 1 ? "" : "s"} left.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Page section
// ─────────────────────────────────────────────
const SellerSubscription = () => {
  const navigate = useNavigate();
  const { subscription, plans, limits, images, loaded, handleReadSubscription, handleReadAllPlans } = useSubscription();

  useEffect(() => {
    handleReadSubscription();
    handleReadAllPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPlans = () => navigate("/upgrade-plan");

  if (!loaded) {
    return (
      <div>
        <h1 className="fs-5 me-3 mb-4">Subscription</h1>
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const planName = subscription?.plan || "free";
  const isPaid = planName !== "free";
  const isExpired = subscription?.status === "expired";
  const expiryLevel = getExpiryLevel(subscription);
  const daysLeft = subscription?.daysLeft;
  const meta = PLAN_META[planName] || PLAN_META.free;
  const PlanIcon = meta.icon;
  const discountedPlan = plans.find((p) => p.name !== "free" && p.discountPercentage > 0);

  return (
    <div>
      <h1 className="fs-5 me-3 mb-4">Subscription</h1>

      {/* Expiry banners */}
      {isExpired && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
          <span className="d-flex gap-2">
            <IconAlertOctagon size={20} className="flex-shrink-0" />
            <span>
              <strong>Your subscription has expired.</strong> You are on the Free plan now, so Free limits apply and
              subscription featuring has ended.
            </span>
          </span>
          <button type="button" className="btn btn-danger btn-sm" onClick={goToPlans}>
            Renew now
          </button>
        </div>
      )}

      {isPaid && expiryLevel !== "ok" && (
        <div
          className={`alert ${expiryLevel === "danger" ? "alert-danger" : "alert-warning"} d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4`}
        >
          <span className="d-flex gap-2">
            {expiryLevel === "danger" ? (
              <IconAlertOctagon size={20} className="flex-shrink-0" />
            ) : (
              <IconAlertTriangle size={20} className="flex-shrink-0" />
            )}
            <span>
              Your <span className="text-capitalize">{planName}</span> plan expires in{" "}
              <strong>
                {daysLeft} day{daysLeft === 1 ? "" : "s"}
              </strong>{" "}
              ({formatDate(subscription.expiryDate)}). Renew now to keep your limits and featured listings. Renewing adds
              the new period on top of your remaining days.
            </span>
          </span>
          <button
            type="button"
            className={`btn btn-sm ${expiryLevel === "danger" ? "btn-danger" : "btn-warning"}`}
            onClick={goToPlans}
          >
            Renew plan
          </button>
        </div>
      )}

      {!isPaid && discountedPlan && (
        <div className="alert alert-danger d-inline-flex align-items-center gap-2 mb-4">
          <IconTag size={16} />
          <span className="small fw-medium">
            {discountedPlan.discountPercentage}% off on the <span className="text-capitalize">{discountedPlan.name}</span>{" "}
            plan right now!
          </span>
        </div>
      )}

      {/* Plan card */}
      <div className={`card mb-4 ${isPaid && !isExpired ? "border-success" : ""}`}>
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center row-gap-3 justify-content-between mb-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className={`${meta.accent} bg-body-secondary rounded-circle d-flex align-items-center justify-content-center`}
                style={{ width: 48, height: 48 }}
              >
                <PlanIcon size={24} stroke={1.5} />
              </div>
              <div>
                <h5 className="fw-bold text-capitalize mb-0">{planName} Plan</h5>
                {isPaid ? (
                  <span className="badge bg-success-subtle text-success fw-medium d-inline-flex align-items-center gap-1 mt-1">
                    <IconCircleCheck size={14} />
                    Active
                  </span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary fw-medium mt-1">
                    {isExpired ? "Expired, now on Free" : "Default plan"}
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
              onClick={goToPlans}
            >
              {isPaid ? "Renew / Change Plan" : "View Plans"}
              <IconArrowUpRight size={16} />
            </button>
          </div>

          {isPaid && (
            <div className="row g-3">
              <div className="col-12 col-sm-4">
                <div className="d-flex align-items-center gap-2 text-secondary mb-1">
                  <IconCalendarEvent size={16} />
                  <span className="small">Start Date</span>
                </div>
                <p className="fw-semibold mb-0">{formatDate(subscription.startDate)}</p>
              </div>
              <div className="col-12 col-sm-4">
                <div className="d-flex align-items-center gap-2 text-secondary mb-1">
                  <IconCalendarTime size={16} />
                  <span className="small">Expiry Date</span>
                </div>
                <p className="fw-semibold mb-0">{formatDate(subscription.expiryDate)}</p>
              </div>
              <div className="col-12 col-sm-4">
                <div className="d-flex align-items-center gap-2 text-secondary mb-1">
                  <IconClockHour4 size={16} />
                  <span className="small">Time Left</span>
                </div>
                <p
                  className={`fw-semibold mb-0 ${
                    expiryLevel === "danger" ? "text-danger" : expiryLevel === "warning" ? "text-warning-emphasis" : ""
                  }`}
                >
                  {daysLeft} day{daysLeft === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage record */}
      <h6 className="fw-semibold mb-3">Your Usage</h6>
      <div className="row g-3 mb-3">
        <UsageCard
          icon={<IconAd2 size={16} />}
          title="Ads"
          label="ads"
          limit={limits?.ads}
          onUpgrade={goToPlans}
        />
        <UsageCard
          icon={<IconShoppingBag size={16} />}
          title="Products"
          label="products"
          limit={limits?.products}
          onUpgrade={goToPlans}
        />
        <FeaturedCard limit={limits?.featured} onUpgrade={goToPlans} />
      </div>

      {images && (
        <div className="d-flex align-items-center gap-2 text-secondary small">
          <IconPhoto size={16} />
          <span>
            Images per listing: up to {images.ads === -1 ? "unlimited" : images.ads} per ad and{" "}
            {images.products === -1 ? "unlimited" : images.products} per product.
          </span>
        </div>
      )}
    </div>
  );
};

export default SellerSubscription;