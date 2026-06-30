import { orchestrate } from "./orchestrate.js";
import { runScenario } from "../worker/runScenario.js";

const DEFAULT_STEPS = [
  { action: "login" },
  { action: "send_message", payload: { text: "hello" } },
  { action: "wait", payload: { ms: 0 } },
  { action: "logout" },
];

// TODO: замінити на реальний WebSocket-клієнт цільового чат-застосунку
const stubClient = () => ({
  login: async () => {},
  sendMessage: async () => {},
  wait: async ({ ms } = {}) => new Promise(res => setTimeout(res, ms ?? 0)),
  logout: async () => {},
});

export async function runJob({ run, db, makeClient = stubClient, steps = DEFAULT_STEPS, maxParallel = 200 }) {
  await db.updateRunStatus(run.id, "running");

  const users = Array.from({ length: run.concurrency }, (_, i) => i);
  const results = await orchestrate({
    users,
    concurrency: Math.min(run.concurrency, maxParallel),
    worker: userIndex => runScenario(steps, makeClient(userIndex)),
  });

  const failed = results.some(stepResults => stepResults.some(r => !r.ok));
  await db.updateRunStatus(run.id, failed ? "failed" : "completed");
}
