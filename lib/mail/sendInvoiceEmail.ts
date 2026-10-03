
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

function getTransporter() {
  if (!smtpUser || !smtpPassword) {
    throw new Error(
      "SMTP_USER and SMTP_PASSWORD must be configured in .env.local."
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

export async function sendInvoiceEmail({
  to,
  customerName,
  orderNumber,
  pdf,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  pdf: Buffer;
}) {
  if (!to) {
    throw new Error("Customer email address is missing.");
  }

  const transporter = getTransporter();

  return transporter.sendMail({
    from: `"Aurora Commerce" <${smtpUser}>`,
    to,
    subject: `Your Aurora Order Invoice - ${orderNumber}`,
    text: [
      `Hello ${customerName},`,
      "",
      `Thank you for shopping with Aurora Commerce.`,
      `Your order number is ${orderNumber}.`,
      "Your invoice is attached to this email as a PDF.",
      "",
      "Thank you,",
      "Aurora Commerce Team",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#203044;max-width:600px;margin:auto;padding:24px">
        <div style="background:#23668d;color:white;padding:24px;border-radius:12px">
          <h1 style="margin:0">AURORA</h1>
          <p style="margin:8px 0 0">Your order invoice</p>
        </div>
        <h2>Hello ${escapeHtml(customerName)},</h2>
        <p>Thank you for shopping with Aurora Commerce.</p>
        <p>Your order <strong>${escapeHtml(orderNumber)}</strong>
        has been placed successfully.</p>
        <p>We've attached your invoice as a PDF for your records.</p>
        <p style="margin-top:28px">Thank you,<br/><strong>Aurora Commerce Team</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `Aurora-Invoice-${orderNumber}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}