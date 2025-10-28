import nodemailer from "nodemailer";
import { formatDateTime } from "./formateDateAndTime";

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
  // subject: string;
  to: string; // default to admin panel
  text?: string;
  html: string;
}) {
  const to = process.env.ADMIN_EMAIL;

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    // subject: payload.subject,
    text: payload.text,
    html: payload.html,
  };
  return transport.sendMail(mailOptions);
}
export function buildNewUserHtml(opts: {
  name: string;
  email: string;
  phone: string; // if not found then  (---)
  // aiNumber: string; // -  +1-78945123
  // date: Date; // - 28 oct 2025
  createdAt: Date; // 05:30:00 UTC
  signUpMethod: string;
  socialType?: string; //Google / Apple
  status: string; // - Active
}) {
  const {
    name,
    email,
    phone,
    // aiNumber,
    createdAt,
    signUpMethod,
    socialType,
    status, // is_blocked
  } = opts;
  const { formattedDate, formattedTime } = formatDateTime(createdAt);

  let html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
    <h2 style="color: #2c3e50; margin-bottom: 10px;">
      Welcome to <strong>AI Secretary</strong> - New User Registered via (${signUpMethod.toUpperCase()})
    </h2>

    <ul style="list-style: none; padding: 0;">
      <li><strong>Name:</strong> ${(
        name.toUpperCase() || "---"
      ).toUpperCase()}</li>
      <li><strong>Email:</strong> ${email || "(---)"}</li>
      <li><strong>Phone No:</strong> ${phone ? phone : "(---)"}</li>
      <li><strong>AI Number:</strong> ${"(---)"}</li>
      <li><strong>Date:</strong> ${formattedDate}</li>
      <li><strong>Created At:</strong> ${formattedTime} UTC</li>
      <li><strong>Social Type:</strong> ${
        socialType?.toUpperCase() || "(---)"
      }</li>
      <li><strong>Status:</strong> ${status ? "Block" : "Active"}</li>
    </ul>
  </div>
`;
  return html;
}
