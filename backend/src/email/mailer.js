import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendInviteEmail({ to, token, frontendUrl }) {
  const link = `${frontendUrl}/invite/${token}`;
  const transport = getTransport();

  if (!transport) {
    console.log(`[invite] SMTP не налаштовано. Посилання для ${to}:\n${link}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "Huligan <noreply@huligan.dev>",
    to,
    subject: "Запрошення в Huligan Admin",
    text: `Вас запрошено як адміністратора Huligan.\n\nПерейдіть за посиланням, щоб встановити пароль:\n${link}\n\nПосилання діє 24 години.`,
    html: `<p>Вас запрошено як адміністратора <strong>Huligan</strong>.</p>
<p><a href="${link}">Встановити пароль</a></p>
<p style="color:#999;font-size:12px">Посилання діє 24 години.</p>`,
  });
}
