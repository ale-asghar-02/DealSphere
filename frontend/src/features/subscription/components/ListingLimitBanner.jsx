import { useNavigate } from "react-router-dom";
import { IconAlertTriangle, IconAlertOctagon, IconInfoCircle, IconArrowUpRight } from "@tabler/icons-react";
import { useListingLimit } from "../hooks/useSubscription";

const STYLES = {
  ok: { cls: "alert-light border", Icon: IconInfoCircle },
  warning: { cls: "alert-warning", Icon: IconAlertTriangle },
  danger: { cls: "alert-danger", Icon: IconAlertOctagon },
};

// type: "ad" | "product"
const ListingLimitBanner = ({ type, className = "" }) => {
  const navigate = useNavigate();
  const { limit, plan, level, reached } = useListingLimit(type);

  if (!limit) return null;

  const label = type === "ad" ? "ads" : "products";
  const { cls, Icon } = STYLES[level];

  let message;
  if (limit.unlimited) {
    message = `Your ${plan} plan includes unlimited ${label}. You have ${limit.used} live right now.`;
  } else if (reached) {
    message = `Limit reached: you are using ${limit.used} of ${limit.limit} ${label} on your ${plan} plan. Mark some as sold, delete old ones, or upgrade to post more.`;
  } else if (level === "warning") {
    message = `Almost full: ${limit.used} of ${limit.limit} ${label} used. Only ${limit.remaining} slot${limit.remaining === 1 ? "" : "s"} left.`;
  } else {
    message = `${limit.used} of ${limit.limit} ${label} used on your ${plan} plan. ${limit.remaining} slot${limit.remaining === 1 ? "" : "s"} left.`;
  }

  return (
    <div className={`alert ${cls} d-flex flex-wrap align-items-center gap-2 mb-0 ${className}`} role="alert">
      <Icon size={20} className="flex-shrink-0" />
      <p className="small mb-0">{message}</p>
      <div className="ms-auto">
        {!limit.unlimited && level !== "ok" && (
          <button
            type="button"
            className="btn btn-sm btn-dark d-inline-flex align-items-center gap-1"
            onClick={() => navigate("/upgrade-plan")}
          >
            Upgrade plan <IconArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingLimitBanner;