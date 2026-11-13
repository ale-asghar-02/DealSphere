const mongoose = require("mongoose");
const sharp = require("sharp");

const userModel = require("../../models/userModel");
const { DesignSession } = require("../../models/designModel");
const quota = require("../../services/imageGenerate/designQuotaService");
const analysisService = require("../../services/imageGenerate/designAnalysisService");
const imageService = require("../../services/imageGenerate/designImageService");
const { uploadFile } = require("../../configs/cloudinary");
const { sendNotification } = require("../../socket/notificationSocket");
const { emitDesignUpdate } = require("../../socket/designSocket");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { PURPOSES, PRESET_COLORS, STATUS, LIMITS, IMAGE, CURRENCY } = require("../../configs/designConfig");

const REFERENCE_MAX_DIMENSION = 2048;

/* ------------------------------------------------------------------ */
/* 1. HELPERS                                                          */
/* ------------------------------------------------------------------ */
// err.details wale errors (limit, edit limit) ko seedha JSON mein bhejta hai, taake frontend ko "code" mile
const sendError = (res, next, err) => {
  if (err?.details) {
    return res
      .status(err.statusCode || err.status || 400)
      .json({ success: false, message: err.message, ...err.details });
  }
  next(err);
};

const handler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    sendError(res, next, err);
  }
};

const blocked = (res, reason) =>
  res.status(422).json({ success: false, code: "CONTENT_BLOCKED", message: reason });

// Email verified hona zaroori hai (nayi email se roz free images lene se rokne ke liye)
const requireVerified = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("isAccountVerified").lean();
    if (!user?.isAccountVerified) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_NOT_VERIFIED",
        message: "Please verify your email to use the Design Studio.",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

const loadOwnedSession = async (req) => {
  const session = await DesignSession.findOne({ _id: req.validated.params.id, user: req.user.id });
  if (!session) throw new AppError("Design not found", 404);
  return session;
};

const limitReachedError = (usage) => {
  const scope = usage.daily.remaining === 0 ? "daily" : "monthly";
  const bucket = usage[scope];
  const isFree = usage.plan.name === "free";

  const err = new AppError(
    `You have reached your ${scope} limit of ${bucket.limit} designs.` +
      (isFree ? " Upgrade your plan to create more designs." : " Please try again after it resets."),
    429
  );
  err.details = {
    code: "DESIGN_LIMIT_REACHED",
    scope,
    limit: bucket.limit,
    plan: usage.plan.name,
    resetsAt: bucket.resetsAt,
    upgradeRequired: isFree,
  };
  return err;
};

