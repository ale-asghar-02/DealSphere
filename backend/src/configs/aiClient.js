const { GoogleGenAI } = require("@google/genai");
const config = require("./config");
const logger = require("../utils/logger");

// Global HTTP timeout. Image generation ke liye us call mein alag lamba timeout do
// (config: { httpOptions: { timeout: 90000 } }).
const HTTP_TIMEOUT_MS = 60000;

const ai = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
  httpOptions: { timeout: HTTP_TIMEOUT_MS },
});

const RETRYABLE = new Set([429, 503]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Temporary errors (429 / 503) par chhota retry with exponential backoff + jitter.
 * Baaqi errors (400, 401, 403 ...) par retry nahi hota, wahi error aage throw hota hai.
 * Sirf woh kaam retry karo jo dobara chalana safe ho (DB save / payment ke around kabhi nahi).
 */
const withRetry = async (fn, { retries = 2, baseDelayMs = 800 } = {}) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.code;
      if (!RETRYABLE.has(status) || attempt >= retries) throw err;

      const delay = baseDelayMs * 2 ** attempt + Math.random() * 300;
      logger.warn(`Gemini ${status} - retry ${attempt + 1}/${retries} in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
};

// ai.models.generateContent ka drop-in replacement (same params, same response)
const generate = (params) => withRetry(() => ai.models.generateContent(params));

module.exports = { ai, generate, withRetry };