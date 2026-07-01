import { Resend } from "resend";

export async function sendInviteEmail({ to, token, frontendUrl }) {
  const link = `${frontendUrl}/invite/${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[invite] RESEND_API_KEY не задано. Посилання для ${to}:\n${link}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Huligan <onboarding@resend.dev>",
    to,
    subject: "Запрошення в Huligan Admin",
    html: `<p>Вас запрошено як адміністратора <strong>Huligan</strong>.</p>
<p><a href="${link}">Встановити пароль →</a></p>
<p style="color:#999;font-size:12px">Посилання діє 24 години.</p>`,
  });
}
