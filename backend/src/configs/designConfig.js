const path = require("path");

/**
 * Design Studio ki saari settings ek jagah.
 * Plans ki asal values DB (DesignPlan) se aati hain; DEFAULT_PLANS sirf
 * seed script aur fallback ke liye hain (agar DB mein plan na mile).
 */

// Pakistan time (UTC+5, DST nahi hota). Daily/monthly limits isi time par reset hoti hain.
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

// Real-life sizes (Gemini image models ke supported aspect ratios mein se)
const PURPOSES = {
  poster: {
    label: "Poster",
    aspectRatio: "3:4",
    realSize: "18 x 24 in (portrait)",
    layoutHint: "tall portrait poster with a clear headline at the top and the hero product in the centre",
  },
  advertisement: {
    label: "Advertisement",
    aspectRatio: "4:5",
    realSize: "1080 x 1350 px (social feed ad)",
    layoutHint: "feed advertisement with a strong offer and a clear call to action",
  },
  social_post: {
    label: "Social Media Post",
    aspectRatio: "1:1",
    realSize: "1080 x 1080 px (square post)",
    layoutHint: "square social post, bold and readable on a phone screen",
  },
  story: {
    label: "Story / Reel Cover",
    aspectRatio: "9:16",
    realSize: "1080 x 1920 px (vertical story)",
    layoutHint: "full-screen vertical story, keep important text away from the top and bottom edges",
  },
  banner: {
    label: "Website Banner",
    aspectRatio: "16:9",
    realSize: "1920 x 1080 px (wide banner)",
    layoutHint: "wide landscape banner with the text on one side and the product on the other",
  },
};

const PRESET_COLORS = [
  { key: "red", label: "Red", hex: "#C8102E" },
  { key: "pink", label: "Pink", hex: "#D81B60" },
  { key: "orange", label: "Orange", hex: "#F57C00" },
  { key: "yellow", label: "Yellow", hex: "#FBC02D" },
  { key: "green", label: "Green", hex: "#2E7D32" },
  { key: "teal", label: "Teal", hex: "#00897B" },
  { key: "blue", label: "Blue", hex: "#1565C0" },
  { key: "purple", label: "Purple", hex: "#6A1B9A" },
  { key: "black", label: "Black & Gold", hex: "#111111" },
  { key: "white", label: "Clean White", hex: "#FAFAFA" },
];

// Flow ke steps (order yehi hai)
const STEPS = ["input", "purpose", "color", "content", "generate", "done"];

const STATUS = {
  DRAFT: "draft",
  ANALYZING: "analyzing",
  QUESTIONING: "questioning",
  READY: "ready",
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
};

const LIMITS = {
  MIN_PROMPT_LENGTH: 3,
  MAX_PROMPT_LENGTH: 500,
  MAX_EDIT_INSTRUCTION_LENGTH: 300,
  MAX_COLORS: 3,
  MAX_FEATURES: 6,
  FIELD_MAX: {
    title: 60,
    tagline: 80,
    discount: 40,
    description: 300,
    feature: 80,
    cta: 30,
    contact: 80,
  },
};

const CURRENCY = { code: "PKR", label: "Rs" };

const IMAGE = {
  FOLDER: "design-studio",
  TIMEOUT_MS: 90 * 1000, // aiClient ka global 60s image ke liye kam hai
  MAX_REF_IMAGE_BYTES: 5 * 1024 * 1024,
  // "generating" mein is se zyada atka session fail + refund hoga (cron dekhega)
  STUCK_GENERATING_MINUTES: 10,
};

const RETENTION = {
  SESSION_DAYS: 30,
  USAGE_DAY_DOCS_TTL_DAYS: 35,
  USAGE_MONTH_DOCS_TTL_DAYS: 400,
};

const SUBSCRIPTION = {
  REMINDER_DAYS_BEFORE_EXPIRY: 3,
  CHECKOUT_EXPIRY_MINUTES: 30, // Stripe ki minimum 30 minute hai
};

const WATERMARK = {
  LOGO_PATH: path.join(__dirname, "../assets/images/home-page-logo.avif"),
  OPACITY: 0.35,
  ROTATION_DEG: -30,
  LOGO_WIDTH_RATIO: 0.28, // logo ki chorai image ki chorai ka kitna hissa
  GAP_RATIO: 0.18, // do logos ke beech ka faasla
};

const RATE_LIMITS = {
  USER_PER_MINUTE: 10,
  GLOBAL_PER_MINUTE: 15, // chatbot ki free quota ko bachane ke liye alag cap
};

// null = koi limit nahi
const DEFAULT_PLANS = {
  free: {
    name: "free",
    price: 0,
    durationInDays: null,
    dailyLimit: 3,
    monthlyLimit: null,
    editsPerDesign: 2,
    watermark: true,
  },
  monthly: {
    name: "monthly",
    price: 1499,
    durationInDays: 30,
    dailyLimit: null,
    monthlyLimit: 100,
    editsPerDesign: 5,
    watermark: false,
  },
  yearly: {
    name: "yearly",
    price: 9999,
    durationInDays: 365,
    dailyLimit: 20, // "unlimited" dikhta hai, lekin fair-use cap hai
    monthlyLimit: null,
    editsPerDesign: 5,
    watermark: false,
  },
};

module.exports = {
  PKT_OFFSET_MS,
  PURPOSES,
  PRESET_COLORS,
  STEPS,
  STATUS,
  LIMITS,
  CURRENCY,
  IMAGE,
  RETENTION,
  SUBSCRIPTION,
  WATERMARK,
  RATE_LIMITS,
  DEFAULT_PLANS,
};