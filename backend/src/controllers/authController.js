const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../configs/config");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");
const { issueAuthTokens, cookieOptions, hashToken } = require("../utils/generateToken");

const { generateOtp, sendEmail, verifyAccountTemplate, resetPasswordTemplate, welcomeTemplate, passwordChangedTemplate } = require("../utils/mailor");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const sendEmailSafely = (label, to, template) => {
  sendEmail(to, template).catch((err) => {
    logger.error(`[email:${label}] FAILED to send to ${to}: ${err.message}`);
  });
};

// ── Register ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password, accountType } = req.body;

    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser?.deletion?.isDeleted) {
      return next(
        new AppError(
          "This account has been deleted and cannot be used again",
          403,
        ),
      );
    }

    if (existingUser) {
      return next(
        new AppError("An account with this email already exists", 409),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      accountType,
    });

    const otp = generateOtp();
    user.verifyOtp = hashToken(otp);
    user.verifyOtpExpireAt = Date.now() + OTP_EXPIRY_MS;
    await user.save();

    sendEmailSafely(
      "verify-otp:register",
      user.email,
      verifyAccountTemplate(user.username, otp),
    );

    return res.status(201).json({
      success: true,
      message:
        "Account created. Please verify the OTP sent to your email to complete registration.",
    });
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Pehle password ke sath fetch karo — verify karne ke liye chahiye
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return next(new AppError("Invalid email or password", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Password sahi hone ke baad check, taake bina password ke koi status na jaan sake
    if (user.deletion?.isDeleted) {
      return next(new AppError("This account has been deleted", 403));
    }

    if (!user.isAccountVerified) {
      return next(
        new AppError(
          "Please verify your account first. Check your email for the OTP.",
          403,
          { email: user.email, isAccountVerified: false },
        ),
      );
    }

    if (user.moderation.isBanned) {
      return next(new AppError(`Your account has been banned.`, 403));
    }

    if (
      user.moderation.suspendedUntil &&
      user.moderation.suspendedUntil > new Date()
    ) {
      return next(
        new AppError(
          `Your account is suspended until ${user.moderation.suspendedUntil.toDateString()}.`,
          403,
        ),
      );
    }

    const { accessToken } = await issueAuthTokens(res, user, req);

    // Ab response bhejte waqt password exclude karo
    const userSafe = await userModel.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      accessToken,
      user: userSafe,
    });
  } catch (error) {
    next(error);
  }
};

// ── Logout (current device) ─────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);
      await sessionModel.findOneAndDelete({ refreshTokenHash });
    }

    res.clearCookie("refreshToken", cookieOptions());

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ── Logout from all devices ─────────────────────────────────────────────
const logoutAllDevices = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return next(new AppError("Not authenticated", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    } catch {
      res.clearCookie("refreshToken", cookieOptions());
      return next(new AppError("Session expired, please login again", 401));
    }

    await sessionModel.deleteMany({ user: decoded.id });
    res.clearCookie("refreshToken", cookieOptions());

    return res
      .status(200)
      .json({ success: true, message: "Logged out from all devices" });
  } catch (error) {
    next(error);
  }
};

// ── Refresh Token ─────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return next(new AppError("Not authenticated", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
    } catch {
      res.clearCookie("refreshToken", cookieOptions());
      return next(new AppError("Session expired, please login again", 401));
    }

    const tokenHash = hashToken(token);
    const session = await sessionModel.findOne({
      user: decoded.id,
      refreshTokenHash: tokenHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.clearCookie("refreshToken", cookieOptions());
      return next(new AppError("Invalid session, please login again", 401));
    }

    const user = await userModel.findById(decoded.id);
    if (!user || user.deletion?.isDeleted) {
      return next(new AppError("User no longer exist", 401));
    }

    session.revoked = true;
    await session.save();

    const { accessToken } = await issueAuthTokens(res, user, req);

    return res
      .status(200)
      .json({ success: true, message: "Token refreshed", accessToken });
  } catch (error) {
    next(error);
  }
};

