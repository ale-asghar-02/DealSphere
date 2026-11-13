const axios = require("axios");
const sharp = require("sharp");
const config = require("../../configs/config");
const { ai, withRetry } = require("../../configs/aiClient");
const { cloudinary } = require("../../configs/cloudinary");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { PURPOSES, IMAGE } = require("../../configs/designConfig");
const { applyWatermark } = require("./watermarkService");

const BLOCKED_FINISH_REASONS = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "IMAGE_SAFETY",
  "IMAGE_PROHIBITED_CONTENT",
]);

// Gemini inhi formats ko image input mein leta hai
const GEMINI_INPUT_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

/* ------------------------------------------------------------------ */
/* 1. IMAGE LOAD KARNA (reference image / edit ki base image)         */
/* ------------------------------------------------------------------ */
const fetchImageBase64 = async (url) => {
  let buffer;
  let mimeType;

  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000,
      maxContentLength: IMAGE.MAX_REF_IMAGE_BYTES * 4,
    });
    buffer = Buffer.from(res.data);
    mimeType = String(res.headers["content-type"] || "").split(";")[0].trim();
  } catch (err) {
    logger.error(`Design image fetch failed: ${err.message}`);
    throw new AppError("Could not load the image for this design. Please try again.", 502);
  }

  // avif/gif waghera Gemini ko nahi bhej sakte, PNG mein badal dete hain
  if (!GEMINI_INPUT_MIME.has(mimeType)) {
    try {
      buffer = await sharp(buffer).png().toBuffer();
      mimeType = "image/png";
    } catch (err) {
      logger.error(`Design image convert failed: ${err.message}`);
      throw new AppError("This image format is not supported. Please use a JPG, PNG or WebP image.", 400);
    }
  }

  return { base64: buffer.toString("base64"), mimeType };
};

// Free users ki asal image private (authenticated) hoti hai, uska signed URL banana parta hai
const getOriginalUrl = (original) => {
  if (original.deliveryType === "authenticated") {
    return cloudinary.url(original.publicId, {
      type: "authenticated",
      sign_url: true,
      secure: true,
      resource_type: "image",
    });
  }
  return original.url;
};

/* ------------------------------------------------------------------ */
/* 2. GEMINI IMAGE MODEL                                              */
/* ------------------------------------------------------------------ */
const toImageError = (err) => {
  const status = err?.status || err?.code;
  const msg = String(err?.message || "").toLowerCase();

  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("abort") || msg.includes("deadline")) {
    logger.warn("Design image: AI timeout");
    return new AppError("The image took too long to create. Please try again.", 504);
  }
  if (status === 429 || status === 503) {
    logger.warn(`Design image: AI busy (${status})`);
    return new AppError("The AI image service is busy right now. Please try again in a minute.", 503);
  }
  logger.error(`Design image generation failed: ${err?.message || err}`);
  return new AppError("Image generation failed. Please try again.", 502);
};

const extractImage = (response) => {
  const candidate = response?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  // Pro model beech mein "thought" images bhi bhejta hai; aakhri asal image uthate hain
  const imageParts = parts.filter((p) => p?.inlineData?.data && !p.thought);
  const last = imageParts[imageParts.length - 1];
  if (last) {
    return { buffer: Buffer.from(last.inlineData.data, "base64"), mimeType: last.inlineData.mimeType || "image/png" };
  }

  const blockReason = response?.promptFeedback?.blockReason;
  const blocked = !!blockReason || BLOCKED_FINISH_REASONS.has(candidate?.finishReason);
  const modelText = parts.map((p) => p?.text).filter(Boolean).join(" ").slice(0, 200);
  logger.warn(
    `Design image: no image returned (finishReason=${candidate?.finishReason}, blockReason=${blockReason}, text="${modelText}")`
  );

  if (blocked) {
    throw new AppError(
      "The AI could not create this design because it was blocked by safety filters. Please change your description and try again.",
      422
    );
  }
  throw new AppError("The AI did not return an image. Please try again.", 502);
};

const callImageModel = async (parts, aspectRatio) => {
  let response;
  try {
    response = await withRetry(
      () =>
        ai.models.generateContent({
          model: config.GEMINI_IMAGE_MODEL,
          contents: [{ role: "user", parts }],
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio },
            httpOptions: { timeout: IMAGE.TIMEOUT_MS }, // global 60s image ke liye kam hai
          },
        }),
      { retries: 1 }
    );
  } catch (err) {
    throw toImageError(err);
  }
  return extractImage(response);
};

