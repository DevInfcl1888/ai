import nodemailer from "nodemailer";
import { formatDateTime } from "./formateDateAndTime";

export const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.FROM_EMAIL!,
    pass: process.env.EMAIL_PASS!,
  },
});

transport.verify().catch((err) => {
  console.warn("Mail transport verify failed", err?.message || err);
});

export async function sendAdminNotification(payload: {
  subject: string;
  to: string; // default to admin panel
  text?: string;
  html: string;
}) {
  const to = process.env.ADMIN_EMAIL!;

  const mailOptions = {
    subject: payload.subject,
    to,
    from: process.env.FROM_EMAIL,
    text: payload.text,
    html: payload.html,
  };
  return transport.sendMail(mailOptions);
}
export function buildNewUserHtml(opts: {
  name: string;
  email: string;
  phone: string; // if not found then  " "
  // aiNumber: string; // -  +1-78945123
  // date: Date; // - 28 oct 2025
  createdAt: Date; // 05:30:00 UTC
  signUpMethod: string;
  socialType?: string; // Google / Apple
  status: string; // - Active
}) {
  const {
    name,
    email,
    phone,
    createdAt,
    signUpMethod,
    socialType,
    status, // is_blocked
  } = opts;
  const { formattedDate, formattedTime } = formatDateTime(createdAt);

  const displayName =
    name?.trim() ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : " ";
  const displayStatus = status === "Block" ? "Blocked" : "Active";
  const statusBg = status === "Block" ? "#FDE8E8" : "#E6F4EA";
  const statusColor = status === "Block" ? "#C81E1E" : "#1E7A3B";
  const signUpDisplay = signUpMethod
    ? signUpMethod.charAt(0).toUpperCase() + signUpMethod.slice(1).toLowerCase()
    : "";
  const socialDisplay = socialType
    ? socialType.charAt(0).toUpperCase() + socialType.slice(1).toLowerCase()
    : "N/A";
  const appName = process.env.APP_NAME || " AI Platform";
  const appLogoUrl = `https://res.cloudinary.com/dywddezye/image/upload/v1761801445/logo_bfiwjj.png`;
  const adminDashboardUrl = process.env.ADMIN_DASHBOARD_URL || "";

  let html = `
  <div style="background:#f6f8fb; padding:24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Helvetica Neue', Helvetica, sans-serif; color:#1f2937;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; box-shadow:0 8px 30px rgba(17,24,39,0.08); overflow:hidden;">

      <div style="background: linear-gradient(135deg, #2E7DFF 0%, #6C47FF 100%); padding:20px 24px; color:#ffffff;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="left" style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  ${appLogoUrl ? `<td style="padding:0 10px 0 0; vertical-align:middle;"><img src="${appLogoUrl}" alt="${appName} Logo" width="36" height="36" style="display:block; border-radius:8px; background:#ffffff; padding:4px;" /></td>` : ""}
                  <td style="padding:0; vertical-align:middle;">
                    <div style="font-size:12px; opacity:0.9; letter-spacing:0.3px;"> &nbsp; ${appName}</div>
                    <div style="margin-top:2px; font-size:20px; font-weight:700;"> &nbsp; New User Signup</div>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" valign="top" style="padding:0;">
              <span style="display:inline-block; background: rgba(255,255,255,0.15); padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; line-height:1.2;">
                ${formattedDate} • ${formattedTime} UTC
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:24px;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px;">
          
          <div>
            <div style="font-size:18px; font-weight:700;">${displayName}</div>
            <div style="font-size:13px; color:#6b7280;">${email || " "}</div>
          </div>
          <div style="margin-left:auto; background:${statusBg}; color:${statusColor}; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px;">
            ${displayStatus}
          </div>
        </div>

        <div style="border:1px solid #eef2f7; border-radius:12px; overflow:hidden;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tbody>
              <tr>
                <td style="background:#fafbff; width:38%; padding:12px 16px; font-size:13px; color:#6b7280;">Phone</td>
                <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#111827;">${phone ? phone : " "}</td>
              </tr>
              <tr>
                <td style="background:#fafbff; width:38%; padding:12px 16px; font-size:13px; color:#6b7280;">Signup Method</td>
                <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#111827;">
                  <span style="background:#EFF6FF; color:#1D4ED8; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px;">${signUpDisplay || "Unknown"}</span>
                </td>
              </tr>
              <tr>
                <td style="background:#fafbff; width:38%; padding:12px 16px; font-size:13px; color:#6b7280;">Social Type</td>
                <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#111827;">${socialDisplay}</td>
              </tr>
              <tr>
                <td style="background:#fafbff; width:38%; padding:12px 16px; font-size:13px; color:#6b7280;">Date</td>
                <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#111827;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="background:#fafbff; width:38%; padding:12px 16px; font-size:13px; color:#6b7280;">Created At</td>
                <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#111827;">${formattedTime} UTC</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${adminDashboardUrl
      ? `<div style="margin-top:20px;">
              <a href="${adminDashboardUrl}"
                 style="display:inline-block; background:#2E7DFF; color:#ffffff; text-decoration:none; padding:10px 16px; border-radius:10px; font-size:14px; font-weight:700;">
                Open Admin Dashboard
              </a>
            </div>`
      : ""}

        <div style="margin-top:18px; font-size:12px; color:#6b7280; line-height:1.6;">
          You are receiving this notification because admin alerts are enabled.
        </div>
      </div>

      <div style="padding:14px 24px; border-top:1px solid #eef2f7; background:#fcfcfd; color:#6b7280; font-size:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span>${appName} • Admin Notification</span>
        </div>
      </div>
    </div>
  </div>
`;
  return html;
}
