import { readAllPlans, readSubscription } from "../services/subscriptionAPI";

// ─────────────────────────────────────────────
// One shared store for the whole app. Any component can call
// `fetchSubscription()` after an action (create / edit / delete / feature ...)
// and every screen that shows usage updates instantly, without a page refresh.
// ─────────────────────────────────────────────

const initialState = {
  plans: [],
  subscription: null, // { plan, status, startDate, expiryDate, daysLeft, expiringSoon }
  limits: null, // { ads, products, featured }
  images: null, // { ads, products }  max images per listing on the current plan
  loading: false,
  loaded: false,
};

let state = initialState;
const listeners = new Set();

const setState = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => state;

let inflightSubscription = null;

// silent = true  -> no loading flag, no error toast (used for background refreshes)
export const fetchSubscription = async ({ silent = true } = {}) => {
  if (inflightSubscription) return inflightSubscription;

  if (!silent) setState({ loading: true });

  inflightSubscription = (async () => {
    try {
      const res = await readSubscription();
      setState({
        subscription: res.data,
        limits: res.limits,
        images: res.images,
        loaded: true,
        loading: false,
      });
      return true;
    } catch (error) {
      setState({ loading: false });
      if (!silent) throw error;
      return false;
    } finally {
      inflightSubscription = null;
    }
  })();

  return inflightSubscription;
};

export const fetchPlans = async () => {
  const res = await readAllPlans();
  setState({ plans: res.data });
  return res.data;
};

// Call this on logout so the next user never sees the previous user's data
export const resetSubscriptionStore = () => setState({ ...initialState });

// Refresh again whenever the seller comes back to the tab
if (typeof window !== "undefined") {
  const refreshOnReturn = () => {
    if (document.visibilityState === "visible" && state.loaded) fetchSubscription();
  };
  window.addEventListener("focus", refreshOnReturn);
  document.addEventListener("visibilitychange", refreshOnReturn);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// "ok" | "warning" | "danger"  (warning: 80% or more used, danger: limit reached)
export const getLimitLevel = (limit) => {
  if (!limit || limit.unlimited || !limit.limit) return "ok"; // unlimited, or not included (0)
  if (limit.used >= limit.limit) return "danger";
  if (limit.used / limit.limit >= 0.8) return "warning";
  return "ok";
};

// Expiry: expired or 3 days or less => danger, 7 days or less => warning
export const getExpiryLevel = (subscription) => {
  if (!subscription) return "ok";
  if (subscription.status === "expired") return "danger";
  if (subscription.plan === "free" || subscription.daysLeft == null) return "ok";
  if (subscription.daysLeft <= 3) return "danger";
  if (subscription.daysLeft <= 7) return "warning";
  return "ok";
};