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
      if (!steps[r.action]) steps[r.action] = { count: 0, failed: 0, totalMs: 0, min: Infinity, max: 0, errors: [] }
      const s = steps[r.action]
      s.count++
      s.totalMs += r.ms
      if (r.ms < s.min) s.min = r.ms
      if (r.ms > s.max) s.max = r.ms
      if (!r.ok) {
        s.failed++
        if (r.error && s.errors.length < 5 && !s.errors.includes(r.error)) {
          s.errors.push(r.error)
        }
      }
    }
  }

  const stepsSummary = {}
  for (const [action, s] of Object.entries(steps)) {
    stepsSummary[action] = {
      avg: s.count ? Math.round(s.totalMs / s.count) : 0,
      min: s.min === Infinity ? 0 : s.min,
      max: s.max,
      failed: s.failed,
      errors: s.errors,
    }
  }

  return { total: passed + failed, passed, failed, steps: stepsSummary }
}

export async function runJob({ run, db, makeClient, steps, maxParallel = 200 }) {
  const scenario = run.scenario ?? {}
  const _steps = steps ?? scenario.steps ?? []
  const _makeClient = makeClient ?? (() => makeHttpClient(run.targetUrl))

  // Підбираємо пул юзерів з БД якщо вказано usersCount
  let userPool = scenario.users ?? null
  let pickedUserIds = []

  if (run.usersCount && db.pickUsers) {
    const picked = await db.pickUsers({ count: run.usersCount, targetUrl: run.targetUrl })
    if (picked.length > 0) {
      userPool = picked
      pickedUserIds = picked.map(u => u.id)
    }
  }

  await db.updateRunStatus(run.id, "running")

  const allUsers = Array.from({ length: run.concurrency }, (_, i) => i)
  const updateEvery = Math.max(1, Math.floor(run.concurrency * 0.05))
  let lastReported = 0

  const allResults = await orchestrate({
    users: allUsers,
    concurrency: Math.min(run.concurrency, maxParallel),
    worker: userIndex => {
      const user = userPool ? userPool[userIndex % userPool.length] : undefined
      return runScenario(_steps, _makeClient(userIndex), user)
    },
    onProgress: (completed, total) => {
      if (completed - lastReported >= updateEvery || completed === total) {
        lastReported = completed
        db.updateRunProgress(run.id, completed).catch(() => {})
      }
    },
  })

  const results = aggregateResults(allResults)
  const failed = results.failed > 0
  await db.updateRunStatus(run.id, failed ? "failed" : "completed", results)

  // Позначаємо юзерів як зареєстрованих у цьому додатку
  if (pickedUserIds.length > 0 && db.markUsersRegistered) {
    await db.markUsersRegistered(pickedUserIds, run.targetUrl).catch(() => {})
  }
}
