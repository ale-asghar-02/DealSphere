const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../configs/config');
const sessionModel = require('../models/sessionModel');

// ── Token Generators ─────────────────────────────────────────────
const generateAccessToken = (id, sessionId, role) => {
  return jwt.sign({ id, sessionId, role }, config.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

// ── Cookie Options ─────────────────────────────────────────────
// Only the refresh token is ever stored in a cookie. The access token is
// short-lived and returned in the JSON response body so the frontend can
// send it as `Authorization: Bearer <token>` — it should NEVER be set as a cookie.
const cookieOptions = (maxAge = 0) => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/', // explicit path so clearCookie always matches how it was set
  maxAge,
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ── Issue Auth Tokens ─────────────────────────────────────────────
// Creates a session, sets ONLY the refresh token as an httpOnly cookie,
// and returns the access token so the calling controller can put it in
// the JSON response body.
const issueAuthTokens = async (res, user, req) => {
  const refreshToken = generateRefreshToken(user._id);
  const refreshTokenHash = hashToken(refreshToken);

  const session = await sessionModel.create({
    user: user._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const accessToken = generateAccessToken(user._id, session._id, user.role);

  // Refresh token -> httpOnly cookie (not readable/stealable by JS)
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

  // Access token -> returned to caller, NOT set as a cookie.
  // Controller must include it in the JSON response, e.g. { accessToken, user }
  return { accessToken, refreshToken, session };
};

module.exports = { generateAccessToken, generateRefreshToken, cookieOptions, hashToken, issueAuthTokens };