// ── Send Verify OTP ─────────────────────────────────────────────
const sendVerifyOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user || user.deletion?.isDeleted) {
      return next(new AppError("No account found with this email", 404));
    }
    if (user.isAccountVerified) {
      return next(new AppError("Account is already verified", 400));
    }

    if (user.verifyOtpExpireAt) {
      const otpCreatedAt = user.verifyOtpExpireAt - OTP_EXPIRY_MS;
      const elapsed = Date.now() - otpCreatedAt;
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil(
          (OTP_RESEND_COOLDOWN_MS - elapsed) / 1000,
        );
        return next(
          new AppError(
            `Please wait ${waitSeconds}s before requesting another OTP`,
            429,
          ),
        );
      }
    }

    const otp = generateOtp();
    user.verifyOtp = hashToken(otp);
    user.verifyOtpExpireAt = Date.now() + OTP_EXPIRY_MS;
    await user.save();

    const template = verifyAccountTemplate(user.username, otp);
    await sendEmail(user.email, template);

    return res
      .status(200)
      .json({ success: true, message: "Verification OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

// ── Verify Account ─────────────────────────────────────────────
const verifyAccount = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user || user.deletion?.isDeleted) {
      return next(new AppError("User not found", 404));
    }
    if (user.isAccountVerified) {
      return next(new AppError("Account is already verified", 400));
    }
    if (!user.verifyOtp || user.verifyOtpExpireAt < Date.now()) {
      return next(
        new AppError("OTP has expired, please request a new one", 400),
      );
    }
    if (user.verifyOtp !== hashToken(otp)) {
      return next(new AppError("Invalid OTP", 400));
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();

    const { accessToken } = await issueAuthTokens(res, user, req);

    sendEmailSafely("welcome", user.email, welcomeTemplate(user.username));

    return res.status(200).json({
      success: true,
      message: "Account verified successfully",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Send Reset OTP ─────────────────────────────────────────────
const sendResetOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user || user.deletion?.isDeleted) {
      return next(
        new AppError(
          "This email address are invalid. Please enter the correct email address",
        ),
      );
    }

    if (user.resetOtpExpireAt) {
      const otpCreatedAt = user.resetOtpExpireAt - OTP_EXPIRY_MS;
      const elapsed = Date.now() - otpCreatedAt;
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        return res.status(200).json({
          success: true,
          message:
            "If an account exists with this email, a reset code has been sent",
        });
      }
    }

    const otp = generateOtp();
    user.resetOtp = hashToken(otp);
    user.resetOtpExpireAt = Date.now() + OTP_EXPIRY_MS;
    await user.save();

    const template = resetPasswordTemplate(user.username, otp);
    await sendEmail(user.email, template);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a reset code has been sent",
    });
  } catch (error) {
    next(error);
  }
};

// ── Verify Reset OTP ───────────────────────────────────────────
const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user || user.deletion?.isDeleted) {
      return next(new AppError("Invalid request", 400));
    }
    if (!user.resetOtp || user.resetOtpExpireAt < Date.now()) {
      return next(
        new AppError("OTP has expired, please request a new one", 400),
      );
    }
    if (user.resetOtp !== hashToken(otp)) {
      return next(new AppError("Invalid OTP", 400));
    }

    // OTP verified — issue a short-lived reset token so the next step
    // doesn't need email/otp again.
    const resetToken = jwt.sign(
      { id: user._id },
      config.RESET_PASSWORD_SECRET,
      { expiresIn: "10m" },
    );

    res.cookie("resetToken", resetToken, {
      ...cookieOptions(),
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    return res.status(200).json({ success: true, message: "OTP verified" });
  } catch (error) {
    next(error);
  }
};

// ── Reset Password ─────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const resetToken = req.cookies?.resetToken;

    if (!resetToken) {
      return next(
        new AppError("Reset session expired, please verify OTP again", 400),
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, config.RESET_PASSWORD_SECRET);
    } catch {
      return next(
        new AppError("Reset session expired, please verify OTP again", 400),
      );
    }

    const user = await userModel.findById(decoded.id);
    if (!user || user.deletion?.isDeleted) {
      return next(new AppError("Invalid request", 400));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();

    sendEmailSafely("passwordChanged", user.email, passwordChangedTemplate(user.username));

    await sessionModel.deleteMany({ user: user._id });
    res.clearCookie("refreshToken", cookieOptions());
    res.clearCookie("resetToken", cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Password reset successfully, please login again",
    });
  } catch (error) {
    next(error);
  }
};

