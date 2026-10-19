import { verifyPassword } from "../../auth/hashPassword.js";
import { createSession, deleteSession } from "../../auth/session.js";

export async function authRoutes(app, { db }) {
  // Брутфорс-захист: scrypt сам по собі сповільнює перебір, але без ліміту
  // запитів пароль все одно можна перебирати необмежено довго.
  app.post("/auth/login", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
    const { email, password } = req.body ?? {};
    const user = await db.findAdminByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return reply.code(401).send({ message: "Невірний email або пароль" });
    }
    const token = await createSession(user.id, db);
    reply
      .setCookie("session", token, { httpOnly: true, path: "/", sameSite: "none", secure: true })
      .send({ ok: true });
  });

  app.post("/auth/logout", async (req, reply) => {
    const token = req.cookies?.session;
    if (token) await deleteSession(token, db);
    reply
      .setCookie("session", "", { httpOnly: true, path: "/", sameSite: "none", secure: true, expires: new Date(0) })
      .send({ ok: true });
  });
}
