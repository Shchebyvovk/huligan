import { verifyPassword } from "../../auth/hashPassword.js";
import { createSession } from "../../auth/session.js";

export async function authRoutes(app, { db }) {
  app.post("/auth/login", async (req, reply) => {
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
    if (token) await db.deleteSession(token);
    reply
      .setCookie("session", "", { httpOnly: true, path: "/", sameSite: "none", secure: true, expires: new Date(0) })
      .send({ ok: true });
  });
}
