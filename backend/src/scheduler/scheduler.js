export function startScheduler(db, runJob) {
  async function tick() {
    try {
      const due = await db.getDueScheduledRuns()
      for (const s of due) {
        await db.markScheduledRunFired(s.id, s.repeatIntervalMs, s.maxIterations, s.iterationsDone)
        try {
          const scenario = await db.getScenarioByName(s.scenarioName)
          if (!scenario) continue
          const run = await db.createRun({
            scenario,
            concurrency: s.concurrency,
            targetUrl: s.targetUrl,
            usersCount: s.usersCount ?? null,
            rampUpMs: s.rampUpMs ?? 0,
          })
          runJob({ run, db }).catch(() => {})
        } catch {}
      }
    } catch {}
  }
  tick()
  return setInterval(tick, 60_000)
}
