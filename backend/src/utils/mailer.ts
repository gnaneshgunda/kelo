import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: config.gmailUser,
    pass: config.gmailAppPassword,
  },
  family: 4, // force IPv4
});

export async function sendOrderStatusEmail(order: {
  id: number;
  customerName: string;
  email: string;
  status: string;
  totalAmount: number;
  items: Array<{ name?: string; quantity: number; price?: number }>;
  shippingAddress?: string;
}): Promise<void> {
  if (!order.email) return;
  if (!config.gmailUser || !config.gmailAppPassword) {
    console.warn('[Mailer] Gmail credentials not set, skipping email.');
    return;
  }

  const statusMessages: Record<string, { subject: string; heading: string; body: string; color: string }> = {
    CONFIRMED: {
      subject: `Order #${order.id} Confirmed — KELO Handcrafted Gifts`,
      heading: '🎉 Your Order is Confirmed!',
      body: `Great news! We've confirmed your order and our artisans are getting it ready for you.`,
      color: '#16a34a',
    },
    SHIPPED: {
      subject: `Order #${order.id} Shipped — KELO Handcrafted Gifts`,
      heading: '📦 Your Order is on the Way!',
      body: `Your handcrafted order has been shipped and is on its way to you.`,
      color: '#2563eb',
    },
    DELIVERED: {
      subject: `Order #${order.id} Delivered — KELO Handcrafted Gifts`,
      heading: '✅ Order Delivered!',
      body: `Your order has been delivered. We hope you love your handcrafted gift!`,
      color: '#C1440E',
    },
    CANCELLED: {
      subject: `Order #${order.id} Cancelled — KELO Handcrafted Gifts`,
      heading: '❌ Order Cancelled',
      body: `Your order has been cancelled. If you have any questions, please reach out to us.`,
      color: '#dc2626',
    },
  };

  const template = statusMessages[order.status];
  if (!template) return;

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ece6;">${item.name || 'Product'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ece6;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ece6;text-align:right;">₹${((item.price || 0) * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fffaf7;border:1px solid #edd9ce;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#3C2212,#2A170B);padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;font-size:2rem;letter-spacing:6px;margin:0;">KELO</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:0.75rem;letter-spacing:2px;margin:4px 0 0;">HANDCRAFTED GIFTS</p>
      </div>

      <div style="padding:32px;">
        <h2 style="color:${template.color};font-size:1.4rem;margin:0 0 8px;">${template.heading}</h2>
        <p style="color:#6b6560;margin:0 0 24px;">${template.body}</p>

        <div style="background:#fff;border:1px solid #edd9ce;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:0.8rem;color:#8c6a54;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
          <p style="margin:0 0 16px;font-size:1.1rem;font-weight:700;color:#2d1b0e;">Order #${order.id}</p>

          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead>
              <tr style="background:#fff3ec;">
                <th style="padding:8px 12px;text-align:left;color:#8c6a54;font-weight:600;">Item</th>
                <th style="padding:8px 12px;text-align:center;color:#8c6a54;font-weight:600;">Qty</th>
                <th style="padding:8px 12px;text-align:right;color:#8c6a54;font-weight:600;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="text-align:right;margin-top:12px;padding-top:12px;border-top:2px solid #edd9ce;">
            <span style="font-size:1.1rem;font-weight:800;color:#c1440e;">Total: ₹${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        ${order.shippingAddress ? `<p style="color:#6b6560;font-size:0.88rem;">📍 <strong>Delivery to:</strong> ${order.shippingAddress}</p>` : ''}

        <p style="color:#6b6560;font-size:0.85rem;margin-top:24px;">For any queries, reach us at <a href="mailto:kelo.keylove.admin@gmail.com" style="color:#c1440e;">kelo.keylove.admin@gmail.com</a></p>
      </div>

      <div style="background:#f5ede6;padding:16px 32px;text-align:center;">
        <p style="color:#8c6a54;font-size:0.78rem;margin:0;">© KELO Handcrafted Gifts • Made with ❤️</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"KELO Handcrafted Gifts" <${config.gmailUser}>`,
    to: order.email,
    subject: template.subject,
    html,
  });

  console.log(`[Mailer] Status email (${order.status}) sent to ${order.email}`);
}