// Reference image: asli image check (sirf mimetype par bharosa nahi), EXIF seedha, bari image chhoti
const processReferenceImage = async (file) => {
  try {
    const { data, info } = await sharp(file.buffer)
      .rotate()
      .resize({ width: REFERENCE_MAX_DIMENSION, height: REFERENCE_MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    if (!["jpeg", "png", "webp"].includes(info.format)) throw new Error("unsupported format");
    return { buffer: data, mimeType: `image/${info.format}` };
  } catch (err) {
    throw new AppError("Please upload a valid JPG, PNG or WebP image.", 400);
  }
};

/* ------------------------------------------------------------------ */
/* 2. STEPS AUR SAWAL                                                  */
/* ------------------------------------------------------------------ */
// Jo user pehle bata chuka hai wo dobara nahi poochte
const computeStep = (s) => {
  if (!s.answers?.purpose) return "purpose";
  if (!s.answers?.colors?.length) return "color";
  if (!s.brief) return "content";
  return s.versions?.length ? "done" : "generate";
};

const CONTENT_FIELDS = [
  { key: "title", label: "Title / headline", type: "text", required: true, maxLength: LIMITS.FIELD_MAX.title },
  { key: "tagline", label: "Tagline", type: "text", maxLength: LIMITS.FIELD_MAX.tagline },
  { key: "price", label: `Price (${CURRENCY.label})`, type: "number" },
  { key: "discount", label: "Discount (for example 10% OFF)", type: "text", maxLength: LIMITS.FIELD_MAX.discount },
  {
    key: "features",
    label: "Key features",
    type: "list",
    maxItems: LIMITS.MAX_FEATURES,
    maxLength: LIMITS.FIELD_MAX.feature,
  },
  { key: "description", label: "Short description", type: "textarea", maxLength: LIMITS.FIELD_MAX.description },
  { key: "cta", label: "Button text (for example Buy Now)", type: "text", maxLength: LIMITS.FIELD_MAX.cta },
  { key: "contact", label: "Contact / address", type: "text", maxLength: LIMITS.FIELD_MAX.contact },
];

const buildQuestion = (session) => {
  const s = typeof session.toObject === "function" ? session.toObject() : session;

  if (s.status === STATUS.GENERATING) return { step: "generating" };

  const step = computeStep(s);
  const detected = s.analysis?.detected || {};

  if (step === "purpose") {
    return {
      step,
      type: "single_choice",
      title: "What is this design for?",
      options: Object.entries(PURPOSES).map(([key, p]) => ({
        key,
        label: p.label,
        realSize: p.realSize,
        aspectRatio: p.aspectRatio,
      })),
      suggested: detected.purpose || null,
    };
  }

  if (step === "color") {
    return {
      step,
      type: "color_choice",
      title: "Which colors should the design use?",
      presets: PRESET_COLORS,
      suggested: s.analysis?.suggestedColors || [],
      maxColors: LIMITS.MAX_COLORS,
    };
  }

  if (step === "content") {
    const c = s.answers?.content || {};
    const values = {};
    CONTENT_FIELDS.forEach((f) => {
      values[f.key] = c[f.key] ?? detected[f.key] ?? (f.type === "list" ? [] : null);
    });
    return {
      step,
      type: "form",
      title: "What should be written on the design?",
      hint: "If you add too much, the AI may leave out the least important details to keep the design clean.",
      fields: CONTENT_FIELDS,
      values,
    };
  }

  return { step }; // "generate" ya "done"
};

const sessionResponse = async (session, userId) => ({
  session: session.toClient(),
  question: buildQuestion(session),
  usage: await quota.getUsageSummary(userId),
});

/* ------------------------------------------------------------------ */
/* 3. CONFIG / USAGE (frontend ke liye)                                */
/* ------------------------------------------------------------------ */
const getConfig = handler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      purposes: Object.entries(PURPOSES).map(([key, p]) => ({
        key,
        label: p.label,
        realSize: p.realSize,
        aspectRatio: p.aspectRatio,
      })),
      presetColors: PRESET_COLORS,
      limits: {
        maxPromptLength: LIMITS.MAX_PROMPT_LENGTH,
        minPromptLength: LIMITS.MIN_PROMPT_LENGTH,
        maxEditInstructionLength: LIMITS.MAX_EDIT_INSTRUCTION_LENGTH,
        maxColors: LIMITS.MAX_COLORS,
        maxFeatures: LIMITS.MAX_FEATURES,
        fieldMax: LIMITS.FIELD_MAX,
        maxImageMb: IMAGE.MAX_REF_IMAGE_BYTES / (1024 * 1024),
      },
      currency: CURRENCY,
    },
  });
});

const getUsage = handler(async (req, res) => {
  res.status(200).json({ success: true, data: await quota.getUsageSummary(req.user.id) });
});

/* ------------------------------------------------------------------ */
/* 4. SESSION SHURU KARNA (moderation + analysis)                      */
/* ------------------------------------------------------------------ */
const createSession = handler(async (req, res) => {
  const userId = req.user.id;
  const { prompt } = req.validated.body;

  // Limit khatam ho to shuru mein hi bata do, sawal poochne ke baad nahi
  const usage = await quota.getUsageSummary(userId);
  if (!usage.canGenerate) throw limitReachedError(usage);

  const image = req.file ? await processReferenceImage(req.file) : null;

  const result = await analysisService.analyzeInput({ prompt, image });
  if (!result.isSafe) return blocked(res, result.blockReason);

  // Moderation ke baad hi image Cloudinary par jati hai
  const sessionId = new mongoose.Types.ObjectId();
  let uploaded = null;
  if (image) {
    const up = await uploadFile(image.buffer, `${IMAGE.FOLDER}/${sessionId}`);
    uploaded = { url: up.url, publicId: up.public_id };
  }

  const a = result.analysis;
  const d = a.detected;

  let session;
  try {
    session = new DesignSession({
      _id: sessionId,
      user: userId,
      status: STATUS.QUESTIONING,
      input: {
        prompt,
        image: uploaded || {},
        imageMimeType: image?.mimeType || null,
      },
      analysis: {
        subject: a.subject,
        summary: a.summary,
        detected: d,
        missing: a.missing,
        suggestedColors: a.suggestedColors,
      },
      answers: {
        purpose: d.purpose,
        colors: d.colors,
        content: {
          title: d.title,
          tagline: d.tagline,
          price: d.price,
          discount: d.discount,
          description: null,
          features: d.features,
          cta: d.cta,
          contact: d.contact,
        },
      },
    });
    session.step = computeStep(session);
    await session.save();
  } catch (err) {
    if (uploaded) await imageService.deleteSessionAssets({ input: { image: uploaded } }).catch(() => {});
    throw err;
  }

  res.status(201).json({ success: true, data: await sessionResponse(session, userId) });
});

