import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.FROM_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

transport.verify().catch((err) => {
  console.warn("Mail transport verify failed", err?.message || err);
});

export async function sendAdminNotification(payload: {
  subject: string;
  text?: string;
  html?: string;
  to: string; // default to admin panel
}) {
  const to = process.env.ADMIN_EMAIL;

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  };
  return transport.sendMail(mailOptions);
}
export function buildNewUserHtml(opts: {
  signUpMethod: string;
  socialType?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string | Date;
  extra?: Record<string, any>;
}) {
  const { signUpMethod, socialType, name, email, phone, createdAt, extra } =
    opts;
  let html = `<h3>New User Registered via (${signUpMethod})</h3><ul>`;
  if (socialType)
    html += `<li><strong>Social Type:</strong> ${socialType}</li>`;
  if (name) html += `<li><strong>Name:</strong> ${name}</li>`;
  if (email) html += `<li><strong>Email:</strong> ${email}</li>`;
  if (phone) html += `<li><strong>Phone:</strong> ${phone}</li>`;
  if (createdAt)
    html += `<li><strong>Created At:</strong> ${new Date(
      createdAt
    ).toISOString()}</li>`;

  if (extra && Object.keys(extra).length) {
    html += `<li><strong>Extra:</strong><pre>${JSON.stringify(
      extra,
      null,
      2
    )}</pre></li>`;
  }

  html += `</ul>`;
  return html;
}
