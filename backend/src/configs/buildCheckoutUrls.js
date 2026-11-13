const config = require("../configs/config");

// flow: "order" | "featured" | "subscription" | "design_subscription"
const buildCheckoutUrls = (flow, extra = {}) => {
  const qs = new URLSearchParams({ flow, ...extra }).toString();
  return {
    // {CHECKOUT_SESSION_ID} ko encode nahi karna, Stripe khud replace karta hai
    success_url: `${config.CLIENT_URL}/payment/success?${qs}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.CLIENT_URL}/payment/cancelled?${qs}`,
  };
};

module.exports = { buildCheckoutUrls };