/* ------------------------------------------------------------------ */
/* 5. LIST / GET / DELETE                                              */
/* ------------------------------------------------------------------ */
const listSessions = handler(async (req, res) => {
  const { page, limit } = req.validated.query;
  const filter = { user: req.user.id };

  const [items, total] = await Promise.all([
    DesignSession.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    DesignSession.countDocuments(filter),
  ]);

  const data = items.map((s) => {
    const last = s.versions?.[s.versions.length - 1];
    return {
      id: s._id,
      status: s.status,
      step: s.step,
      prompt: s.input?.prompt,
      purpose: s.answers?.purpose || null,
      thumbnailUrl: last?.preview?.url || null,
      createdAt: s.createdAt,
    };
  });

  res.status(200).json({ success: true, data, pagination: { page, limit, total } });
});

const getSession = handler(async (req, res) => {
  const session = await loadOwnedSession(req);
  res.status(200).json({ success: true, data: await sessionResponse(session, req.user.id) });
});

const deleteSession = handler(async (req, res) => {
  const session = await loadOwnedSession(req);
  if (session.status === STATUS.GENERATING) {
    throw new AppError("This design is being created right now. Please wait until it finishes.", 409);
  }

  await imageService.deleteSessionAssets(session);
  await DesignSession.deleteOne({ _id: session._id, user: req.user.id });

  res.status(200).json({ success: true, message: "Design deleted" });
});

/* ------------------------------------------------------------------ */
/* 6. JAWAB SAVE KARNA                                                 */
/* ------------------------------------------------------------------ */
const submitAnswer = handler(async (req, res) => {
  const body = req.validated.body;
  const session = await loadOwnedSession(req);

  if (![STATUS.DRAFT, STATUS.QUESTIONING, STATUS.READY, STATUS.FAILED].includes(session.status)) {
    throw new AppError("This design can't be changed right now.", 409);
  }
  if (body.step === "content" && (!session.answers.purpose || !session.answers.colors?.length)) {
    throw new AppError("Please answer the previous questions first.", 400);
  }

  if (body.step === "purpose") session.answers.purpose = body.purpose;
  if (body.step === "color") session.answers.colors = body.colors;
  if (body.step === "content") {
    session.answers.content = {
      title: body.title,
      tagline: body.tagline ?? null,
      price: body.price ?? null,
      discount: body.discount ?? null,
      description: body.description ?? null,
      features: body.features ?? [],
      cta: body.cta ?? null,
      contact: body.contact ?? null,
    };
  }

  // Brief tab banta hai jab content diya jaye; purpose/color badalne par purana brief dobara banta hai
  const needsBrief =
    session.answers.purpose &&
    session.answers.colors?.length &&
    session.answers.content?.title &&
    (body.step === "content" || session.brief);

  if (needsBrief) {
    const result = await analysisService.createBrief(session);
    if (!result.isSafe) return blocked(res, result.blockReason); // session save nahi hota, galat content nahi rehta
    session.brief = result.brief;
  }

  session.step = computeStep(session);
  session.status = session.step === "generate" ? STATUS.READY : STATUS.QUESTIONING;
  await session.save();

  res.status(200).json({ success: true, data: await sessionResponse(session, req.user.id) });
});

/* ------------------------------------------------------------------ */
/* 7. GENERATE / EDIT (background mein chalte hain)                    */
/* ------------------------------------------------------------------ */
const emit = (userId, sessionId, payload) => emitDesignUpdate(userId, { sessionId: String(sessionId), ...payload });

const friendlyError = (err) =>
  err instanceof AppError && err.statusCode < 500
    ? err.message
    : err?.statusCode === 503 || err?.statusCode === 504
    ? err.message
    : "Something went wrong while creating your design. Please try again.";

