import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { purchaseSubscription } from "../services/subscriptionAPI";
import { subscribe, getSnapshot, fetchSubscription, fetchPlans, getLimitLevel } from "../store/SubscriptionStore";

const HARD_MAX_IMAGES = 12;

const useSubscription = () => {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  const [purchasing, setPurchasing] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  const handleReadAllPlans = async () => {
    setPlansLoading(true);
    try {
      await fetchPlans();
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch plans"));
      return false;
    } finally {
      setPlansLoading(false);
    }
  };

  const handleReadSubscription = async () => {
    try {
      await fetchSubscription({ silent: false });
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot fetch subscription"));
      return false;
    }
  };

  const handlePurchaseSubscription = async (planName) => {
    setPurchasing(true);
    try {
      const data = await purchaseSubscription(planName);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot purchase subscription"));
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  return {
    plans: snap.plans,
    subscription: snap.subscription,
    limits: snap.limits,
    images: snap.images,
    loaded: snap.loaded,
    subscriptionLoading: snap.loading || plansLoading || purchasing,
    handleReadAllPlans,
    handleReadSubscription,
    handlePurchaseSubscription,
    refreshSubscription: () => fetchSubscription(),
  };
};

// ─────────────────────────────────────────────
// For create / edit forms: max images allowed on the seller's current plan
// type: "ad" | "product"
// ─────────────────────────────────────────────
export const useImageLimit = (type) => {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!snap.loaded) fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planMax = snap.images?.[type === "ad" ? "ads" : "products"];
  if (!planMax || planMax < 0) return HARD_MAX_IMAGES;
  return Math.min(planMax, HARD_MAX_IMAGES);
};

// ─────────────────────────────────────────────
// For create forms: live usage of one listing type
// ─────────────────────────────────────────────
export const useListingLimit = (type) => {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const limit = snap.limits?.[type === "ad" ? "ads" : "products"] || null;

  return {
    limit,
    plan: snap.subscription?.plan || "free",
    level: getLimitLevel(limit),
    reached: !!limit && !limit.unlimited && limit.used >= limit.limit,
  };
};

export default useSubscription;