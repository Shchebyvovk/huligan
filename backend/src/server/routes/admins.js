import { randomBytes } from "node:crypto";
import { hashPassword } from "../../auth/hashPassword.js";
import { hashToken } from "../../auth/tokenHash.js";
import { requireRole } from "../../permissions/requireRole.js";
import { isValidRole } from "../../permissions/roles.js";

export async function adminsRoutes(app, { db }) {
  // список адмінів — не для viewer: сам ростер (хто саме має доступ) не
  // потрібен тому, хто лише дивиться результати.
  app.get("/admins", { preHandler: requireRole("admin") }, async () => {
    return db.getAdmins();
  });

  // відправити запрошення — superadmin-only: це сама по собі ескалація
  // привілеїв (новий обліковий запис з довірою цієї системи), окрема
  // чутливість від "керувати тестами" (separation of duties).
  app.post("/admins/invite", { preHandler: requireRole("superadmin"), config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } }, async (req, reply) => {
    const { email, role = "admin" } = req.body ?? {};
    if (!email || !email.includes("@")) {
      return reply.code(400).send({ message: "Некоректний email" });
    }
    if (!isValidRole(role)) {
      return reply.code(400).send({ message: "Некоректна роль" });
    }

    const existing = await db.findAdminByEmail(email);
    if (existing) {
      return reply.code(409).send({ message: "Адмін з таким email вже існує" });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.createInvite({ token: hashToken(token), email, invitedBy: req.userId, expiresAt, role });

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const link = `${frontendUrl}/invite/${token}`;

    return reply.code(201).send({ ok: true, link, email, role });
  });

  // зміна ролі існуючого адміна — superadmin-only. Захист від self-lockout:
  // якщо ціль — ОСТАННІЙ superadmin і нова роль нижча, відмовляємо (інакше
  // рольовою системою стає нікому керувати).
  app.patch("/admins/:id/role", { preHandler: requireRole("superadmin") }, async (req, reply) => {
    const { role } = req.body ?? {};
    if (!isValidRole(role)) {
      return reply.code(400).send({ message: "Некоректна роль" });
    }

    const id = Number(req.params.id);
    const target = (await db.getAdmins()).find((a) => a.id === id);
    if (!target) return reply.code(404).send({ message: "Адміна не знайдено" });

    if (target.role === "superadmin" && role !== "superadmin") {
      const superadmins = await db.countSuperadmins();
      if (superadmins <= 1) {
        return reply.code(409).send({ message: "Не можна понизити останнього superadmin" });
      }
    }

    const updated = await db.updateAdminRole(id, role);
    return { ok: true, admin: updated };
  });
}

// публічні роути (без auth)
export async function inviteRoutes(app, { db }) {
  // перевірити токен
  app.get("/invite/:token", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const invite = await db.findInvite(hashToken(req.params.token));
    if (!invite) return reply.code(404).send({ message: "Посилання недійсне або вичерпане" });
    return { email: invite.email };
  });

  // прийняти запрошення
  app.post("/invite/:token", { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } }, async (req, reply) => {
    const { password } = req.body ?? {};
    if (!password) return reply.code(400).send({ message: "Введіть пароль" });

    const invite = await db.findInvite(hashToken(req.params.token));
    if (!invite) return reply.code(404).send({ message: "Посилання недійсне або вичерпане" });

    const hashed = await hashPassword(password);
    const admin = await db.createAdmin({ email: invite.email, password: hashed, role: invite.role });
    await db.useInvite(hashToken(req.params.token));

    return { ok: true, email: admin.email };
  });
}
