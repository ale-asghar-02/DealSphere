const fs = require("fs/promises");
const sharp = require("sharp");
const config = require("../../configs/config");
const logger = require("../../utils/logger");
const { WATERMARK } = require("../../configs/designConfig");

/**
 * Free plan ki images par watermark lagata hai:
 * image ke beech mein tirchi line mein 3 bare, semi-transparent logos.
 * Logo load na ho sake to website ke naam ka text watermark lagta hai (image kabhi bina watermark nahi jati).
 */

let logoSvgCache = null;

const loadLogoSvg = async () => {
  if (logoSvgCache) return logoSvgCache;
  logoSvgCache = await fs.readFile(WATERMARK.LOGO_PATH);
  return logoSvgCache;
};

// Logo ko exact pixel width par rasterize karta hai (taake dhundla na ho)
const renderLogoPng = async (logoWidth) => {
  const svg = await loadLogoSvg();
  const meta = await sharp(svg).metadata();
  const density = Math.min(1200, Math.max(72, Math.ceil((72 * logoWidth) / (meta.width || logoWidth))));

  const { data, info } = await sharp(svg, { density })
    .resize({ width: logoWidth })
    .png()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
};

const xmlEscape = (s) =>
  String(s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));

const wrapLayer = (width, height, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
  `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${inner}</svg>`;

const buildLogoLayer = async (width, height) => {
  // Chhoti side ke hisab se size, taake wide banner mein bhi logos kate nahi
  const base = Math.min(width, height * 1.25);
  const logoWidth = Math.max(60, Math.round(base * WATERMARK.LOGO_WIDTH_RATIO));
  const logo = await renderLogoPng(logoWidth);

  const gap = Math.round(logo.width * WATERMARK.GAP_RATIO);
  const step = logo.width + gap;
  const cx = width / 2;
  const cy = height / 2;
  const href = `data:image/png;base64,${logo.data.toString("base64")}`;

  const images = [-step, 0, step]
    .map(
      (dx) =>
        `<image x="${(cx + dx - logo.width / 2).toFixed(1)}" y="${(cy - logo.height / 2).toFixed(1)}" ` +
        `width="${logo.width}" height="${logo.height}" xlink:href="${href}"/>`
    )
    .join("");

  return wrapLayer(
    width,
    height,
    `<g transform="rotate(${WATERMARK.ROTATION_DEG} ${cx} ${cy})" opacity="${WATERMARK.OPACITY}">${images}</g>`
  );
};

const buildTextLayer = (width, height) => {
  const name = xmlEscape((config.COMPANY_NAME || "PREVIEW").toUpperCase());
  const base = Math.min(width, height * 1.25);
  const fontSize = Math.round(base * 0.055);
  const step = Math.round(name.length * fontSize * 0.8);
  const cx = width / 2;
  const cy = height / 2;

  // Safed text + kala kinara, taake har background par nazar aaye
  const texts = [-step, 0, step]
    .map(
      (dx) =>
        `<text x="${cx + dx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" ` +
        `font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}" ` +
        `fill="#ffffff" stroke="#000000" stroke-width="${Math.max(1, fontSize * 0.04).toFixed(1)}">${name}</text>`
    )
    .join("");

  return wrapLayer(
    width,
    height,
    `<g transform="rotate(${WATERMARK.ROTATION_DEG} ${cx} ${cy})" opacity="${Math.min(1, WATERMARK.OPACITY + 0.2)}">${texts}</g>`
  );
};

/**
 * @param {Buffer} inputBuffer  asal (bina watermark) image
 * @returns {Promise<Buffer>}   watermark wali JPEG image
 */
const applyWatermark = async (inputBuffer) => {
  const meta = await sharp(inputBuffer).metadata();
  const { width, height } = meta;
  if (!width || !height) throw new Error("Watermark: could not read image size");

  let layerSvg;
  try {
    layerSvg = await buildLogoLayer(width, height);
  } catch (err) {
    logger.error(`Watermark logo failed (${WATERMARK.LOGO_PATH}): ${err.message} - using text watermark`);
    layerSvg = buildTextLayer(width, height);
  }

  return sharp(inputBuffer)
    .flatten({ background: "#ffffff" })
    .composite([{ input: Buffer.from(layerSvg), top: 0, left: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
};

module.exports = { applyWatermark };