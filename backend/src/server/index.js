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

export function buildApp({ db, startRun }) {
  const app = Fastify({ logger: false });

  app.register(cookie);
  app.register(cors, {
    origin: true,
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

    instance.register(runsRoutes, { prefix: "/api", db, startRun });
    instance.register(scenariosRoutes, { prefix: "/api", db });
    instance.register(usersRoutes, { prefix: "/api", db });
    instance.register(adminsRoutes, { prefix: "/api", db });
    instance.register(scheduledRoutes, { prefix: "/api", db });
  });

  return app;
}
