import { runJob } from "../../orchestrator/runJob.js";

export async function runsRoutes(app, { db, startRun = runJob }) {
  app.get("/runs", async (req, reply) => {
    const runs = await db.getRuns();
    reply.send(runs);
  });

  app.post("/runs", async (req, reply) => {
    const { scenario, concurrency, targetUrl } = req.body ?? {};
    if (!scenario || concurrency == null || !targetUrl) {
      return reply.code(400).send({ message: "scenario, concurrency і targetUrl обов'язкові" });
    }
    const run = await db.createRun({ scenario, concurrency, targetUrl });
    reply.code(201).send(run);
    startRun({ run, db }).catch(err => app.log.error(err));
  });
}
