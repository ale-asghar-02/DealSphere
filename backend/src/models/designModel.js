const mongoose = require("mongoose");
const { PURPOSES, STEPS, STATUS } = require("../configs/designConfig");

/* ------------------------------------------------------------------ */
/* 1. DESIGN PLAN (free / monthly / yearly)                           */
/* ------------------------------------------------------------------ */
const designPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      required: true,
      unique: true,
    },
    price: { type: Number, required: true, default: 0 }, // PKR
    durationInDays: { type: Number, default: null },

    // null = is cheez par limit nahi
    dailyLimit: { type: Number, default: null, min: 0 },
    monthlyLimit: { type: Number, default: null, min: 0 },
    editsPerDesign: { type: Number, required: true, default: 2, min: 0 },
    watermark: { type: Boolean, default: true },

    // Discount (seller plans jaisa: admin controlled, time-limited)
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountValidUntil: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

designPlanSchema.methods.getEffectivePrice = function () {
  const hasActiveDiscount =
    this.discountPercentage > 0 &&
    this.discountValidUntil &&
    this.discountValidUntil > new Date();

  if (!hasActiveDiscount) return this.price;

  const discounted = this.price - (this.price * this.discountPercentage) / 100;
  return Math.round(discounted);
};

/* ------------------------------------------------------------------ */
/* 2. DESIGN USAGE (atomic quota counters)                            */
/*    Har user ke liye: ek doc per din, ek doc per mahina             */
/* ------------------------------------------------------------------ */
const designUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    scope: { type: String, enum: ["day", "month"], required: true },
    key: { type: String, required: true }, // "2026-10-04" ya "2026-10" (Pakistan time)
    count: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true }, // purane counters khud delete honge (TTL)
  },
  { timestamps: true }
);

// Unique index hi atomic upsert ko safe banata hai
designUsageSchema.index({ user: 1, scope: 1, key: 1 }, { unique: true });
designUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ------------------------------------------------------------------ */
/* 3. DESIGN SESSION                                                  */
/* ------------------------------------------------------------------ */
const imageRefSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema({
  source: { type: String, enum: ["generate", "edit"], required: true },
  instruction: { type: String, default: null }, // edit ki hidayat

  // Asal (bina watermark) image. Free users ke liye "authenticated" (private) hoti hai,
  // taake koi seedha URL se bina watermark download na kar sake. Client ko kabhi nahi bheji jati.
  original: {
    url: { type: String, default: null },
    publicId: { type: String, required: true },
    deliveryType: {
      type: String,
      enum: ["upload", "authenticated"],
      default: "upload",
    },
  },

  // User ko jo dikhai jati hai (free: watermark wali, paid: wahi asal image)
  preview: {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
  },

  watermarked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const designSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.DRAFT,
    },
    step: { type: String, enum: STEPS, default: "input" },

    // Step 1: user ka input
    input: {
      prompt: { type: String, default: "", trim: true },
      image: { type: imageRefSchema, default: () => ({}) }, // optional reference image
      imageMimeType: { type: String, default: null },
    },

    // Step 2: AI ka tajziya
    analysis: {
      subject: { type: String, default: null },
      summary: { type: String, default: null },
      detected: { type: mongoose.Schema.Types.Mixed, default: {} }, // jo user ne pehle hi bata diya
      missing: { type: [String], default: [] },
      suggestedColors: { type: [String], default: [] },
    },

    // Step 3: user ke jawab
    answers: {
      purpose: { type: String, enum: [...Object.keys(PURPOSES), null], default: null },
      colors: { type: [String], default: [] }, // hex ya naam
      content: {
        title: { type: String, default: null },
        tagline: { type: String, default: null },
        price: { type: Number, default: null, min: 0 }, // hamesha PKR
        discount: { type: String, default: null },
        description: { type: String, default: null },
        features: { type: [String], default: [] },
        cta: { type: String, default: null },
        contact: { type: String, default: null },
      },
    },

    // Step 4: AI ka banaya hua design brief
    brief: { type: String, default: null },

    versions: { type: [versionSchema], default: [] },
    editsUsed: { type: Number, default: 0, min: 0 },
    generationCount: { type: Number, default: 0, min: 0 },

    // Quota ka hisaab (refund usi din/mahine ke counter par hona chahiye jahan consume hua)
    reservation: {
      consumed: { type: Boolean, default: false },
      refunded: { type: Boolean, default: false },
      plan: { type: String, default: null },
      dayKey: { type: String, default: null },
      monthKey: { type: String, default: null },
    },

    error: { type: String, default: null },
    generationStartedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

designSessionSchema.index({ user: 1, createdAt: -1 });
designSessionSchema.index({ createdAt: 1 }); // 30 din ki safai ke liye
designSessionSchema.index({ status: 1, generationStartedAt: 1 }); // atke hue "generating" sessions

// Client ko bhejne wali shakal: asal (bina watermark) image kabhi nahi jati
designSessionSchema.methods.toClient = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    status: obj.status,
    step: obj.step,
    input: { prompt: obj.input?.prompt, imageUrl: obj.input?.image?.url || null },
    analysis: {
      subject: obj.analysis?.subject,
      summary: obj.analysis?.summary,
      missing: obj.analysis?.missing,
      suggestedColors: obj.analysis?.suggestedColors,
    },
    answers: obj.answers,
    versions: (obj.versions || []).map((v) => ({
      id: v._id,
      source: v.source,
      instruction: v.instruction,
      previewUrl: v.preview?.url,
      watermarked: v.watermarked,
      createdAt: v.createdAt,
    })),
    editsUsed: obj.editsUsed,
    error: obj.error,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const DesignPlan = mongoose.model("DesignPlan", designPlanSchema);
const DesignUsage = mongoose.model("DesignUsage", designUsageSchema);
const DesignSession = mongoose.model("DesignSession", designSessionSchema);

module.exports = { DesignPlan, DesignUsage, DesignSession };