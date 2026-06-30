import { orchestrate } from "./orchestrate.js";
import { runScenario } from "../worker/runScenario.js";
import { makeHttpClient } from "../worker/httpClient.js";

function aggregateResults(allResults) {
  const steps = {}
  let passed = 0
  let failed = 0

  for (const userResults of allResults) {
    const userFailed = userResults.some(r => !r.ok)
    if (userFailed) failed++; else passed++

    for (const r of userResults) {
      if (r.action === 'wait') continue
      if (!steps[r.action]) steps[r.action] = { count: 0, failed: 0, totalMs: 0, min: Infinity, max: 0 }
      const s = steps[r.action]
      s.count++
      s.totalMs += r.ms
      if (r.ms < s.min) s.min = r.ms
      if (r.ms > s.max) s.max = r.ms
      if (!r.ok) s.failed++
    }
  }

  const stepsSummary = {}
  for (const [action, s] of Object.entries(steps)) {
    stepsSummary[action] = {
      avg: s.count ? Math.round(s.totalMs / s.count) : 0,
      min: s.min === Infinity ? 0 : s.min,
      max: s.max,
      failed: s.failed,
    }
  }

  return { total: passed + failed, passed, failed, steps: stepsSummary }
}

export async function runJob({ run, db, makeClient, steps, maxParallel = 200 }) {
  const _steps = steps ?? run.scenario?.steps ?? []
  const _makeClient = makeClient ?? (() => makeHttpClient(run.targetUrl))

  await db.updateRunStatus(run.id, "running")

  const users = Array.from({ length: run.concurrency }, (_, i) => i)
  const allResults = await orchestrate({
    users,
    concurrency: Math.min(run.concurrency, maxParallel),
    worker: userIndex => runScenario(_steps, _makeClient(userIndex)),
  })

  const results = aggregateResults(allResults)
  const failed = results.failed > 0
  await db.updateRunStatus(run.id, failed ? "failed" : "completed", results)
}
