const nodemailer = require('nodemailer');

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendInviteEmail({ to, workspaceName, inviterName, token }) {
  const transport = buildTransport();
  const link = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${inviterName} invited you to join ${workspaceName} on ProjectFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>You've been invited to ${workspaceName}</h2>
        <p>${inviterName} invited you to collaborate on ProjectFlow.</p>
        <a href="${link}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">Accept Invite</a>
        <p style="color:#888;font-size:12px;margin-top:20px;">This link expires in 7 days.</p>
      </div>
    `,
  });
}

async function sendTaskNotificationEmail({ to, subject, message, link }) {
  const transport = buildTransport();
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: `<p>${message}</p><a href="${link}">View task</a>`,
  });
}

module.exports = { sendInviteEmail, sendTaskNotificationEmail };