const runGeneration = async ({ sessionId, userId, watermark, reservation }) => {
  try {
    emit(userId, sessionId, { status: STATUS.GENERATING, stage: "creating", message: "Creating your design..." });

    const session = await DesignSession.findById(sessionId);
    if (!session) throw new AppError("Design not found", 404);

    const { buffer } = await imageService.generateDesignImage({
      brief: session.brief,
      purpose: session.answers.purpose,
      referenceImageUrl: session.input?.image?.url || null,
    });

    emit(userId, sessionId, { status: STATUS.GENERATING, stage: "saving", message: "Finishing touches..." });
    const version = await imageService.saveImageVersion({ sessionId, buffer, watermark, source: "generate" });

    const updated = await DesignSession.findOneAndUpdate(
      { _id: sessionId, status: STATUS.GENERATING },
      { $push: { versions: version }, $set: { status: STATUS.COMPLETED, step: "done", error: null }, $inc: { generationCount: 1 } },
      { returnDocument: "after" }
    );
    if (!updated) {
      await imageService.deleteSessionAssets({ versions: [version] }).catch(() => {});
      throw new Error("Session changed while generating");
    }

    const latest = updated.versions[updated.versions.length - 1];
    emit(userId, sessionId, {
      status: STATUS.COMPLETED,
      step: "done",
      stage: "completed",
      version: { id: latest._id, previewUrl: latest.preview.url, watermarked: latest.watermarked },
    });
    await sendNotification({
      userId,
      type: "system",
      title: "Your design is ready",
      message: "Your AI design has been created. Tap to view, edit or download it.",
      actionUrl: `/design/${sessionId}`,
      metadata: { sessionId: String(sessionId), status: "completed" },
    });
  } catch (err) {
    logger.error(`Design generation failed (session ${sessionId}): ${err?.message || err}`);
    await failGeneration({ sessionId, userId, reservation, err });
  }
};

// Quota sirf EK baar wapas milta hai (refunded flag atomic claim hota hai)
const failGeneration = async ({ sessionId, userId, reservation, err }) => {
  const message = friendlyError(err);
  try {
    const claimed = await DesignSession.findOneAndUpdate(
      { _id: sessionId, "reservation.consumed": true, "reservation.refunded": false },
      { $set: { "reservation.refunded": true } }
    );
    if (claimed) await quota.refund(userId, reservation);

    await DesignSession.updateOne({ _id: sessionId }, { $set: { status: STATUS.FAILED, error: message } });
  } catch (e) {
    logger.error(`Design failGeneration cleanup error (session ${sessionId}): ${e.message}`);
  }

  emit(userId, sessionId, { status: STATUS.FAILED, stage: "failed", error: message });
  await sendNotification({
    userId,
    type: "system",
    title: "Design could not be created",
    message: `${message} Your design credit was not used.`,
    actionUrl: `/design/${sessionId}`,
    metadata: { sessionId: String(sessionId), status: "failed" },
  });
};

const generate = handler(async (req, res) => {
  const userId = req.user.id;
  const id = req.validated.params.id;

  const plan = await quota.getUserPlan(userId);

  // Ek hi waqt mein ek hi generation: status atomic tareeqe se "generating" hota hai (double-click safe)
  const previous = await DesignSession.findOneAndUpdate(
    {
      _id: id,
      user: userId,
      status: { $in: [STATUS.READY, STATUS.FAILED, STATUS.COMPLETED] },
      brief: { $ne: null },
    },
    { $set: { status: STATUS.GENERATING, generationStartedAt: new Date(), error: null } },
    { returnDocument: "before" }
  );

  if (!previous) {
    const existing = await DesignSession.findOne({ _id: id, user: userId });
    if (!existing) throw new AppError("Design not found", 404);
    if (existing.status === STATUS.GENERATING) throw new AppError("This design is already being created.", 409);
    throw new AppError("Please answer all the questions before creating the design.", 400);
  }

  let reservation;
  try {
    reservation = await quota.consume(userId);
  } catch (err) {
    await DesignSession.updateOne({ _id: id }, { $set: { status: previous.status } });
    throw err;
  }
  await DesignSession.updateOne({ _id: id }, { $set: { reservation } });

  res.status(202).json({ success: true, data: { sessionId: id, status: STATUS.GENERATING } });

  // Jawab de diya; kaam peeche chalta rahega, natija socket aur notification se milega
  runGeneration({ sessionId: id, userId, watermark: plan.watermark, reservation });
});