// ── Google Login / Register (Passport callback) ─────────────────────────
// Backend sirf error code bhejta hai, message frontend (useAuth) define karta hai
const buildGoogleUsername = (name, email) => {
  let base = (name || "").trim().slice(0, 30);
  if (base.length < 3) base = email.split("@")[0].slice(0, 30);
  if (base.length < 3) base = base.padEnd(3, "0");
  return base;
};

const googleCallback = async (req, res) => {
  const fail = (code) =>
    res.redirect(`${config.CLIENT_URL}/login?error=${code}`);

  try {
    const { googleId, email, name, emailVerified } = req.user || {};

    if (!googleId || !email) return fail("google_failed");
    if (!emailVerified) return fail("email_not_verified");

    const normalizedEmail = email.toLowerCase();

    let user =
      (await userModel.findOne({ googleId })) ||
      (await userModel.findOne({ email: normalizedEmail }));

    // Deleted / banned / suspended check, OTP ya login se pehle
    if (user) {
      if (user.deletion?.isDeleted) return fail("account_deleted");

      // email kisi aur Google account se linked hai
      if (user.googleId && user.googleId !== googleId) {
        return fail("google_failed");
      }

      if (user.moderation?.isBanned) return fail("account_banned");

      if (
        user.moderation?.suspendedUntil &&
        user.moderation.suspendedUntil > new Date()
      ) {
        return fail("account_suspended");
      }
    }

    const sendOtpAndRedirect = async (u) => {
      // email query param mein, taake OTP page ki email field bhar jaye
      const redirectUrl = `${config.CLIENT_URL}/verify-otp?email=${encodeURIComponent(u.email)}`;

      // OTP spam rokne ke liye: 60s ke andar dobara OTP na bhejo
      if (u.verifyOtpExpireAt) {
        const elapsed = Date.now() - (u.verifyOtpExpireAt - OTP_EXPIRY_MS);
        if (elapsed < OTP_RESEND_COOLDOWN_MS) return res.redirect(redirectUrl);
      }

      const otp = generateOtp();
      u.verifyOtp = hashToken(otp);
      u.verifyOtpExpireAt = Date.now() + OTP_EXPIRY_MS;
      await u.save();

      sendEmailSafely(
        "verify-otp:google",
        u.email,
        verifyAccountTemplate(u.username, otp),
      );

      return res.redirect(redirectUrl);
    };

    // Naya account: create + OTP + verify-otp page
    if (!user) {
      user = await userModel.create({
        username: buildGoogleUsername(name, normalizedEmail),
        email: normalizedEmail,
        googleId,
        isAccountVerified: false,
      });
      return sendOtpAndRedirect(user);
    }

    // Purana account ko Google se link karna
    if (!user.googleId) {
      user.googleId = googleId;

      // pre-hijacking se bachao: unverified account ka purana password hata do
      if (!user.isAccountVerified) {
        user.password = undefined;
        await sessionModel.deleteMany({ user: user._id });
      }
      await user.save();
    }

    // Verified nahi hai to OTP
    if (!user.isAccountVerified) return sendOtpAndRedirect(user);

    // Already verified: seedha login
    await issueAuthTokens(res, user, req);
    return res.redirect(`${config.CLIENT_URL}/`);
  } catch (error) {
    console.error("Google callback error:", error);
    // do requests ek saath aayen to duplicate key aa sakti hai
    if (error?.code === 11000) return fail("google_failed");
    return fail("server_error");
  }
};

module.exports = {
  register,
  login,
  logout,
  logoutAllDevices,
  refreshToken,
  sendVerifyOtp,
  verifyAccount,
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
  googleCallback,
};