const crypto = require('crypto');
const transporter = require('../utils/nodemailor'); // adjust path to your nodemailer file
const config = require('../configs/config');

// ── OTP Generator ─────────────────────────────────────────────
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ── Email Templates ─────────────────────────────────────────────
const baseWrapper = (bodyContent) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">
            <tr>
              <td style="background-color:#111827; padding: 24px 32px;">
                <span style="color:#ffffff; font-size:20px; font-weight:600; letter-spacing:0.3px;">${config.COMPANY_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                ${bodyContent}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color:#f9fafb; border-top:1px solid #eef0f2;">
                <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
                  If you didn't request this, you can safely ignore this email.
                </p>
                <p style="margin:6px 0 0; font-size:12px; color:#9ca3af; text-align:center;">
                  &copy; ${new Date().getFullYear()} ${config.COMPANY_NAME}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const welcomeTemplate = (username) => ({
  subject: `Welcome to ${config.COMPANY_NAME}, ${username}!`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Welcome aboard, ${username} 🎉</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Your ${config.COMPANY_NAME} account has been created successfully. We're excited to have you here.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Don't forget to verify your email so you can get the most out of your account.
    </p>
  `),
});

const otpBlock = (otp) => `
  <div style="text-align:center; margin: 24px 0;">
    <span style="display:inline-block; font-size:32px; font-weight:700; letter-spacing:8px; color:#111827; background-color:#f3f4f6; padding: 14px 24px; border-radius:8px;">
      ${otp}
    </span>
  </div>
`;

const verifyAccountTemplate = (username, otp) => ({
  subject: `Verify your ${config.COMPANY_NAME} account`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Verify your email</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, use the code below to verify your account. This code expires in 10 minutes.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.6;">
      Enter this code in the app to complete your verification.
    </p>
  `),
});

const resetPasswordTemplate = (username, otp) => ({
  subject: `Reset your ${config.COMPANY_NAME} password`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Reset your password</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, use the code below to reset your password. This code expires in 10 minutes.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.6;">
      If you didn't request a password reset, please secure your account immediately.
    </p>
  `),
});

const passwordChangedTemplate = (username) => ({
  subject: `Your ${config.COMPANY_NAME} password was changed`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Password changed</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, this is a confirmation that your password was just changed successfully.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      If you didn't make this change, please contact support immediately and secure your account.
    </p>
  `),
});

const deleteAccountOtpTemplate = (username, otp) => ({
  subject: `Confirm account deletion - ${config.COMPANY_NAME}`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Confirm account deletion</h2>
    <p style="margin:0 0 16px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, use the code below to confirm deleting your ${config.COMPANY_NAME} account.
      This code expires in 10 minutes.
    </p>
    <div style="font-size:28px; font-weight:700; letter-spacing:6px; color:#111827; margin:0 0 16px;">${otp}</div>
    <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.6;">
      If you didn't request this, ignore this email and change your password.
    </p>
  `),
});

const accountDeletedTemplate = (username) => ({
  subject: `Your ${config.COMPANY_NAME} account has been deleted`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Account deleted</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, your ${config.COMPANY_NAME} account has been deleted and your personal information has been removed.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Order records involving other users may be retained for legal and accounting purposes.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      If you didn't request this, please contact support immediately.
    </p>
  `),
});

const banTemplate = (username, reason) => ({
  subject: `Your ${config.COMPANY_NAME} account has been banned`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Account banned</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, your ${config.COMPANY_NAME} account has been permanently banned.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Reason: ${reason}
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      All your active listings have been removed from public view. If you believe this is a mistake, please contact support.
    </p>
  `),
});

const suspendTemplate = (username, reason, until) => ({
  subject: `Your ${config.COMPANY_NAME} account has been suspended`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Account suspended</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, your ${config.COMPANY_NAME} account has been temporarily suspended until <strong>${new Date(until).toDateString()}</strong>.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Reason: ${reason}
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Your listings will not be visible until the suspension is lifted. Your account will be automatically restored on the date above.
    </p>
  `),
});

const restoreTemplate = (username) => ({
  subject: `Your ${config.COMPANY_NAME} account has been restored`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">Account restored</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${username}, your ${config.COMPANY_NAME} account is now active again, and your listings are visible to everyone.
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Thanks for your patience — let us know if you have any questions.
    </p>
  `),
});

const contactReplyTemplate = (name, subject, originalMessage, reply) => ({
  subject: `Re: ${subject}`,
  html: baseWrapper(`
    <h2 style="margin:0 0 12px; font-size:20px; color:#111827;">We've replied to your message</h2>
    <p style="margin:0 0 4px; font-size:14px; color:#4b5563; line-height:1.6;">
      Hi ${name}, thanks for reaching out to ${config.COMPANY_NAME}. Here's our response:
    </p>
    <p style="margin:16px 0; padding:12px 16px; background:#f9fafb; border-left:3px solid #111827; font-size:14px; color:#111827; line-height:1.6;">
      ${reply}
    </p>
    <p style="margin:16px 0 4px; font-size:13px; color:#6b7280; line-height:1.6;">
      <b>Your original message:</b><br/>${originalMessage}
    </p>
    <p style="margin:16px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
      Let us know if you need anything else.
    </p>
  `),
});

// ── Send Email ─────────────────────────────────────────────
const sendEmail = async (to, template) => {
  await transporter.sendMail({
    from: `"${config.COMPANY_NAME}" <${config.SENDER_EMAIL}>`,
    to,
    subject: template.subject,
    html: template.html,
  });
};

module.exports = {
  welcomeTemplate,
  generateOtp,
  verifyAccountTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  deleteAccountOtpTemplate,
  accountDeletedTemplate,
  banTemplate, suspendTemplate, restoreTemplate,
  contactReplyTemplate,
  sendEmail,
};