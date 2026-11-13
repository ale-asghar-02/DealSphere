const AppError = require("../utils/AppError");

// ────────────────────────────────
// helper: PKR ko USD me convert karne k liye live rate fetch karo
// exchangerate-api.com ka free open endpoint - koi API key nahi chahiye
// Order aur Featured Ads/Products dono jagah isi ek function se rate liya jayega
// ────────────────────────────────

let cachedRate = null;
let cachedRateTime = 0;
const RATE_CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
const MIN_PRICE_USD = 0.5;

const getPkrToUsdRate = async () => {
  const now = Date.now();

  // agar cached rate abhi bhi fresh hai (1 hour se kam purana), wahi use karo
  if (cachedRate && now - cachedRateTime < RATE_CACHE_DURATION) {
    return cachedRate;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    
    const data = await response.json();

    if (!data.rates || !data.rates.PKR) {
      throw new Error("PKR rate not found in response");
    }

    cachedRate = data.rates.PKR; // 1 USD = kitne PKR
    cachedRateTime = now;

    return cachedRate;
  } catch (error) {
    console.error("Exchange rate fetch failed:", error.message);

    if (cachedRate) return cachedRate; // purana cached rate hi use kar lo
    return 280; // approx fallback rate - apna latest check kar k update karte raho
  }
};

// helper: PKR amount ko seedha USD cents me convert kar de (Stripe unit_amount k liye ready)
const convertPkrToUsdCents = async (pkrAmount) => {
  const rate = await getPkrToUsdRate();
  const usdAmount = pkrAmount / rate;
  return {
    usdCents: Math.round(usdAmount * 100),
    rateUsed: rate,
  };
};

// price kam az kam $0.50 ke equal honi chahiye (PKR input, live rate se check)
const assertMinPrice = async (pkrPrice) => {
  const amount = Number(pkrPrice);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Invalid price", 400);
  }

  const rate = await getPkrToUsdRate();
  const amountUsd = amount / rate;

  if (amountUsd < MIN_PRICE_USD) {
    const minPkr = Math.ceil(MIN_PRICE_USD * rate);
    throw new AppError(
      `Price must be at least $${MIN_PRICE_USD.toFixed(2)} (approx. Rs ${minPkr})`,
      400
    );
  }
};

module.exports = { getPkrToUsdRate, convertPkrToUsdCents, assertMinPrice };