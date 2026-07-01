import nodemailer from "nodemailer";

export async function sendInviteEmail({ to, token, frontendUrl }) {
  const link = `${frontendUrl}/invite/${token}`;

  if (!process.env.SMTP_USER) {
    console.log(`[invite] SMTP не налаштовано. Посилання для ${to}:\n${link}`);
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: "Запрошення в Huligan Admin",
    html: `<p>Вас запрошено як адміністратора <strong>Huligan</strong>.</p>
<p><a href="${link}">Встановити пароль →</a></p>
<p style="color:#999;font-size:12px">Посилання діє 24 години.</p>`,
  });

  console.log("[mailer] sent to", to, "id:", info.messageId);
}
