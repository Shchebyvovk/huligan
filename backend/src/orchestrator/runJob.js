import { orchestrate } from "./orchestrate.js";
import { runScenario } from "../worker/runScenario.js";
import { makeHttpClient } from "../worker/httpClient.js";

export async function runJob({ run, db, makeClient, steps, maxParallel = 200 }) {
  const _steps = steps ?? run.scenario?.steps ?? [];
  const _makeClient = makeClient ?? (userIndex => makeHttpClient(run.targetUrl));

  await db.updateRunStatus(run.id, "running");

  const users = Array.from({ length: run.concurrency }, (_, i) => i);
  const results = await orchestrate({
    users,
    concurrency: Math.min(run.concurrency, maxParallel),
    worker: userIndex => runScenario(_steps, _makeClient(userIndex)),
  });

  const failed = results.some(stepResults => stepResults.some(r => !r.ok));
  await db.updateRunStatus(run.id, failed ? "failed" : "completed");
}