/**
 * Naya design banata hai.
 * @param {{ brief: string, purpose: string, referenceImageUrl?: string|null }} args
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
const generateDesignImage = async ({ brief, purpose, referenceImageUrl = null }) => {
  const aspectRatio = PURPOSES[purpose]?.aspectRatio;
  if (!aspectRatio) throw new AppError("Invalid design purpose.", 400);

  const parts = [{ text: brief }];
  if (referenceImageUrl) {
    const { base64, mimeType } = await fetchImageBase64(referenceImageUrl);
    parts.push({ inlineData: { mimeType, data: base64 } });
  }

  return callImageModel(parts, aspectRatio);
};

/**
 * Maujooda design mein prompt se tabdeeli karta hai (hamesha bina watermark wali asal image par).
 * @param {{ instruction: string, purpose: string, baseVersion: object }} args
 */
const editDesignImage = async ({ instruction, purpose, baseVersion }) => {
  const aspectRatio = PURPOSES[purpose]?.aspectRatio;
  if (!aspectRatio) throw new AppError("Invalid design purpose.", 400);
  if (!baseVersion?.original?.publicId) throw new AppError("The design to edit was not found.", 404);

  const { base64, mimeType } = await fetchImageBase64(getOriginalUrl(baseVersion.original));

  const editPrompt =
    `Edit the attached marketing design. Apply ONLY this change: "${instruction}". ` +
    "Keep everything else exactly as it is: the layout, the product, the colours, and all existing text with its exact spelling. " +
    "Keep the same aspect ratio. Output the complete edited image.";

  return callImageModel([{ inlineData: { mimeType, data: base64 } }, { text: editPrompt }], aspectRatio);
};

/* ------------------------------------------------------------------ */
/* 3. CLOUDINARY MEIN SAVE                                            */
/* ------------------------------------------------------------------ */
const uploadBuffer = (buffer, { folder, type }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, type, resource_type: "image" }, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });

const destroyAsset = (publicId, type) =>
  cloudinary.uploader.destroy(publicId, { type, resource_type: "image", invalidate: true });

/**
 * Generate hui image ko save karta hai aur DesignSession.versions mein push hone wala object deta hai.
 *  - paid plan: asal image public, preview wahi
 *  - free plan: asal image private (authenticated), preview watermark wali public image
 */
const saveImageVersion = async ({ sessionId, buffer, watermark, source, instruction = null }) => {
  const folder = `${IMAGE.FOLDER}/${sessionId}`;

  if (!watermark) {
    const up = await uploadBuffer(buffer, { folder, type: "upload" });
    return {
      source,
      instruction,
      original: { url: up.url, publicId: up.publicId, deliveryType: "upload" },
      preview: { url: up.url, publicId: up.publicId },
      watermarked: false,
    };
  }

  // Watermark pehle bana lete hain; fail ho to kuch upload hi nahi hota
  const previewBuffer = await applyWatermark(buffer);

  const original = await uploadBuffer(buffer, { folder, type: "authenticated" });
  let preview;
  try {
    preview = await uploadBuffer(previewBuffer, { folder: `${folder}/preview`, type: "upload" });
  } catch (err) {
    await destroyAsset(original.publicId, "authenticated").catch(() => {});
    throw err;
  }

  return {
    source,
    instruction,
    original: { url: null, publicId: original.publicId, deliveryType: "authenticated" },
    preview: { url: preview.url, publicId: preview.publicId },
    watermarked: true,
  };
};

/** Session ki saari images (reference, asal, preview) Cloudinary se delete karta hai. */
const deleteSessionAssets = async (session) => {
  const s = typeof session?.toObject === "function" ? session.toObject() : session;
  const targets = [];

  if (s?.input?.image?.publicId) targets.push({ publicId: s.input.image.publicId, type: "upload" });

  for (const v of s?.versions || []) {
    if (v.original?.publicId) {
      targets.push({ publicId: v.original.publicId, type: v.original.deliveryType || "upload" });
    }
    if (v.preview?.publicId && v.preview.publicId !== v.original?.publicId) {
      targets.push({ publicId: v.preview.publicId, type: "upload" });
    }
  }

  const results = await Promise.allSettled(targets.map((t) => destroyAsset(t.publicId, t.type)));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    logger.warn(`Design assets: ${failed.length}/${targets.length} could not be deleted`);
  }
  return { total: targets.length, failed: failed.length };
};

/** Download ka URL (browser file save karega). User ko hamesha preview wali image milti hai. */
const buildDownloadUrl = (version, filename = "design") => {
  const publicId = version?.preview?.publicId;
  if (!publicId) return version?.preview?.url || null;
  return cloudinary.url(publicId, {
    secure: true,
    type: "upload",
    resource_type: "image",
    flags: `attachment:${filename}`,
  });
};

module.exports = {
  generateDesignImage,
  editDesignImage,
  saveImageVersion,
  deleteSessionAssets,
  buildDownloadUrl,
  _internal: { extractImage },
};