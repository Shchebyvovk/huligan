export function startScheduler(db, startRun) {
  async function tick() {
    try {
      const due = await db.getDueScheduledRuns()
      for (const s of due) {
        await db.markScheduledRunFired(s.id, s.repeatIntervalMs, s.maxIterations, s.iterationsDone)
        startRun({
          scenarioName: s.scenarioName,
          targetUrl: s.targetUrl,
          concurrency: s.concurrency,
          rampUpMs: s.rampUpMs,
          usersCount: s.usersCount ?? undefined,
        }).catch(() => {})
      }
    } catch {}
  }
  tick()
  return setInterval(tick, 60_000)
}
