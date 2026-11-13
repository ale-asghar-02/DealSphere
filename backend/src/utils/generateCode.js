const crypto = require("crypto");

// prefix ke baad wale random hissay ke liye characters
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// crypto se random alphanumeric string banata ha (uppercase)
function randomCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

// Generic function: prefix + model ke against unique check kare
async function generateUniqueCode({ prefix, model, field = "code", length = 8, maxTries = 10 }) {
  for (let i = 0; i < maxTries; i++) {
    const code = `${prefix}${randomCode(length)}`;
    const exists = await model.exists({ [field]: code });
    if (!exists) return code;
  }
  throw new Error(`Unique code generate nahi ho saka (${prefix}) — max tries khatam`);
}

module.exports = { generateUniqueCode };