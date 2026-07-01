import { randomBytes } from "node:crypto";
import { hashPassword } from "../../auth/hashPassword.js";

export async function adminsRoutes(app, { db }) {
  // список адмінів
  app.get("/admins", async () => {
    return db.getAdmins();
  });

  // відправити запрошення
  app.post("/admins/invite", async (req, reply) => {
    const { email } = req.body ?? {};
    if (!email || !email.includes("@")) {
      return reply.code(400).send({ message: "Некоректний email" });
    }

    const existing = await db.findAdminByEmail(email);
    if (existing) {
      return reply.code(409).send({ message: "Адмін з таким email вже існує" });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.createInvite({ token, email, invitedBy: req.userId, expiresAt });

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const link = `${frontendUrl}/invite/${token}`;

    return reply.code(201).send({ ok: true, link, email });
  });
}

// публічні роути (без auth)
export async function inviteRoutes(app, { db }) {
  // перевірити токен
  app.get("/invite/:token", async (req, reply) => {
    const invite = await db.findInvite(req.params.token);
    if (!invite) return reply.code(404).send({ message: "Посилання недійсне або вичерпане" });
    return { email: invite.email };
  });

  // прийняти запрошення
  app.post("/invite/:token", async (req, reply) => {
    const { password } = req.body ?? {};
    if (!password) return reply.code(400).send({ message: "Введіть пароль" });

    const invite = await db.findInvite(req.params.token);
    if (!invite) return reply.code(404).send({ message: "Посилання недійсне або вичерпане" });

    const hashed = await hashPassword(password);
    const admin = await db.createAdmin({ email: invite.email, password: hashed });
    await db.useInvite(req.params.token);

    return { ok: true, email: admin.email };
  });
}
