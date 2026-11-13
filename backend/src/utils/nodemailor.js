const config = require('../configs/config');

const transporter = {
  async sendMail({ to, subject, html, text }) {
    const recipients = (Array.isArray(to) ? to : String(to).split(','))
      .map((email) => ({ email: email.trim() }));

    const body = {
      sender: { email: config.SENDER_EMAIL },
      to: recipients,
      subject,
    };
    if (html) body.htmlContent = html;
    if (text) body.textContent = text;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Brevo API error ${res.status}: ${data.message || JSON.stringify(data)}`);
    }
    return data;
  },
};

module.exports = transporter;