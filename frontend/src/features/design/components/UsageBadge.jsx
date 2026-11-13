import React from "react";
import { Link } from "react-router-dom";
import { IconCrown, IconSparkles } from "@tabler/icons-react";

const PLAN_LABEL = { free: "Free", monthly: "Monthly", yearly: "Yearly" };

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// Daily aur monthly mein se wo limit chunte hain jo sab se pehle khatam hone wali hai
const pickLimit = (usage) => {
  const options = [];
  if (usage.daily?.limit != null) options.push({ label: "today", ...usage.daily });
  if (usage.monthly?.limit != null) options.push({ label: "this month", ...usage.monthly });
  if (!options.length) return null;
  return options.reduce((a, b) => (a.remaining / a.limit <= b.remaining / b.limit ? a : b));
};

const UsageBadge = ({ usage, loading = false, className = "" }) => {
  if (loading && !usage) {
    return (
      <div className={`ds-usage ${className}`}>
        <div className="placeholder-glow">
          <span className="placeholder col-5 rounded-pill mb-2"></span>
          <span className="placeholder col-12 rounded-pill"></span>
        </div>
      </div>
    );
  }
  if (!usage) return null;

  const plan = usage.plan?.name || "free";
  const isPaid = plan !== "free";
  const current = pickLimit(usage);
  const limitReached = usage.canGenerate === false;
  const percentUsed = current ? Math.min(100, Math.round((current.used / current.limit) * 100)) : 0;

  return (
    <div className={`ds-usage ${limitReached ? "is-limit" : ""} ${className}`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className={`ds-plan-chip ${isPaid ? "is-paid" : ""}`}>
          {isPaid && <IconCrown size={12} />}
          {PLAN_LABEL[plan] || plan}
        </span>
        {isPaid && usage.plan?.expiryDate && (
          <small className="text-muted">Until {formatDate(usage.plan.expiryDate)}</small>
        )}
      </div>

      {current ? (
        <>
          <div className="d-flex align-items-baseline justify-content-between mb-1">
            <span className="fw-semibold">
              {limitReached ? "Limit reached" : `${current.remaining} of ${current.limit} left`}
            </span>
            <small className="text-muted">{current.label}</small>
          </div>
          <div className="progress mb-2" role="progressbar" aria-valuenow={percentUsed} aria-valuemin={0} aria-valuemax={100}>
            <div className={`progress-bar ${limitReached ? "bg-danger" : ""}`} style={{ width: `${percentUsed}%` }} />
          </div>
        </>
      ) : (
        <div className="fw-semibold mb-2">
          <IconSparkles size={16} className="me-1 text-primary" />
          Unlimited designs
        </div>
      )}

      {limitReached && current?.resetsAt && (
        <small className="text-muted d-block mb-2">Resets on {formatDate(current.resetsAt)}</small>
      )}

      {!isPaid ? (
        <div className="d-flex align-items-center justify-content-between gap-2">
          <small className="text-muted">Free designs have a watermark</small>
          <Link to="/design/pricing" className="btn btn-primary btn-sm rounded-2 px-3">
            Upgrade
          </Link>
        </div>
      ) : (
        <small className="text-muted">No watermark · {usage.plan?.editsPerDesign} edits per design</small>
      )}
    </div>
  );
};

export default UsageBadge;