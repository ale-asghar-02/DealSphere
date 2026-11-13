const MIN_USD = 0.5;
const CACHE_MS = 1000 * 60 * 60; // 1 hour
const FALLBACK_RATE = 280; // API fail ho aur cache khali ho to

let cachedRate = null;
let cachedAt = 0;
let pendingRequest = null; // ek waqt mein sirf ek API call

// 1 USD = kitne PKR (live, 1 ghante cache)
export const getPkrRate = async () => {
  if (cachedRate && Date.now() - cachedAt < CACHE_MS) return cachedRate;

  // agar call pehle se chal rahi hai to wahi wait karo
  if (pendingRequest) return pendingRequest;

  pendingRequest = (async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (!data?.rates?.PKR) throw new Error("PKR rate not found");

      cachedRate = data.rates.PKR;
      cachedAt = Date.now();
      return cachedRate;
    } catch {
      return cachedRate || FALLBACK_RATE;
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
};

// $0.50 ke barabar minimum price PKR mein
export const getMinPricePkr = async () => {
  const rate = await getPkrRate();
  return Math.ceil(MIN_USD * rate);
};

// check: price kam to nahi? (min null ho to false)
export const isPriceTooLow = (price, minPrice) =>
  Boolean(minPrice) && price !== "" && Number(price) < minPrice;