const runEdit = async ({ sessionId, userId, watermark, instruction, baseVersion }) => {
  try {
    emit(userId, sessionId, { status: STATUS.GENERATING, stage: "editing", message: "Applying your change..." });

    const session = await DesignSession.findById(sessionId);
    if (!session) throw new AppError("Design not found", 404);

    const { buffer } = await imageService.editDesignImage({
      instruction,
      purpose: session.answers.purpose,
      baseVersion,
    });

    const version = await imageService.saveImageVersion({
      sessionId,
      buffer,
      watermark,
      source: "edit",
      instruction,
    });

    const updated = await DesignSession.findOneAndUpdate(
      { _id: sessionId, status: STATUS.GENERATING },
      { $push: { versions: version }, $set: { status: STATUS.COMPLETED, step: "done", error: null } },
      { returnDocument: "after" }
    );
    if (!updated) {
      await imageService.deleteSessionAssets({ versions: [version] }).catch(() => {});
      throw new Error("Session changed while editing");
    }

    const latest = updated.versions[updated.versions.length - 1];
    emit(userId, sessionId, {
      status: STATUS.COMPLETED,
      step: "done",
      stage: "completed",
      version: { id: latest._id, previewUrl: latest.preview.url, watermarked: latest.watermarked },
    });
  } catch (err) {
    logger.error(`Design edit failed (session ${sessionId}): ${err?.message || err}`);
    const message = friendlyError(err);

    // Edit fail ho to edit wapas milti hai aur purana design salamat rehta hai
    await DesignSession.updateOne(
      { _id: sessionId },
      { $set: { status: STATUS.COMPLETED, error: message }, $inc: { editsUsed: -1 } }
    ).catch((e) => logger.error(`Design edit cleanup error: ${e.message}`));

    emit(userId, sessionId, { status: STATUS.COMPLETED, stage: "failed", error: message });
  }
};

const editDesign = handler(async (req, res) => {
  const userId = req.user.id;
  const { instruction, versionId } = req.validated.body;
  const session = await loadOwnedSession(req);

  if (session.status === STATUS.GENERATING) throw new AppError("Please wait until the current work finishes.", 409);
  if (session.status !== STATUS.COMPLETED || !session.versions?.length) {
    throw new AppError("Create the design first, then you can edit it.", 400);
  }

  const plan = await quota.getUserPlan(userId);
  quota.assertEditAllowed(plan, session.editsUsed);

  const baseVersion = versionId
    ? session.versions.find((v) => String(v._id) === versionId)
    : session.versions[session.versions.length - 1];
  if (!baseVersion) throw new AppError("Version not found", 404);

  const moderation = await analysisService.moderateInstruction(instruction);
  if (!moderation.isSafe) return blocked(res, moderation.blockReason);

  // Edit ek hi baar guzarti hai: status aur edit count ek saath atomic badalte hain
  const claimed = await DesignSession.findOneAndUpdate(
    { _id: session._id, user: userId, status: STATUS.COMPLETED, editsUsed: { $lt: plan.editsPerDesign } },
    { $set: { status: STATUS.GENERATING, generationStartedAt: new Date(), error: null }, $inc: { editsUsed: 1 } },
    { returnDocument: "after" }
  );
  if (!claimed) throw new AppError("This design can't be edited right now. Please try again.", 409);

  res.status(202).json({ success: true, data: { sessionId: session._id, status: STATUS.GENERATING } });

  runEdit({
    sessionId: session._id,
    userId,
    watermark: plan.watermark,
    instruction: moderation.instruction,
    baseVersion: baseVersion.toObject ? baseVersion.toObject() : baseVersion,
  });
});

/* ------------------------------------------------------------------ */
/* 8. DOWNLOAD                                                         */
/* ------------------------------------------------------------------ */
const downloadVersion = handler(async (req, res) => {
  const { versionId } = req.validated.params;
  const session = await loadOwnedSession(req);

  const version = session.versions.find((v) => String(v._id) === versionId);
  if (!version) throw new AppError("Version not found", 404);

  const url = imageService.buildDownloadUrl(version, `design-${String(session._id).slice(-6)}`);
  res.status(200).json({ success: true, data: { url, watermarked: version.watermarked } });
});

module.exports = {
  requireVerified,
  getConfig,
  getUsage,
  createSession,
  listSessions,
  getSession,
  deleteSession,
  submitAnswer,
  generate,
  editDesign,
  downloadVersion,
  _internal: { computeStep, buildQuestion },
};