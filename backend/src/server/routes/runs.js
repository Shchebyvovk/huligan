import { runJob } from "../../orchestrator/runJob.js";

export async function runsRoutes(app, { db, startRun = runJob }) {
  app.get("/runs", async (req, reply) => {
    const maxRuns = Math.min(Math.max(Number(req.query.maxRuns) || 100, 1), 1000);
    await db.pruneRuns(maxRuns);
    const runs = await db.getRuns();
    reply.send(runs);
  });

  app.get("/runs/:id", async (req, reply) => {
    const run = await db.getRunById(Number(req.params.id));
    if (!run) return reply.code(404).send({ message: "Not found" });
    reply.send(run);
  });

  app.post("/runs", async (req, reply) => {
    const { scenario, concurrency, targetUrl, usersCount, rampUpMs } = req.body ?? {};
    if (!scenario || concurrency == null || !targetUrl) {
      return reply.code(400).send({ message: "scenario, concurrency і targetUrl обов'язкові" });
    }
    if (usersCount != null && usersCount > concurrency) {
      return reply.code(400).send({ message: "usersCount не може бути більшим за concurrency" });
    }
    const run = await db.createRun({ scenario, concurrency, targetUrl, usersCount: usersCount ?? null, rampUpMs: rampUpMs ?? 0 });
    reply.code(201).send(run);
    startRun({ run, db }).catch(err => app.log.error(err));
  });
}
