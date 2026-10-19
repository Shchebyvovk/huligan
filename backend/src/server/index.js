import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { validateSession } from "../auth/session.js";
import { authRoutes } from "./routes/auth.js";
import { runsRoutes } from "./routes/runs.js";
import { scenariosRoutes } from "./routes/scenarios.js";
import { usersRoutes } from "./routes/users.js";
import { adminsRoutes, inviteRoutes } from "./routes/admins.js";
import { scheduledRoutes } from "./routes/scheduled.js";

// origin:true reflects back whatever Origin a request sends — combined with
// credentials:true and the session cookie's sameSite:"none" (needed since
// frontend/backend are separate Render domains in prod), that disabled CORS
// entirely: any website could ride a logged-in admin's cookie and both send
// AND read the response of any authenticated endpoint (POST /api/runs
// included — this app's core feature is generating heavy traffic at an
// arbitrary targetUrl, so an open CORS hole here doubled as a way to turn a
// visiting admin's browser into a confused-deputy DDoS launcher). Fixed by
// reflecting only an explicit allowlist, same env var admins.js already uses
// for invite links.
function allowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? "http://localhost:5173";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function buildApp({ db, startRun, resolveHost }) {
  const app = Fastify({ logger: false });
  const origins = allowedOrigins();

  app.register(cookie);
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
  });

  app.get("/health", async () => ({ ok: true }));

  // публічні роути — без перевірки сесії
  app.register(authRoutes, { prefix: "/api", db });
  app.register(inviteRoutes, { prefix: "/api", db });

  // захищені роути — preHandler перевіряє сесію
  app.register(async (instance) => {
    instance.addHook("preHandler", async (req, reply) => {
      const token = req.cookies?.session;
      const session = token ? await validateSession(token, db) : null;
      if (!session) return reply.code(401).send({ message: "Unauthorized" });
      req.userId = session.userId;
    });

    instance.register(runsRoutes, { prefix: "/api", db, startRun, resolveHost });
    instance.register(scenariosRoutes, { prefix: "/api", db });
    instance.register(usersRoutes, { prefix: "/api", db });
    instance.register(adminsRoutes, { prefix: "/api", db });
    instance.register(scheduledRoutes, { prefix: "/api", db, resolveHost });
  });

  return app;
}
